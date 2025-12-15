#!/usr/bin/env python3
"""
Data Migration Script: Django/MySQL to Supabase
This script migrates all data from the Django backend to Supabase.
"""

import mysql.connector
from supabase import create_client, Client
import json
from datetime import datetime
import secrets
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
MYSQL_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', ''),
    'port': int(os.getenv('DB_PORT', 3306))
}

SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://rmvyespupcbdzwmwjekq.supabase.co')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')  # Service role key for admin operations

# Media files path
MEDIA_ROOT = Path(__file__).parent / 'backend' / 'media'

# Initialize clients
print("Connecting to MySQL...")
try:
    mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
    mysql_cursor = mysql_conn.cursor(dictionary=True)
    print("✓ Connected to MySQL")
except Exception as e:
    print(f"✗ Failed to connect to MySQL: {e}")
    exit(1)

print("Connecting to Supabase...")
try:
    # Create Supabase client - simple initialization for migration script
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    # Test connection by making a simple query
    test_result = supabase.table('schools').select('id').limit(1).execute()
    print("✓ Connected to Supabase")
except Exception as e:
    print(f"✗ Failed to connect to Supabase: {e}")
    print(f"  URL: {SUPABASE_URL}")
    print(f"  Service Key: {'Set' if SUPABASE_SERVICE_KEY else 'NOT SET (required!)'}")
    if not SUPABASE_SERVICE_KEY:
        print("\n  ⚠ Make sure you set SUPABASE_SERVICE_KEY in your .env file")
        print("  Get it from: Supabase Dashboard → Settings → API → service_role key")
    exit(1)

# Mapping dictionaries
mappings = {
    'schools': {},
    'classrooms': {},
    'students': {},
    'staff': {},
    'guards': {},
    'users': {},
}

def generate_email_from_username(username, school_id=None):
    """Generate a unique email from username for Supabase Auth"""
    if school_id:
        return f"{username}@school{school_id}.local"
    return f"{username}@migrated.local"

def migrate_schools():
    """Migrate schools data"""
    print("\n" + "="*50)
    print("STEP 1: Migrating Schools...")
    print("="*50)
    
    mysql_cursor.execute("""
        SELECT id, name, mobile, email, address, logo, 
               subscription_start, subscription_end, active,
               payment_amount, last_payment_date,
               created_at, updated_at
        FROM schools
        ORDER BY id
    """)
    
    schools = mysql_cursor.fetchall()
    print(f"Found {len(schools)} schools to migrate")
    
    for school in schools:
        try:
            # Handle logo path if it exists
            logo_path = None
            if school['logo']:
                # Extract filename from path
                logo_path = school['logo'].split('/')[-1] if '/' in str(school['logo']) else str(school['logo'])
            
            school_data = {
                'name': school['name'],
                'mobile': school['mobile'],
                'email': school['email'] if school['email'] else None,
                'address': school['address'] if school['address'] else None,
                'logo': logo_path,
                'subscription_start': school['subscription_start'].isoformat() if school['subscription_start'] else None,
                'subscription_end': school['subscription_end'].isoformat() if school['subscription_end'] else None,
                'active': bool(school['active']) if school['active'] is not None else False,
                'payment_amount': str(school['payment_amount']) if school['payment_amount'] else None,
                'last_payment_date': school['last_payment_date'].isoformat() if school['last_payment_date'] else None,
                'created_at': school['created_at'].isoformat() if school['created_at'] else None,
                'updated_at': school['updated_at'].isoformat() if school['updated_at'] else None,
            }
            
            # Insert into Supabase
            result = supabase.table('schools').insert(school_data).execute()
            if result.data:
                new_id = result.data[0]['id']
                mappings['schools'][school['id']] = new_id
                print(f"  ✓ Migrated school: {school['name']} (ID: {school['id']} -> {new_id})")
            else:
                print(f"  ✗ Failed to migrate school: {school['name']}")
        except Exception as e:
            print(f"  ✗ Error migrating school {school['name']}: {str(e)}")
    
    print(f"\n✓ Completed: {len(mappings['schools'])} schools migrated")
    return mappings['schools']

