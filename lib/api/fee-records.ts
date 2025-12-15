import { supabase } from '@/lib/supabase/client';
import { FeeRecord, PaginatedResponse, MarkPaidRequest, MessageResponse } from '@/types';
import { getPaginationRange } from '@/lib/supabase/pagination';

// List All Fee Records
export const listFeeRecords = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  student?: number;
  month?: number;
  year?: number;
  paid?: boolean;
  payment_mode?: 'cash' | 'online' | 'cheque' | 'card';
  ordering?: string;
  school?: number;
}): Promise<PaginatedResponse<FeeRecord>> => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 10;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('fee_records')
    .select(`
      *,
      students:student_id (
        id,
        first_name,
        last_name,
        admission_no
      ),
      schools:school_id (
        id,
        name,
        email,
        mobile,
        logo
      )
    `, { count: 'exact' });

  // Apply filters
  if (params?.student) {
    query = query.eq('student_id', params.student);
  }
  if (params?.month) {
    query = query.eq('month', params.month);
  }
  if (params?.year) {
    query = query.eq('year', params.year);
  }
  if (params?.paid !== undefined) {
    query = query.eq('paid', params.paid);
  }
  if (params?.payment_mode) {
    query = query.eq('payment_mode', params.payment_mode);
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
    query = query.order('year', { ascending: false }).order('month', { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  // Map data
  const feeRecords: FeeRecord[] = (data || []).map((record: any) => {
    const student = record.students;
    const school = record.schools;
    const finalAmount = parseFloat(record.total_amount || '0') + 
                       parseFloat(record.late_fee || '0') - 
                       parseFloat(record.discount || '0');

    return {
      ...record,
      school: record.school_id,
      student: record.student_id,
      student_name: student ? `${student.first_name} ${student.last_name}` : undefined,
      school_name: school?.name,
      school_email: school?.email,
      school_mobile: school?.mobile,
      school_logo_url: school?.logo ? supabase.storage.from('school-logos').getPublicUrl(school.logo).data.publicUrl : undefined,
      fee_components: record.fee_components || {},
      final_amount: finalAmount.toString(),
    };
  });

  return {
    count: count || 0,
    next: page * pageSize < (count || 0) ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: feeRecords,
  };
};

// Create Fee Record
export const createFeeRecord = async (data: {
  student: number;
  month: number;
  year: number;
  academic_year: string;
  total_amount: string;
  fee_components: { [key: string]: number };
  late_fee?: string;
  discount?: string;
  notes?: string;
}): Promise<FeeRecord> => {
  // Get student to get school_id
  const { data: student } = await supabase
    .from('students')
    .select('school_id')
    .eq('id', data.student)
    .single();

  if (!student) {
    throw new Error('Student not found');
  }

  const insertData: any = {
    school_id: student.school_id,
    student_id: data.student,
    month: data.month,
    year: data.year,
    academic_year: data.academic_year,
    total_amount: data.total_amount,
    fee_components: data.fee_components || {},
    late_fee: data.late_fee || '0',
    discount: data.discount || '0',
    notes: data.notes || '',
    paid: false,
  };

  const { data: recordData, error } = await supabase
    .from('fee_records')
    .insert(insertData)
    .select(`
      *,
      students:student_id (
        id,
        first_name,
        last_name
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const finalAmount = parseFloat(recordData.total_amount || '0') + 
                     parseFloat(recordData.late_fee || '0') - 
                     parseFloat(recordData.discount || '0');

  return {
    ...recordData,
    school: recordData.school_id,
    student: recordData.student_id,
    student_name: recordData.students ? `${recordData.students.first_name} ${recordData.students.last_name}` : undefined,
    fee_components: recordData.fee_components || {},
    final_amount: finalAmount.toString(),
  } as FeeRecord;
};

// Get Fee Record Details
export const getFeeRecord = async (id: number): Promise<FeeRecord> => {
  const { data, error } = await supabase
    .from('fee_records')
    .select(`
      *,
      students:student_id (
        id,
        first_name,
        last_name,
        admission_no
      ),
      schools:school_id (
        id,
        name,
        email,
        mobile,
        logo
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const finalAmount = parseFloat(data.total_amount || '0') + 
                     parseFloat(data.late_fee || '0') - 
                     parseFloat(data.discount || '0');

  return {
    ...data,
    school: data.school_id,
    student: data.student_id,
    student_name: data.students ? `${data.students.first_name} ${data.students.last_name}` : undefined,
    school_name: data.schools?.name,
    school_email: data.schools?.email,
    school_mobile: data.schools?.mobile,
    school_logo_url: data.schools?.logo ? supabase.storage.from('school-logos').getPublicUrl(data.schools.logo).data.publicUrl : undefined,
    fee_components: data.fee_components || {},
    final_amount: finalAmount.toString(),
  } as FeeRecord;
};

// Update Fee Record (Full)
export const updateFeeRecord = async (id: number, data: {
  student: number;
  month: number;
  year: number;
  academic_year: string;
  total_amount: string;
  fee_components: { [key: string]: number };
  late_fee: string;
  discount: string;
  notes: string;
}): Promise<FeeRecord> => {
  const updateData: any = {
    student_id: data.student,
    month: data.month,
    year: data.year,
    academic_year: data.academic_year,
    total_amount: data.total_amount,
    fee_components: data.fee_components,
    late_fee: data.late_fee,
    discount: data.discount,
    notes: data.notes,
  };

  const { data: recordData, error } = await supabase
    .from('fee_records')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return getFeeRecord(id);
};

// Update Fee Record (Partial)
export const patchFeeRecord = async (id: number, data: Partial<{
  student: number;
  month: number;
  year: number;
  academic_year: string;
  total_amount: string;
  fee_components: { [key: string]: number };
  late_fee: string;
  discount: string;
  notes: string;
}>): Promise<FeeRecord> => {
  const updateData: any = { ...data };
  if (updateData.student !== undefined) {
    updateData.student_id = updateData.student;
    delete updateData.student;
  }

  const { error } = await supabase
    .from('fee_records')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return getFeeRecord(id);
};

// Delete Fee Record
export const deleteFeeRecord = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('fee_records')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

// List Unpaid Fee Records
export const listUnpaidFeeRecords = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<FeeRecord>> => {
  return listFeeRecords({
    ...params,
    paid: false,
  });
};

// List Paid Fee Records
export const listPaidFeeRecords = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<FeeRecord>> => {
  return listFeeRecords({
    ...params,
    paid: true,
  });
};

// Mark Fee as Paid
export const markFeeAsPaid = async (
  id: number,
  data: MarkPaidRequest
): Promise<MessageResponse> => {
  const updateData: any = {
    paid: true,
    payment_mode: data.payment_mode,
    paid_on: data.paid_on || new Date().toISOString().split('T')[0],
  };

  const { error } = await supabase
    .from('fee_records')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return { message: 'Fee marked as paid successfully' };
};

// Get My Fees (for Students)
export const getMyFees = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<FeeRecord>> => {
  // Get current user's linked student
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('linked_student_id')
    .eq('id', user.id)
    .single();

  if (!userData?.linked_student_id) {
    throw new Error('No linked student found');
  }

  return listFeeRecords({
    ...params,
    student: userData.linked_student_id,
  });
};

// Generate Monthly Fees (Bulk Create)
export const generateMonthlyFees = async (data: {
  classroom_id: number;
  month: number;
  year: number;
  academic_year: string;
  fee_components: { [key: string]: number };
  late_fee?: number;
  discount?: number;
  notes?: string;
}): Promise<{
  message: string;
  school: string;
  classroom: string;
  month: number;
  year: number;
  academic_year: string;
  created_count: number;
  skipped_count: number;
  created_records: Array<{
    id: number;
    student_id: number;
    student_name: string;
    admission_no: string;
    total_amount: string;
    final_amount: string;
  }>;
  skipped_records: Array<{
    student_id: number;
    student_name: string;
    admission_no: string;
    reason: string;
  }>;
}> => {
  // Get all active students in the classroom
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, first_name, last_name, admission_no, school_id')
    .eq('classroom_id', data.classroom_id)
    .eq('enrollment_status', 'active');

  if (studentsError) {
    throw new Error(studentsError.message);
  }

  // Get classroom info
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('name, section, school_id')
    .eq('id', data.classroom_id)
    .single();

  // Get school info
  const schoolId = classroom?.school_id || students[0]?.school_id;
  const { data: school } = await supabase
    .from('schools')
    .select('name')
    .eq('id', schoolId)
    .single();

  const createdRecords: any[] = [];
  const skippedRecords: any[] = [];

  // Calculate total amount from fee components
  const totalAmount = Object.values(data.fee_components).reduce((sum, val) => sum + val, 0).toString();

  // Create fee records for each student
  for (const student of students || []) {
    // Check if fee record already exists
    const { data: existing } = await supabase
      .from('fee_records')
      .select('id')
      .eq('student_id', student.id)
      .eq('month', data.month)
      .eq('year', data.year)
      .single();

    if (existing) {
      skippedRecords.push({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        admission_no: student.admission_no || '',
        reason: 'Fee record already exists for this month',
      });
      continue;
    }

    const { data: record, error } = await supabase
      .from('fee_records')
      .insert({
        school_id: student.school_id,
        student_id: student.id,
        month: data.month,
        year: data.year,
        academic_year: data.academic_year,
        total_amount: totalAmount,
        fee_components: data.fee_components,
        late_fee: (data.late_fee || 0).toString(),
        discount: (data.discount || 0).toString(),
        notes: data.notes || '',
        paid: false,
      })
      .select()
      .single();

    if (error) {
      skippedRecords.push({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        admission_no: student.admission_no || '',
        reason: error.message,
      });
      continue;
    }

    const finalAmount = parseFloat(record.total_amount || '0') + 
                       parseFloat(record.late_fee || '0') - 
                       parseFloat(record.discount || '0');

    createdRecords.push({
      id: record.id,
      student_id: student.id,
      student_name: `${student.first_name} ${student.last_name}`,
      admission_no: student.admission_no || '',
      total_amount: record.total_amount,
      final_amount: finalAmount.toString(),
    });
  }

  return {
    message: `Generated ${createdRecords.length} fee records`,
    school: school?.name || '',
    classroom: classroom ? `${classroom.name} - ${classroom.section}` : '',
    month: data.month,
    year: data.year,
    academic_year: data.academic_year,
    created_count: createdRecords.length,
    skipped_count: skippedRecords.length,
    created_records: createdRecords,
    skipped_records: skippedRecords,
  };
};

// Get Download Link for Fee Receipt
export const getFeeDownloadLink = async (id: number): Promise<{
  download_url: string;
  token: string;
  expires_in: string;
  student_name: string;
  month: number;
  year: number;
}> => {
  const record = await getFeeRecord(id);
  
  // Generate a download token (simple implementation)
  const token = Buffer.from(`${id}:${Date.now()}`).toString('base64');
  
  return {
    download_url: `/download/fee/${id}?token=${token}`,
    token,
    expires_in: '3600',
    student_name: record.student_name || '',
    month: record.month,
    year: record.year,
  };
};
