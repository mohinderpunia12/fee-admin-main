import { supabase } from '@/lib/supabase/client';
import {
  SuperuserDashboard,
  SchoolAdminDashboard,
  StaffDashboard,
  StudentDashboard,
} from '@/types';

// Superuser Dashboard
export const getSuperuserDashboard = async (): Promise<SuperuserDashboard> => {
  // Get all schools with counts
  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (schoolsError) {
    throw new Error(schoolsError.message);
  }

  // Get statistics
  const { count: totalSchools } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true });

  const { count: activeSchools } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .eq('active', true);

  const { count: inactiveSchools } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .eq('active', false);

  const today = new Date().toISOString().split('T')[0];
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysFromNowStr = sevenDaysFromNow.toISOString().split('T')[0];

  const { count: expiringSoon } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)
    .lte('subscription_end', sevenDaysFromNowStr)
    .gte('subscription_end', today);

  const { count: expiredSchools } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .lt('subscription_end', today);

  // Calculate total revenue
  const { data: paymentData } = await supabase
    .from('schools')
    .select('payment_amount')
    .not('payment_amount', 'is', null);

  const totalRevenue = paymentData?.reduce((sum, school) => {
    return sum + parseFloat(school.payment_amount || '0');
  }, 0) || 0;

  // Get schools needing attention (expired or expiring soon)
  const { data: attentionRequired } = await supabase
    .from('schools')
    .select('*')
    .or(`subscription_end.lt.${today},and(active.eq.true,subscription_end.lte.${sevenDaysFromNowStr},subscription_end.gte.${today})`)
    .order('subscription_end', { ascending: true })
    .limit(10);

  return {
    role: 'superuser',
    statistics: {
      total_schools: totalSchools || 0,
      active_schools: activeSchools || 0,
      inactive_schools: inactiveSchools || 0,
      expired_schools: expiredSchools || 0,
      expiring_soon: expiringSoon || 0,
      total_revenue: totalRevenue,
    },
    recent_schools: (schools || []).map((school: any) => ({
      ...school,
      logo_url: school.logo ? supabase.storage.from('school-logos').getPublicUrl(school.logo).data.publicUrl : null,
      is_subscription_active: school.active && (school.subscription_end ? new Date(school.subscription_end) > new Date() : false),
    })),
    attention_required: (attentionRequired || []).map((school: any) => ({
      ...school,
      logo_url: school.logo ? supabase.storage.from('school-logos').getPublicUrl(school.logo).data.publicUrl : null,
      is_subscription_active: school.active && (school.subscription_end ? new Date(school.subscription_end) > new Date() : false),
    })),
  };
};