def migrate_classrooms(school_id_mapping):
    """Migrate classrooms data"""
    print("\n" + "="*50)
    print("STEP 2: Migrating Classrooms...")
    print("="*50)
    
    mysql_cursor.execute("""
        SELECT id, school_id, name, section, created_at, updated_at
        FROM classrooms
        ORDER BY id
    """)
    
    classrooms = mysql_cursor.fetchall()
    print(f"Found {len(classrooms)} classrooms to migrate")
    
    for classroom in classrooms:
        try:
            new_school_id = school_id_mapping.get(classroom['school_id'])
            if not new_school_id:
                print(f"  ⚠ Skipping classroom {classroom['name']}: school not found")
                continue
            
            classroom_data = {
                'school_id': new_school_id,
                'name': classroom['name'],
                'section': classroom['section'],
                'created_at': classroom['created_at'].isoformat() if classroom['created_at'] else None,
                'updated_at': classroom['updated_at'].isoformat() if classroom['updated_at'] else None,
            }
            
            result = supabase.table('classrooms').insert(classroom_data).execute()
            if result.data:
                new_id = result.data[0]['id']
                mappings['classrooms'][classroom['id']] = new_id
                print(f"  ✓ Migrated classroom: {classroom['name']} - {classroom['section']} (ID: {classroom['id']} -> {new_id})")
        except Exception as e:
            print(f"  ✗ Error migrating classroom {classroom['name']}: {str(e)}")
    
    print(f"\n✓ Completed: {len(mappings['classrooms'])} classrooms migrated")
    return mappings['classrooms']

def migrate_students(school_id_mapping, classroom_id_mapping):
    """Migrate students data"""
    print("\n" + "="*50)
    print("STEP 3: Migrating Students...")
    print("="*50)
    
    mysql_cursor.execute("""
        SELECT id, school_id, classroom_id, admission_no, roll_number,
               first_name, last_name, dob, gender, mobile, address,
               parent_guardian_name, parent_guardian_contact,
               enrollment_status, total_amount, profile_picture,
               created_at, updated_at
        FROM students
        ORDER BY id
    """)
    
    students = mysql_cursor.fetchall()
    print(f"Found {len(students)} students to migrate")
    
    for student in students:
        try:
            new_school_id = school_id_mapping.get(student['school_id'])
            if not new_school_id:
                print(f"  ⚠ Skipping student {student['first_name']}: school not found")
                continue
            
            new_classroom_id = classroom_id_mapping.get(student['classroom_id']) if student['classroom_id'] else None
            
            student_data = {
                'school_id': new_school_id,
                'classroom_id': new_classroom_id,
                'admission_no': student['admission_no'] if student['admission_no'] else None,
                'roll_number': student['roll_number'] if student['roll_number'] else None,
                'first_name': student['first_name'],
                'last_name': student['last_name'],
                'dob': student['dob'].isoformat() if student['dob'] else None,
                'gender': student['gender'],
                'mobile': student['mobile'],
                'address': student['address'],
                'parent_guardian_name': student['parent_guardian_name'],
                'parent_guardian_contact': student['parent_guardian_contact'],
                'enrollment_status': student['enrollment_status'] if student['enrollment_status'] else 'active',
                'total_amount': str(student['total_amount']) if student['total_amount'] else None,
                'profile_picture': student['profile_picture'],  # Will handle file upload separately
                'created_at': student['created_at'].isoformat() if student['created_at'] else None,
                'updated_at': student['updated_at'].isoformat() if student['updated_at'] else None,
            }
            
            result = supabase.table('students').insert(student_data).execute()
            if result.data:
                new_id = result.data[0]['id']
                mappings['students'][student['id']] = new_id
                print(f"  ✓ Migrated student: {student['first_name']} {student['last_name']} (ID: {student['id']} -> {new_id})")
        except Exception as e:
            print(f"  ✗ Error migrating student {student.get('first_name', 'Unknown')}: {str(e)}")
    
    print(f"\n✓ Completed: {len(mappings['students'])} students migrated")
    return mappings['students']

