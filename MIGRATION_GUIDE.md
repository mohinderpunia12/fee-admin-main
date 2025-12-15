# Data Migration Guide: Django/MySQL to Supabase

## Step-by-Step Migration Instructions

### Step 1: Access Django Admin Panel

The Django server should now be running. Access it at:
- **URL**: http://localhost:8000/admin/
- **Login**: Use your Django superuser credentials

Browse through the admin panel to see:
- Schools
- Users
- Students
- Staff
- Classrooms
- Fee Records
- Salary Records
- Attendance
- Guards
- Visitors

### Step 2: Install Migration Dependencies

```bash
cd "/Users/wiredtechie/Downloads/fee-admin-main 3"
pip install -r migration_requirements.txt
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root with your credentials:

```bash
# MySQL Database Configuration (from your Django settings)
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
DB_PORT=3306

# Supabase Configuration
SUPABASE_URL=https://rmvyespupcbdzwmwjekq.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

**To get your Supabase Service Role Key:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy the "service_role" key (NOT the anon key)

### Step 4: Run the Migration

```bash
python migrate_to_supabase.py
```

The script will:
1. ✅ Migrate all schools
2. ✅ Migrate all classrooms
3. ✅ Migrate all students
4. ✅ Migrate all staff
5. ✅ Migrate all guards
6. ✅ Create Supabase Auth users (with temporary passwords)
7. ✅ Migrate all fee records
8. ✅ Migrate all salary records
9. ✅ Migrate all attendance records
10. ✅ Migrate all visitor records

### Step 5: Handle Temporary Passwords

After migration, a file `temp_passwords.json` will be created with temporary passwords for all users.

**Options:**
- **Option A**: Share temporary passwords with users
- **Option B**: Ask users to reset passwords using "Forgot Password" feature
- **Option C**: Use Supabase Admin API to set passwords (if you have plain passwords)

### Step 6: Upload Media Files

Media files (logos, profile pictures) need to be uploaded to Supabase Storage separately.

**Storage Buckets to Create:**
- `school-logos`
- `profiles` (with subfolders: `students/`, `staff/`, `guards/`)
- `payment-receipts`

**Manual Upload:**
1. Go to Supabase Dashboard → Storage
2. Create the buckets
3. Upload files from `backend/media/` directory

### Step 7: Verify Migration

1. Check Supabase Dashboard → Table Editor
2. Verify record counts match
3. Test login with migrated users
4. Verify relationships (foreign keys)

## Important Notes

### Password Migration
- Django passwords are hashed and cannot be migrated directly
- All users will have temporary passwords
- Users should reset passwords after first login

### Email Requirements
- Supabase Auth requires email addresses
- The script generates emails from usernames: `username@school{id}.local`
- You can update emails later in Supabase Dashboard

### File Uploads
- Profile pictures and logos are referenced but not automatically uploaded
- You need to manually upload files to Supabase Storage
- Update file paths in the database if needed

### Data Integrity
- All foreign key relationships are preserved
- ID mappings are saved in `migration_mappings.json`
- Use this file if you need to reference old IDs

## Troubleshooting

### Connection Errors
- Verify MySQL credentials
- Check Supabase Service Role Key
- Ensure database is accessible

### Foreign Key Errors
- Ensure schools are migrated before other entities
- Check that all referenced IDs exist in mappings

### Auth User Creation Fails
- Verify Service Role Key has admin permissions
- Check email format (must be valid email)

## Files Created

- `migration_mappings.json` - ID mappings (old → new)
- `temp_passwords.json` - Temporary passwords for users

## Next Steps After Migration

1. ✅ Test login with migrated users
2. ✅ Upload media files to Supabase Storage
3. ✅ Update frontend environment variables
4. ✅ Deploy frontend to Vercel
5. ✅ Test all functionality