// School Admin Dashboard
export const getSchoolAdminDashboard = async (): Promise<SchoolAdminDashboard> => {
  try {
    // Get current user's school
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error in getSchoolAdminDashboard:', authError);
      throw new Error(`Authentication failed: ${authError.message || 'Please log in again'}`);
    }
    
    if (!user) {
      throw new Error('Not authenticated. Please log in again.');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Database error fetching user in getSchoolAdminDashboard:', userError);
      throw new Error(`Failed to fetch user data: ${userError.message || 'Database error'}`);
    }

    if (!userData?.school_id) {
      throw new Error('No school associated with your account. Please contact support.');
    }

    const schoolId = userData.school_id;

    // Get school details
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single();

    if (schoolError) {
      console.error('Database error fetching school in getSchoolAdminDashboard:', schoolError);
      throw new Error(`Failed to fetch school data: ${schoolError.message || 'Database error'}`);
    }

    if (!school) {
      throw new Error('School not found. Please contact support.');
    }

  // Get statistics
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId);

  const { count: activeStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('enrollment_status', 'active');

  const { count: inactiveStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('enrollment_status', 'inactive');

  const { count: totalStaff } = await supabase
    .from('staff')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId);

  const { count: activeStaff } = await supabase
    .from('staff')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('employment_status', 'active');

  const { count: totalClassrooms } = await supabase
    .from('classrooms')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId);

  // Get current month fees
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: currentMonthFees } = await supabase
    .from('fee_records')
    .select('total_amount, paid')
    .eq('school_id', schoolId)
    .eq('month', currentMonth)
    .eq('year', currentYear);

  const feesStats = {
    total: 0,
    paid: 0,
    pending: 0,
    total_count: currentMonthFees?.length || 0,
    paid_count: 0,
    unpaid_count: 0,
  };

  currentMonthFees?.forEach((fee) => {
    const amount = parseFloat(fee.total_amount || '0');
    feesStats.total += amount;
    if (fee.paid) {
      feesStats.paid += amount;
      feesStats.paid_count++;
    } else {
      feesStats.pending += amount;
      feesStats.unpaid_count++;
    }
  });

  // Get current month salaries
  const { data: currentMonthSalaries } = await supabase
    .from('salary_records')
    .select('net_salary, paid')
    .eq('school_id', schoolId)
    .eq('month', currentMonth)
    .eq('year', currentYear);

  const salaryStats = {
    total: 0,
    paid_count: 0,
    pending_count: 0,
  };

  currentMonthSalaries?.forEach((salary) => {
    salaryStats.total += parseFloat(salary.net_salary || '0');
    if (salary.paid) {
      salaryStats.paid_count++;
    } else {
      salaryStats.pending_count++;
    }
  });

  // Get today's attendance
  const today = new Date().toISOString().split('T')[0];
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('school_id', schoolId)
    .eq('date', today)
    .not('staff_id', 'is', null);

  const attendanceStats = {
    present: 0,
    absent: 0,
    total_staff: todayAttendance?.length || 0,
  };

  todayAttendance?.forEach((att) => {
    if (att.status === 'present') {
      attendanceStats.present++;
    } else {
      attendanceStats.absent++;
    }
  });

  // Get recent students
  const { data: recentStudents } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(5);

  const daysUntilExpiry = school.subscription_end 
    ? Math.max(0, Math.ceil((new Date(school.subscription_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    role: 'school_admin',
    school: {
      id: school.id,
      name: school.name,
      mobile: school.mobile || '',
      subscription_active: school.active && (school.subscription_end ? new Date(school.subscription_end) > new Date() : false),
      subscription_end: school.subscription_end,
      days_until_expiry: daysUntilExpiry,
    },
    statistics: {
      students: {
        total: totalStudents || 0,
        active: activeStudents || 0,
        inactive: inactiveStudents || 0,
      },
      staff: {
        total: totalStaff || 0,
        active: activeStaff || 0,
      },
      classrooms: {
        total: totalClassrooms || 0,
      },
      fees_current_month: feesStats,
      salary_current_month: salaryStats,
      attendance_today: attendanceStats,
    },
    recent_students: recentStudents || [],
  };
  } catch (error: any) {
    console.error('Error in getSchoolAdminDashboard:', error);
    // Re-throw with better error message if it's not already an Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(error?.message || 'Failed to load dashboard. Please try again.');
  }
};

// Staff Dashboard
export const getStaffDashboard = async (): Promise<StaffDashboard> => {
  // Get current user's linked staff
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('linked_staff_id, school_id')
    .eq('id', user.id)
    .single();

  if (!userData?.linked_staff_id) {
    throw new Error('No linked staff found');
  }

  // Get staff details
  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('id', userData.linked_staff_id)
    .single();

  if (!staff) {
    throw new Error('Staff not found');
  }

  // Get school details
  const { data: school } = await supabase
    .from('schools')
    .select('id, name, subscription_end')
    .eq('id', userData.school_id)
    .single();

  // Get salary records
  const { data: salaryRecords } = await supabase
    .from('salary_records')
    .select('*')
    .eq('staff_id', userData.linked_staff_id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(5);

  const { count: totalSalaryRecords } = await supabase
    .from('salary_records')
    .select('*', { count: 'exact', head: true })
    .eq('staff_id', userData.linked_staff_id);

  const { count: paidSalaryRecords } = await supabase
    .from('salary_records')
    .select('*', { count: 'exact', head: true })
    .eq('staff_id', userData.linked_staff_id)
    .eq('paid', true);

  const { count: unpaidSalaryRecords } = await supabase
    .from('salary_records')
    .select('*', { count: 'exact', head: true })
    .eq('staff_id', userData.linked_staff_id)
    .eq('paid', false);

  // Get attendance records
  const { data: recentAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('staff_id', userData.linked_staff_id)
    .order('date', { ascending: false })
    .limit(10);

  const { count: totalAttendanceRecords } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('staff_id', userData.linked_staff_id);

  return {
    role: 'staff',
    staff: {
      ...staff,
      school: staff.school_id,
      profile_picture_url: staff.profile_picture ? supabase.storage.from('profiles').getPublicUrl(`staff/${staff.profile_picture}`).data.publicUrl : null,
    },
    school: {
      id: school?.id || 0,
      name: school?.name || '',
      subscription_active: school?.subscription_end ? new Date(school.subscription_end) > new Date() : false,
      subscription_end: school?.subscription_end || null,
    },
    total_salary_records: totalSalaryRecords || 0,
    paid_salary_records: paidSalaryRecords || 0,
    unpaid_salary_records: unpaidSalaryRecords || 0,
    total_attendance_records: totalAttendanceRecords || 0,
    recent_salary_records: (salaryRecords || []).map((record: any) => ({
      ...record,
      school: record.school_id,
      staff: record.staff_id,
      allowances: record.allowances || {},
      deductions: record.deductions || {},
    })),
    recent_attendance: (recentAttendance || []).map((att: any) => ({
      ...att,
      school: att.school_id,
      is_staff_attendance: true,
      is_student_attendance: false,
      is_present: att.status === 'present',
    })),
  };
};

// Student Dashboard
export const getStudentDashboard = async (): Promise<StudentDashboard> => {
  // Get current user's linked student
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('linked_student_id, school_id')
    .eq('id', user.id)
    .single();

  if (!userData?.linked_student_id) {
    throw new Error('No linked student found');
  }

  // Get student details
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', userData.linked_student_id)
    .single();

  if (!student) {
    throw new Error('Student not found');
  }

  // Get school details
  const { data: school } = await supabase
    .from('schools')
    .select('id, name, subscription_end')
    .eq('id', userData.school_id)
    .single();

  // Get fee records
  const { data: feeRecords } = await supabase
    .from('fee_records')
    .select('*')
    .eq('student_id', userData.linked_student_id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(5);

  const { count: totalFeeRecords } = await supabase
    .from('fee_records')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', userData.linked_student_id);

  const { count: paidFeeRecords } = await supabase
    .from('fee_records')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', userData.linked_student_id)
    .eq('paid', true);

  const { count: unpaidFeeRecords } = await supabase
    .from('fee_records')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', userData.linked_student_id)
    .eq('paid', false);

  // Calculate total unpaid amount
  const { data: unpaidFees } = await supabase
    .from('fee_records')
    .select('total_amount, late_fee, discount')
    .eq('student_id', userData.linked_student_id)
    .eq('paid', false);

  const totalUnpaidAmount = unpaidFees?.reduce((sum, fee) => {
    const amount = parseFloat(fee.total_amount || '0');
    const lateFee = parseFloat(fee.late_fee || '0');
    const discount = parseFloat(fee.discount || '0');
    return sum + amount + lateFee - discount;
  }, 0) || 0;

  return {
    role: 'student',
    student: {
      ...student,
      school: student.school_id,
      classroom: student.classroom_id,
      profile_picture_url: student.profile_picture ? supabase.storage.from('profiles').getPublicUrl(`students/${student.profile_picture}`).data.publicUrl : null,
    },
    school: {
      id: school?.id || 0,
      name: school?.name || '',
      subscription_active: school?.subscription_end ? new Date(school.subscription_end) > new Date() : false,
      subscription_end: school?.subscription_end || null,
    },
    total_fee_records: totalFeeRecords || 0,
    paid_fee_records: paidFeeRecords || 0,
    unpaid_fee_records: unpaidFeeRecords || 0,
    total_unpaid_amount: totalUnpaidAmount.toString(),
    recent_fee_records: (feeRecords || []).map((record: any) => {
      const finalAmount = parseFloat(record.total_amount || '0') + 
                         parseFloat(record.late_fee || '0') - 
                         parseFloat(record.discount || '0');
      return {
        ...record,
        school: record.school_id,
        student: record.student_id,
        fee_components: record.fee_components || {},
        final_amount: finalAmount.toString(),
      };
    }),
  };
};