def migrate_staff(school_id_mapping):
    """Migrate staff data"""
    print("\n" + "="*50)
    print("STEP 4: Migrating Staff...")
    print("="*50)
    
    mysql_cursor.execute("""
        SELECT id, school_id, name, designation, qualifications, mobile,
               joining_date, employment_status, monthly_salary, total_amount,
               profile_picture, bank_account_no, bank_name, ifsc_code,
               created_at, updated_at
        FROM staff
        ORDER BY id
    """)
    
    staff_list = mysql_cursor.fetchall()
    print(f"Found {len(staff_list)} staff members to migrate")
    
    for staff in staff_list:
        try:
            new_school_id = school_id_mapping.get(staff['school_id'])
            if not new_school_id:
                print(f"  ⚠ Skipping staff {staff['name']}: school not found")
                continue
            
            staff_data = {
                'school_id': new_school_id,
                'name': staff['name'],
                'designation': staff['designation'],
                'qualifications': staff['qualifications'],
                'mobile': staff['mobile'],
                'joining_date': staff['joining_date'].isoformat() if staff['joining_date'] else None,
                'employment_status': staff['employment_status'] if staff['employment_status'] else 'active',
                'monthly_salary': str(staff['monthly_salary']) if staff['monthly_salary'] else None,
                'total_amount': str(staff['total_amount']) if staff['total_amount'] else None,
                'profile_picture': staff['profile_picture'],
                'bank_account_no': staff['bank_account_no'] if staff['bank_account_no'] else '',
                'bank_name': staff['bank_name'] if staff['bank_name'] else '',
                'ifsc_code': staff['ifsc_code'] if staff['ifsc_code'] else '',
                'created_at': staff['created_at'].isoformat() if staff['created_at'] else None,
                'updated_at': staff['updated_at'].isoformat() if staff['updated_at'] else None,
            }
            
            result = supabase.table('staff').insert(staff_data).execute()
            if result.data:
                new_id = result.data[0]['id']
                mappings['staff'][staff['id']] = new_id
                print(f"  ✓ Migrated staff: {staff['name']} (ID: {staff['id']} -> {new_id})")
        except Exception as e:
            print(f"  ✗ Error migrating staff {staff.get('name', 'Unknown')}: {str(e)}")
    
    print(f"\n✓ Completed: {len(mappings['staff'])} staff members migrated")
    return mappings['staff']

def migrate_guards(school_id_mapping):
    """Migrate guards data"""
    print("\n" + "="*50)
    print("STEP 5: Migrating Guards...")
    print("="*50)
    
    mysql_cursor.execute("""
        SELECT id, school_id, name, mobile, shift, employee_id, profile_picture,
               created_at, updated_at
        FROM guard
        ORDER BY id
    """)
    
    guards = mysql_cursor.fetchall()
    print(f"Found {len(guards)} guards to migrate")
    
    guard_mapping = {}
    for guard in guards:
        try:
            new_school_id = school_id_mapping.get(guard['school_id'])
            if not new_school_id:
                continue
            
            guard_data = {
                'school_id': new_school_id,
                'name': guard['name'],
                'mobile': guard['mobile'] if guard['mobile'] else '',
                'shift': guard['shift'] if guard['shift'] else '',
                'employee_id': guard['employee_id'] if guard['employee_id'] else None,
                'profile_picture': guard['profile_picture'],
                'created_at': guard['created_at'].isoformat() if guard['created_at'] else None,
                'updated_at': guard['updated_at'].isoformat() if guard['updated_at'] else None,
            }
            
            result = supabase.table('guard').insert(guard_data).execute()
            if result.data:
                new_id = result.data[0]['id']
                guard_mapping[guard['id']] = new_id
                print(f"  ✓ Migrated guard: {guard['name']} (ID: {guard['id']} -> {new_id})")
        except Exception as e:
            print(f"  ✗ Error migrating guard {guard.get('name', 'Unknown')}: {str(e)}")
    
    print(f"\n✓ Completed: {len(guard_mapping)} guards migrated")
    return guard_mapping

