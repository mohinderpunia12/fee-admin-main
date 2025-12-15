// User & Authentication Types
export interface User {
  id: string; // UUID from Supabase auth
  username: string | null;
  email?: string; // Email from auth.users
  school: School | number | null;
  school_name?: string;
  school_email?: string;
  school_mobile?: string;
  school_logo_url?: string;
  role: 'superuser' | 'school_admin' | 'staff' | 'student' | 'guard';
  linked_staff: number | null;
  linked_staff_name?: string;
  linked_student: number | null;
  linked_student_name?: string;
  linked_guard?: number | null;
  linked_guard_name?: string | null;
  created_at: string;
  subscription_status?: {
    active: boolean;
    subscription_start: string | null;
    subscription_end: string | null;
    days_remaining: number;
    needs_payment: boolean;
    subscription_amount: number;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
  school?: {
    id: number;
    name: string;
    active: boolean;
  };
}

export interface RegisterSchoolRequest {
  school_name: string;
  school_mobile: string;
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}

// School Types
export interface School {
  id: number;
  name: string;
  mobile: string;
  email?: string | null;
  address?: string | null;
  logo?: string | null;
  logo_url?: string | null;
  created_at: string;
  updated_at?: string;
  subscription_start: string | null;
  subscription_end: string | null;
  active: boolean;
  is_subscription_active?: boolean;
  payment_amount: string | null;
  last_payment_date: string | null;
  students_count?: number;
  staff_count?: number;
  classrooms_count?: number;
}

// ClassRoom Types
export interface ClassRoom {
  id: number;
  school: number;
  school_name?: string;
  name: string;
  section: string;
  created_at: string;
  students_count?: number;
}

// Student Types
export interface Student {
  id: number;
  school: number;
  school_name?: string;
  classroom: number;
  classroom_name?: string;
  admission_no?: string;
  roll_number?: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  address: string;
  parent_guardian_name: string;
  parent_guardian_contact: string;
  enrollment_status: 'active' | 'inactive';
  total_amount?: string;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  created_at: string;
  updated_at: string;
  has_user_account?: boolean;
}

// Staff Types
export interface Staff {
  id: number;
  school: number;
  school_name?: string;
  name: string;
  designation: string;
  qualifications: string;
  mobile: string;
  joining_date: string;
  employment_status: 'active' | 'resigned';
  monthly_salary: string;
  total_amount?: string;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  bank_account_no?: string;
  bank_name?: string;
  ifsc_code?: string;
  created_at: string;
  updated_at: string;
  has_user_account?: boolean;
}

// Guard Types
export interface Guard {
  id: number;
  school: number;
  school_name?: string;
  name: string;
  mobile?: string;
  shift?: string;
  employee_id?: string | null;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  created_at: string;
  updated_at: string;
}

// Visitor Types
export interface Visitor {
  id: number;
  school: number;
  school_name?: string;
  guard?: number | null;
  guard_name?: string | null;
  name: string;
  contact_no?: string;
  purpose?: string;
  id_proof?: string;
  vehicle_no?: string;
  date: string;
  time_in?: string | null;
  time_out?: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// FeeRecord Types
export interface FeeRecord {
  id: number;
  school: number;
  school_name?: string;
  school_email?: string;
  school_mobile?: string;
  school_logo_url?: string;
  student: number;
  student_name?: string;
  month: number;
  year: number;
  academic_year: string;
  total_amount: string;
  paid: boolean;
  paid_on: string | null;
  payment_mode: 'cash' | 'online' | 'cheque' | 'card' | null;
  fee_components: {
    [key: string]: number;
  };
  late_fee: string;
  discount: string;
  notes: string;
  created_at: string;
  updated_at: string;
  final_amount?: string;
}

// SalaryRecord Types
export interface SalaryRecord {
  id: number;
  school: number;
  school_name?: string;
  school_email?: string;
  school_mobile?: string;
  school_logo_url?: string;
  staff: number;
  staff_name?: string;
  staff_designation?: string;
  month: number;
  year: number;
  base_salary: string;
  allowances: {
    [key: string]: number;
  };
  deductions: {
    [key: string]: number;
  };
  bonuses: string;
  net_salary: string;
  paid: boolean;
  paid_on: string | null;
  payment_mode: 'cash' | 'online' | 'cheque' | 'card' | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Attendance Types
export interface Attendance {
  id: number;
  school: number;
  school_name?: string;
  
