import { supabase } from '@/lib/supabase/client';
import { Attendance, PaginatedResponse, BulkAttendanceRequest, MessageResponse, MonthlySummaryResponse } from '@/types';
import { getPaginationRange } from '@/lib/supabase/pagination';

// List All Attendance Records
export const listAttendanceRecords = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  staff?: number;
  student?: number;
  date?: string;
  status?: 'present' | 'absent' | 'leave' | 'half_day' | 'overtime';
  date_from?: string;
  date_to?: string;
  ordering?: string;
  school?: number;
}): Promise<PaginatedResponse<Attendance>> => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 10;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('attendance')
    .select(`
      *,
      staff:staff_id (
        id,
        name,
        designation
      ),
      students:student_id (
        id,
        first_name,
        last_name,
        admission_no,
        classroom_id
      ),
      classrooms:students!inner(classroom_id) (
        id,
        name,
        section
      )
    `, { count: 'exact' });

  // Apply filters
  if (params?.staff) {
    query = query.eq('staff_id', params.staff);
  }
  if (params?.student) {
    query = query.eq('student_id', params.student);
  }
  if (params?.date) {
    query = query.eq('date', params.date);
  }
  if (params?.date_from) {
    query = query.gte('date', params.date_from);
  }
  if (params?.date_to) {
    query = query.lte('date', params.date_to);
  }
  if (params?.status) {
    query = query.eq('status', params.status);
  }
  if (params?.school) {
    query = query.eq('school_id', params.school);
  }

  // Apply ordering
  if (params?.ordering) {
    const [field, direction] = params.ordering.startsWith('-') 
      ? [params.ordering.slice(1), 'desc']
      : [params.ordering, 'asc'];
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    query = query.order('date', { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  // Map data
  const attendanceRecords: Attendance[] = (data || []).map((record: any) => {
    const staff = record.staff;
    const student = record.students;
    const classroom = record.classrooms?.[0];

    return {
      ...record,
      school: record.school_id,
      staff: record.staff_id,
      student: record.student_id,
      staff_name: staff?.name,
      staff_designation: staff?.designation,
      student_name: student ? `${student.first_name} ${student.last_name}` : undefined,
      student_admission_no: student?.admission_no,
      classroom_name: classroom ? `${classroom.name} - ${classroom.section}` : undefined,
      is_staff_attendance: !!record.staff_id,
      is_student_attendance: !!record.student_id,
      is_present: record.status === 'present',
      is_overtime: record.status === 'overtime',
      status_display: record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' '),
    };
  });

  return {
    count: count || 0,
    next: page * pageSize < (count || 0) ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: attendanceRecords,
  };
};

// Create Attendance Record
export const createAttendanceRecord = async (data: {
  staff?: number;
  student?: number;
  date: string;
  status: 'present' | 'absent' | 'leave' | 'half_day' | 'overtime';
  hours_worked?: number;
  notes?: string;
  school_id?: number;
}): Promise<Attendance> => {
  // Get school_id if not provided
  let schoolId = data.school_id;
  if (!schoolId) {
    if (data.staff) {
      const { data: staff } = await supabase
        .from('staff')
        .select('school_id')
        .eq('id', data.staff)
        .single();
      schoolId = staff?.school_id;
    } else if (data.student) {
      const { data: student } = await supabase
        .from('students')
        .select('school_id')
        .eq('id', data.student)
        .single();
      schoolId = student?.school_id;
    }
  }

  if (!schoolId) {
    throw new Error('School ID is required');
  }

  const insertData: any = {
    school_id: schoolId,
    staff_id: data.staff || null,
    student_id: data.student || null,
    date: data.date,
    status: data.status,
    hours_worked: data.hours_worked || null,
    notes: data.notes || '',
  };

  const { data: recordData, error } = await supabase
    .from('attendance')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return getAttendanceRecord(recordData.id);
};

// Get Attendance Record Details
export const getAttendanceRecord = async (id: number): Promise<Attendance> => {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      staff:staff_id (
        id,
        name,
        designation
      ),
      students:student_id (
        id,
        first_name,
        last_name,
        admission_no,
        classroom_id
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const student = data.students;
  let classroomName: string | undefined;
  if (student?.classroom_id) {
    const { data: classroom } = await supabase
      .from('classrooms')
      .select('name, section')
      .eq('id', student.classroom_id)
      .single();
    classroomName = classroom ? `${classroom.name} - ${classroom.section}` : undefined;
  }

  return {
    ...data,
    school: data.school_id,
    staff: data.staff_id,
    student: data.student_id,
    staff_name: data.staff?.name,
    staff_designation: data.staff?.designation,
    student_name: student ? `${student.first_name} ${student.last_name}` : undefined,
    student_admission_no: student?.admission_no,
    classroom_name: classroomName,
    is_staff_attendance: !!data.staff_id,
    is_student_attendance: !!data.student_id,
    is_present: data.status === 'present',
    is_overtime: data.status === 'overtime',
    status_display: data.status.charAt(0).toUpperCase() + data.status.slice(1).replace('_', ' '),
  } as Attendance;
};

// Update Attendance Record (Full)
export const updateAttendanceRecord = async (id: number, data: {
  staff?: number;
  student?: number;
  date: string;
  status: 'present' | 'absent' | 'leave' | 'half_day' | 'overtime';
  hours_worked: number;
  notes: string;
}): Promise<Attendance> => {
  const updateData: any = {
    staff_id: data.staff || null,
    student_id: data.student || null,
    date: data.date,
    status: data.status,
    hours_worked: data.hours_worked,
    notes: data.notes,
  };

  const { error } = await supabase
    .from('attendance')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return getAttendanceRecord(id);
};

// Update Attendance Record (Partial)
export const patchAttendanceRecord = async (id: number, data: Partial<{
  staff: number;
  student: number;
  date: string;
  status: 'present' | 'absent' | 'leave' | 'half_day' | 'overtime';
  hours_worked: number;
  notes: string;
}>): Promise<Attendance> => {
  const updateData: any = { ...data };
  if (updateData.staff !== undefined) {
    updateData.staff_id = updateData.staff;
    delete updateData.staff;
  }
  if (updateData.student !== undefined) {
    updateData.student_id = updateData.student;
    delete updateData.student;
  }

  const { error } = await supabase
    .from('attendance')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return getAttendanceRecord(id);
};

// Delete Attendance Record
export const deleteAttendanceRecord = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

// Get Today's Attendance
export const getTodayAttendance = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Attendance>> => {
  const today = new Date().toISOString().split('T')[0];
  return listAttendanceRecords({
    ...params,
    date: today,
  });
};

// Bulk Mark Attendance
export const bulkMarkAttendance = async (
  data: BulkAttendanceRequest
): Promise<MessageResponse> => {
  const date = data.date || new Date().toISOString().split('T')[0];
  const schoolId = data.school;

  if (!schoolId) {
    throw new Error('School ID is required');
  }

  const records = data.staff_ids.map((staffId) => ({
    school_id: schoolId,
    staff_id: staffId,
    student_id: null,
    date,
    status: data.status,
    hours_worked: data.hours_worked || null,
    notes: data.notes || '',
  }));

  const { error } = await supabase
    .from('attendance')
    .insert(records);

  if (error) {
    throw new Error(error.message);
  }

  return { message: `Marked attendance for ${records.length} staff members` };
};

// Get Monthly Attendance Summary
export const getMonthlyAttendanceSummary = async (params: {
  staff_id?: number;
  month: number;
  year: number;
}): Promise<MonthlySummaryResponse> => {
  // Calculate date range for the month
  const startDate = `${params.year}-${String(params.month).padStart(2, '0')}-01`;
  const endDate = new Date(params.year, params.month, 0).toISOString().split('T')[0];

  let query = supabase
    .from('attendance')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);

  if (params.staff_id) {
    query = query.eq('staff_id', params.staff_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const summary = {
    present: 0,
    absent: 0,
    leave: 0,
    half_day: 0,
    overtime: 0,
  };

  const staffWiseSummary: { [key: number]: any } = {};

  (data || []).forEach((record: any) => {
    const status = record.status;
    summary[status as keyof typeof summary]++;

    if (record.staff_id) {
      if (!staffWiseSummary[record.staff_id]) {
        staffWiseSummary[record.staff_id] = {
          staff_id: record.staff_id,
          staff_name: '',
          total_days: 0,
          present: 0,
          absent: 0,
          leave: 0,
          half_day: 0,
          overtime: 0,
        };
      }
      staffWiseSummary[record.staff_id].total_days++;
      staffWiseSummary[record.staff_id][status as keyof typeof summary]++;
    }
  });

  // Get staff names
  const staffIds = Object.keys(staffWiseSummary).map(Number);
  if (staffIds.length > 0) {
    const { data: staffList } = await supabase
      .from('staff')
      .select('id, name')
      .in('id', staffIds);

    staffList?.forEach((staff) => {
      if (staffWiseSummary[staff.id]) {
        staffWiseSummary[staff.id].staff_name = staff.name;
      }
    });
  }

  return {
    month: params.month,
    year: params.year,
    total_records: data?.length || 0,
    summary,
    staff_wise_summary: Object.values(staffWiseSummary),
  };
};

// Get My Attendance (for Staff)
export const getMyAttendance = async (params?: {
  page?: number;
  page_size?: number;
  date_from?: string;
  date_to?: string;
}): Promise<PaginatedResponse<Attendance>> => {
  // Get current user's linked staff
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('linked_staff_id')
    .eq('id', user.id)
    .single();

  if (!userData?.linked_staff_id) {
    throw new Error('No linked staff found');
  }

  return listAttendanceRecords({
    ...params,
    staff: userData.linked_staff_id,
  });
};