def migrate_users(school_id_mapping, staff_id_mapping, student_id_mapping, guard_id_mapping):
    """Migrate users and create Supabase Auth accounts"""
    print("\n" + "="*50)
    print("STEP 6: Migrating Users (Creating Auth Accounts)...")
    print("="*50)
    
    # First, get all schools with their emails for school_admin users
    mysql_cursor.execute("""
        SELECT id, email FROM schools WHERE email IS NOT NULL AND email != ''
    """)
    school_emails = {row['id']: row['email'] for row in mysql_cursor.fetchall()}
    
    mysql_cursor.execute("""
        SELECT id, username, password, email, first_name, last_name,
               is_superuser, is_active, date_joined, last_login,
               school_id, role, linked_staff_id, linked_student_id, linked_guard_id
        FROM users
        ORDER BY id
    """)
    
    users = mysql_cursor.fetchall()
    print(f"Found {len(users)} users to migrate")
    print("\n⚠ NOTE: Passwords cannot be migrated directly.")
    print("   Users will need to reset their passwords after migration.")
    print("   Temporary passwords will be generated.\n")
    
    temp_passwords = {}
    
    for user in users:
        try:
            # Determine email for Supabase Auth
            email = None
            
            # Priority 1: User's own email
            if user['email']:
                email = user['email']
            # Priority 2: For school_admin, use school's email
            elif user['role'] == 'school_admin' and user['school_id']:
                email = school_emails.get(user['school_id'])
            # Priority 3: Generate from username
            if not email:
                email = generate_email_from_username(
                    user['username'], 
                    user['school_id']
                )
            
            # Map school_id
            new_school_id = school_id_mapping.get(user['school_id']) if user['school_id'] else None
            
            # Map linked IDs
            new_linked_staff_id = staff_id_mapping.get(user['linked_staff_id']) if user['linked_staff_id'] else None
            new_linked_student_id = student_id_mapping.get(user['linked_student_id']) if user['linked_student_id'] else None
            new_linked_guard_id = guard_id_mapping.get(user['linked_guard_id']) if user['linked_guard_id'] else None
            
            # Generate temporary password
            temp_password = secrets.token_urlsafe(12)
            temp_passwords[user['username']] = temp_password
            
            # Create Supabase Auth user
            try:
                auth_response = supabase.auth.admin.create_user({
                    "email": email,
                    "password": temp_password,
                    "email_confirm": True,
                    "user_metadata": {
                        "username": user['username'],
                        "migrated_from_django": True,
                        "old_user_id": user['id']
                    }
                })
                
                if not auth_response.user:
                    print(f"  ✗ Failed to create auth user for {user['username']}")
                    continue
                
                new_user_id = auth_response.user.id
                
                # Create user record in public.users table
                user_data = {
                    'id': new_user_id,  # Use auth user's UUID
                    'username': user['username'],
                    'school_id': new_school_id,
                    'role': user['role'] if user['role'] else 'school_admin',
                    'linked_staff_id': new_linked_staff_id,
                    'linked_student_id': new_linked_student_id,
                    'linked_guard_id': new_linked_guard_id,
                    'created_at': user['date_joined'].isoformat() if user['date_joined'] else None,
                }
                
                result = supabase.table('users').insert(user_data).execute()
                
                if result.data:
                    mappings['users'][user['id']] = new_user_id
                    email_source = "user email" if user['email'] else ("school email" if user['role'] == 'school_admin' and user['school_id'] in school_emails else "generated")
                    print(f"  ✓ Migrated user: {user['username']} (ID: {user['id']} -> UUID: {new_user_id[:8]}...)")
                    print(f"    Email: {email} ({email_source}), Temp Password: {temp_password}")
                else:
                    # Rollback: delete auth user
                    try:
                        supabase.auth.admin.delete_user(new_user_id)
                    except:
                        pass
                    print(f"  ✗ Failed to create user record for {user['username']}")
                    
            except Exception as e:
                print(f"  ✗ Error creating auth user for {user['username']}: {str(e)}")
                continue
                
        except Exception as e:
            print(f"  ✗ Error migrating user {user.get('username', 'Unknown')}: {str(e)}")
            continue
    
    # Save temporary passwords to file
    with open('temp_passwords.json', 'w') as f:
        json.dump(temp_passwords, f, indent=2)
    print(f"\n⚠ Temporary passwords saved to temp_passwords.json")
    print("   Share these with users or ask them to reset passwords.")
    
    print(f"\n✓ Completed: {len(mappings['users'])} users migrated")
    return mappings['users']