  // Staff fields (null if student attendance)
  staff?: number | null;
  staff_name?: string | null;
  staff_designation?: string | null;
  
  // Student fields (null if staff attendance)
  student?: number | null;
  student_name?: string | null;
  student_admission_no?: string | null;
  classroom_name?: string | null;
  
  // Common fields
  date: string;
  status: 'present' | 'absent' | 'leave' | 'half_day' | 'overtime';
  hours_worked?: number | null;
  notes: string;
  status_display?: string;
  is_present?: boolean;
  is_overtime?: boolean;
  is_staff_attendance?: boolean;
  is_student_attendance?: boolean;
  created_at: string;
  updated_at: string;
}

// Dashboard Types
export interface SuperuserDashboard {
  role: string;
  statistics: {
    total_schools: number;
    active_schools: number;
    inactive_schools: number;
    expired_schools: number;
    expiring_soon: number;
    total_revenue: number;
  };
  recent_schools: School[];
  attention_required: School[];
}

export interface SchoolAdminDashboard {
  role: string;
  school: {
    id: number;
    name: string;
    subscription_active: boolean;
    subscription_end: string | null;
    days_until_expiry: number | null;
  };
  statistics: {
    students: {
      total: number;
      active: number;
      inactive: number;
    };
    staff: {
      total: number;
      active: number;
    };
    classrooms: {
      total: number;
    };
    fees_current_month: {
      total: number;
      paid: number;
      pending: number;
      total_count: number;
      paid_count: number;
      unpaid_count: number;
    };
    salary_current_month: {
      total: number;
      paid_count: number;
      pending_count: number;
    };
    attendance_today: {
      present: number;
      absent: number;
      total_staff: number;
    };
  };
  recent_students: any[];
}

export interface StaffDashboard {
  role: string;
  staff: Staff;
  school: {
    id: number;
    name: string;
    subscription_active: boolean;
    subscription_end: string | null;
  };
  total_salary_records: number;
  paid_salary_records: number;
  unpaid_salary_records: number;
  total_attendance_records: number;
  recent_salary_records: SalaryRecord[];
  recent_attendance: Attendance[];
}

export interface StudentDashboard {
  role: string;
  student: Student;
  school: {
    id: number;
    name: string;
    subscription_active: boolean;
    subscription_end: string | null;
  };
  total_fee_records: number;
  paid_fee_records: number;
  unpaid_fee_records: number;
  total_unpaid_amount: string;
  recent_fee_records: FeeRecord[];
}

// Pagination Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API Response Types
export interface ApiError {
  detail?: string;
  error?: string;
  [key: string]: any;
}

export interface MessageResponse {
  message: string;
  detail?: string;
  [key: string]: any;
}

// Form Types
export interface CreateUserRequest {
  username: string;
  password: string;
}

export interface MarkPaidRequest {
  payment_mode: 'cash' | 'online' | 'cheque' | 'card';
  paid_on?: string;
}

export interface StartSubscriptionRequest {
  subscription_start?: string;
  subscription_end?: string;
  duration_months?: number;
  payment_amount?: string;
}

export interface BulkAttendanceRequest {
  date?: string;
  status: 'present' | 'absent' | 'leave' | 'half_day' | 'overtime';
  staff_ids: number[];
  hours_worked?: number;
  notes?: string;
  school?: number;
}

export interface GenerateMonthlySalariesRequest {
  month: number;
  year: number;
  staff_ids?: number[];
}

export interface MonthlySummaryResponse {
  month: number;
  year: number;
  total_records: number;
  summary: {
    present: number;
    absent: number;
    leave: number;
    half_day: number;
    overtime: number;
  };
  staff_wise_summary: Array<{
    staff_id: number;
    staff_name: string;
    total_days: number;
    present: number;
    absent: number;
    leave: number;
    half_day: number;
    overtime: number;
  }>;
}