def migrate_fee_records(school_id_mapping, student_id_mapping):
    """Migrate fee records"""
    print("\n" + "="*50)
    print("STEP 7: Migrating Fee Records...")
    print("="*50)
    
    mysql_cursor.execute("""
        SELECT id, school_id, student_id, month, year, academic_year,
               fee_components, total_amount, late_fee, discount,
               paid, paid_on, payment_mode, notes, created_at, updated_at
        FROM fee_records
        ORDER BY id
    """)
    
    records = mysql_cursor.fetchall()
    print(f"Found {len(records)} fee records to migrate")
    
    count = 0
    for record in records:
        try:
            new_school_id = school_id_mapping.get(record['school_id'])
            new_student_id = student_id_mapping.get(record['student_id'])
            
            if not new_school_id or not new_student_id:
                continue
            
            # Handle JSON field
            fee_components = {}
            if record['fee_components']:
                try:
                    if isinstance(record['fee_components'], str):
                        fee_components = json.loads(record['fee_components'])
                    else:
                        fee_components = record['fee_components']
                except:
                    fee_components = {}
            
            fee_data = {
                'school_id': new_school_id,
                'student_id': new_student_id,
                'month': record['month'],
                'year': record['year'],
                'academic_year': record['academic_year'],
                'fee_components': fee_components,
                'total_amount': str(record['total_amount']) if record['total_amount'] else None,
                'late_fee': str(record['late_fee']) if record['late_fee'] else '0',
                'discount': str(record['discount']) if record['discount'] else '0',
                'paid': bool(record['paid']) if record['paid'] is not None else False,
                'paid_on': record['paid_on'].isoformat() if record['paid_on'] else None,
                'payment_mode': record['payment_mode'] if record['payment_mode'] else '',
                'notes': record['notes'] if record['notes'] else '',
                'created_at': record['created_at'].isoformat() if record['created_at'] else None,
                'updated_at': record['updated_at'].isoformat() if record['updated_at'] else None,
            }
            
            result = supabase.table('fee_records').insert(fee_data).execute()
            if result.data:
                count += 1
        except Exception as e:
            print(f"  ✗ Error migrating fee record {record.get('id')}: {str(e)}")
    
    print(f"\n✓ Completed: {count} fee records migrated")
    return count

def migrate_salary_records(school_id_mapping, staff_id_mapping):
    """Migrate salary records"""
    print("\n" + "="*50)
    print("STEP 8: Migrating Salary Records...")
    print("="*50)
    
    mysql_cursor.execute("""
        SELECT id, school_id, staff_id, month, year,
               base_salary, allowances, deductions, bonuses, net_salary,
               paid, paid_on, payment_mode, notes, created_at, updated_at
        FROM salary_records
        ORDER BY id
    """)
    
    records = mysql_cursor.fetchall()
    print(f"Found {len(records)} salary records to migrate")
    
    count = 0
    for record in records:
        try:
            new_school_id = school_id_mapping.get(record['school_id'])
            new_staff_id = staff_id_mapping.get(record['staff_id'])
            
            if not new_school_id or not new_staff_id:
                continue
            
            # Handle JSON fields
            allowances = {}
            deductions = {}
            if record['allowances']:
                try:
                    if isinstance(record['allowances'], str):
                        allowances = json.loads(record['allowances'])
                    else:
                        allowances = record['allowances']
                except:
                    allowances = {}
            
            if record['deductions']:
                try:
                    if isinstance(record['deductions'], str):
                        deductions = json.loads(record['deductions'])
                    else:
                        deductions = record['deductions']
                except:
                    deductions = {}
            
            salary_data = {
                'school_id': new_school_id,
                'staff_id': new_staff_id,
                'month': record['month'],
                'year': record['year'],
                'base_salary': str(record['base_salary']) if record['base_salary'] else None,
                'allowances': allowances,
                'deductions': deductions,
                'bonuses': str(record['bonuses']) if record['bonuses'] else '0',
                'net_salary': str(record['net_salary']) if record['net_salary'] else None,
                'paid': bool(record['paid']) if record['paid'] is not None else False,
                'paid_on': record['paid_on'].isoformat() if record['paid_on'] else None,
                'payment_mode': record['payment_mode'] if record['payment_mode'] else '',
                'notes': record['notes'] if record['notes'] else '',
                'created_at': record['created_at'].isoformat() if record['created_at'] else None,
                'updated_at': record['updated_at'].isoformat() if record['updated_at'] else None,
            }
            
            result = supabase.table('salary_records').insert(salary_data).execute()
            if result.data:
                count += 1
        except Exception as e:
            print(f"  ✗ Error migrating salary record {record.get('id')}: {str(e)}")
    
    print(f"\n✓ Completed: {count} salary records migrated")
    return count

def migrate_attendance(school_id_mapping, staff_id_mapping, student_id_mapping):
    """Migrate attendance records"""
    print("\n" + "="*50)
    print("STEP 9: Migrating Attendance Records...")
    print("="*50)
    
    mysql_cursor.execute("""
        SELECT id, school_id, staff_id, student_id, date, status,
               hours_worked, notes, created_at, updated_at
        FROM attendance
        ORDER BY id
    """)
    
    records = mysql_cursor.fetchall()
    print(f"Found {len(records)} attendance records to migrate")
    
    count = 0
    for record in records:
        try:
            new_school_id = school_id_mapping.get(record['school_id'])
            if not new_school_id:
                continue
            
            new_staff_id = staff_id_mapping.get(record['staff_id']) if record['staff_id'] else None
            new_student_id = student_id_mapping.get(record['student_id']) if record['student_id'] else None
            
            attendance_data = {
                'school_id': new_school_id,
                'staff_id': new_staff_id,
                'student_id': new_student_id,
                'date': record['date'].isoformat() if record['date'] else None,
                'status': record['status'],
                'hours_worked': float(record['hours_worked']) if record['hours_worked'] else None,
                'notes': record['notes'] if record['notes'] else '',
                'created_at': record['created_at'].isoformat() if record['created_at'] else None,
                'updated_at': record['updated_at'].isoformat() if record['updated_at'] else None,
            }
            
            result = supabase.table('attendance').insert(attendance_data).execute()
            if result.data:
                count += 1
        except Exception as e:
            print(f"  ✗ Error migrating attendance record {record.get('id')}: {str(e)}")
    
    print(f"\n✓ Completed: {count} attendance records migrated")
    return count

def migrate_visitors(school_id_mapping, guard_id_mapping):
    """Migrate visitor records"""
    print("\n" + "="*50)
    print("STEP 10: Migrating Visitors...")
    print("="*50)
    
    mysql_cursor.execute("""
        SELECT id, school_id, guard_id, name, contact_no, purpose,
               id_proof, vehicle_no, date, time_in, time_out, notes,
               created_at, updated_at
        FROM visitor
        ORDER BY id
    """)
    
    records = mysql_cursor.fetchall()
    print(f"Found {len(records)} visitor records to migrate")
    
    count = 0
    for record in records:
        try:
            new_school_id = school_id_mapping.get(record['school_id'])
            if not new_school_id:
                continue
            
            new_guard_id = guard_id_mapping.get(record['guard_id']) if record['guard_id'] else None
            
            visitor_data = {
                'school_id': new_school_id,
                'guard_id': new_guard_id,
                'name': record['name'],
                'contact_no': record['contact_no'] if record['contact_no'] else '',
                'purpose': record['purpose'] if record['purpose'] else '',
                'id_proof': record['id_proof'] if record['id_proof'] else '',
                'vehicle_no': record['vehicle_no'] if record['vehicle_no'] else '',
                'date': record['date'].isoformat() if record['date'] else None,
                'time_in': str(record['time_in']) if record['time_in'] else None,
                'time_out': str(record['time_out']) if record['time_out'] else None,
                'notes': record['notes'] if record['notes'] else '',
                'created_at': record['created_at'].isoformat() if record['created_at'] else None,
                'updated_at': record['updated_at'].isoformat() if record['updated_at'] else None,
            }
            
            result = supabase.table('visitor').insert(visitor_data).execute()
            if result.data:
                count += 1
        except Exception as e:
            print(f"  ✗ Error migrating visitor record {record.get('id')}: {str(e)}")
    
    print(f"\n✓ Completed: {count} visitor records migrated")
    return count

def main():
    print("\n" + "="*60)
    print("DJANGO TO SUPABASE DATA MIGRATION")
    print("="*60)
    print("\nThis script will migrate all data from Django/MySQL to Supabase.")
    print("Make sure you have:")
    print("  1. MySQL database credentials configured")
    print("  2. Supabase Service Role Key")
    print("  3. Backed up your data")
    print("\nStarting migration...\n")
    
    try:
        # Step 1: Migrate schools
        school_id_mapping = migrate_schools()
        
        # Step 2: Migrate classrooms
        classroom_id_mapping = migrate_classrooms(school_id_mapping)
        
        # Step 3: Migrate students
        student_id_mapping = migrate_students(school_id_mapping, classroom_id_mapping)
        
        # Step 4: Migrate staff
        staff_id_mapping = migrate_staff(school_id_mapping)
        
        # Step 5: Migrate guards
        guard_id_mapping = migrate_guards(school_id_mapping)
        
        # Step 6: Migrate users (creates auth accounts)
        user_id_mapping = migrate_users(school_id_mapping, staff_id_mapping, student_id_mapping, guard_id_mapping)
        
        # Step 7: Migrate fee records
        fee_count = migrate_fee_records(school_id_mapping, student_id_mapping)
        
        # Step 8: Migrate salary records
        salary_count = migrate_salary_records(school_id_mapping, staff_id_mapping)
        
        # Step 9: Migrate attendance
        attendance_count = migrate_attendance(school_id_mapping, staff_id_mapping, student_id_mapping)
        
        # Step 10: Migrate visitors
        visitor_count = migrate_visitors(school_id_mapping, guard_id_mapping)
        
        # Save mappings for reference
        mappings['classrooms'] = classroom_id_mapping
        mappings['guards'] = guard_id_mapping
        
        with open('migration_mappings.json', 'w') as f:
            json.dump(mappings, f, indent=2)
        
        print("\n" + "="*60)
        print("MIGRATION SUMMARY")
        print("="*60)
        print(f"✓ Schools: {len(school_id_mapping)}")
        print(f"✓ Classrooms: {len(classroom_id_mapping)}")
        print(f"✓ Students: {len(student_id_mapping)}")
        print(f"✓ Staff: {len(staff_id_mapping)}")
        print(f"✓ Guards: {len(guard_id_mapping)}")
        print(f"✓ Users: {len(user_id_mapping)}")
        print(f"✓ Fee Records: {fee_count}")
        print(f"✓ Salary Records: {salary_count}")
        print(f"✓ Attendance Records: {attendance_count}")
        print(f"✓ Visitor Records: {visitor_count}")
        print("\n✓ Mappings saved to: migration_mappings.json")
        print("✓ Temporary passwords saved to: temp_passwords.json")
        print("\n⚠ IMPORTANT NEXT STEPS:")
        print("  1. Upload media files to Supabase Storage")
        print("  2. Share temporary passwords with users or ask them to reset")
        print("  3. Verify data integrity in Supabase dashboard")
        print("="*60)
        
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        mysql_conn.close()
        print("\n✓ Database connections closed")

if __name__ == '__main__':
    main()

