import { supabase } from '@/lib/supabase/client';
import { SalaryRecord, PaginatedResponse, MarkPaidRequest, MessageResponse } from '@/types';
import { getPaginationRange } from '@/lib/supabase/pagination';

// List All Salary Records
export const listSalaryRecords = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  staff?: number;
  month?: number;
  year?: number;
  paid?: boolean;
  payment_mode?: 'cash' | 'online' | 'cheque' | 'card';
  ordering?: string;
  school?: number;
}): Promise<PaginatedResponse<SalaryRecord>> => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 10;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('salary_records')
    .select(`
      *,
      staff:staff_id (
        id,
        name,
        designation
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
  if (params?.staff) {
    query = query.eq('staff_id', params.staff);
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
  const salaryRecords: SalaryRecord[] = (data || []).map((record: any) => {
    const staff = record.staff;
    const school = record.schools;

    return {
      ...record,
      school: record.school_id,
      staff: record.staff_id,
      staff_name: staff?.name,
      staff_designation: staff?.designation,
      school_name: school?.name,
      school_email: school?.email,
      school_mobile: school?.mobile,
      school_logo_url: school?.logo ? supabase.storage.from('school-logos').getPublicUrl(school.logo).data.publicUrl : undefined,
      allowances: record.allowances || {},
      deductions: record.deductions || {},
    };
  });

  return {
    count: count || 0,
    next: page * pageSize < (count || 0) ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: salaryRecords,
  };
};

// Create Salary Record
export const createSalaryRecord = async (data: {
  staff: number;
  month: number;
  year: number;
  base_salary: string;
  allowances?: { [key: string]: number };
  deductions?: { [key: string]: number };
  bonuses?: string;
  net_salary: string;
  notes?: string;
}): Promise<SalaryRecord> => {
  // Get staff to get school_id
  const { data: staff } = await supabase
    .from('staff')
    .select('school_id')
    .eq('id', data.staff)
    .single();

  if (!staff) {
    throw new Error('Staff not found');
  }

  const insertData: any = {
    school_id: staff.school_id,
    staff_id: data.staff,
    month: data.month,
    year: data.year,
    base_salary: data.base_salary,
    allowances: data.allowances || {},
    deductions: data.deductions || {},
    bonuses: data.bonuses || '0',
    net_salary: data.net_salary,
    notes: data.notes || '',
    paid: false,
  };

  const { data: recordData, error } = await supabase
    .from('salary_records')
    .insert(insertData)
    .select(`
      *,
      staff:staff_id (
        id,
        name,
        designation
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...recordData,
    school: recordData.school_id,
    staff: recordData.staff_id,
    staff_name: recordData.staff?.name,
    staff_designation: recordData.staff?.designation,
    allowances: recordData.allowances || {},
    deductions: recordData.deductions || {},
  } as SalaryRecord;
};

// Get Salary Record Details
export const getSalaryRecord = async (id: number): Promise<SalaryRecord> => {
  const { data, error } = await supabase
    .from('salary_records')
    .select(`
      *,
      staff:staff_id (
        id,
        name,
        designation
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

  return {
    ...data,
    school: data.school_id,
    staff: data.staff_id,
    staff_name: data.staff?.name,
    staff_designation: data.staff?.designation,
    school_name: data.schools?.name,
    school_email: data.schools?.email,
    school_mobile: data.schools?.mobile,
    school_logo_url: data.schools?.logo ? supabase.storage.from('school-logos').getPublicUrl(data.schools.logo).data.publicUrl : undefined,
    allowances: data.allowances || {},
    deductions: data.deductions || {},
  } as SalaryRecord;
};

// Update Salary Record (Full)
export const updateSalaryRecord = async (id: number, data: {
  staff: number;
  month: number;
  year: number;
  base_salary: string;
  allowances: { [key: string]: number };
  deductions: { [key: string]: number };
  bonuses: string;
  net_salary: string;
  notes: string;
}): Promise<SalaryRecord> => {
  const updateData: any = {
    staff_id: data.staff,
    month: data.month,
    year: data.year,
    base_salary: data.base_salary,
    allowances: data.allowances,
    deductions: data.deductions,
    bonuses: data.bonuses,
    net_salary: data.net_salary,
    notes: data.notes,
  };

  const { error } = await supabase
    .from('salary_records')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return getSalaryRecord(id);
};

// Update Salary Record (Partial)
export const patchSalaryRecord = async (id: number, data: Partial<{
  staff: number;
  month: number;
  year: number;
  base_salary: string;
  allowances: { [key: string]: number };
  deductions: { [key: string]: number };
  bonuses: string;
  net_salary: string;
  notes: string;
}>): Promise<SalaryRecord> => {
  const updateData: any = { ...data };
  if (updateData.staff !== undefined) {
    updateData.staff_id = updateData.staff;
    delete updateData.staff;
  }

  const { error } = await supabase
    .from('salary_records')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return getSalaryRecord(id);
};

// Delete Salary Record
export const deleteSalaryRecord = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('salary_records')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

// List Unpaid Salary Records
export const listUnpaidSalaryRecords = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<SalaryRecord>> => {
  return listSalaryRecords({
    ...params,
    paid: false,
  });
};

// List Paid Salary Records
export const listPaidSalaryRecords = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<SalaryRecord>> => {
  return listSalaryRecords({
    ...params,
    paid: true,
  });
};

// Mark Salary as Paid
export const markSalaryAsPaid = async (
  id: number,
  data: MarkPaidRequest
): Promise<MessageResponse> => {
  const updateData: any = {
    paid: true,
    payment_mode: data.payment_mode,
    paid_on: data.paid_on || new Date().toISOString().split('T')[0],
  };

  const { error } = await supabase
    .from('salary_records')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return { message: 'Salary marked as paid successfully' };
};

// Generate Monthly Salaries (Bulk Create)
export const generateMonthlySalaries = async (data: {
  month: number;
  year: number;
  staff_ids?: number[];
}): Promise<MessageResponse> => {
  // Get all active staff (or specific staff if provided)
  let staffQuery = supabase
    .from('staff')
    .select('id, name, monthly_salary, school_id')
    .eq('employment_status', 'active');

  if (data.staff_ids && data.staff_ids.length > 0) {
    staffQuery = staffQuery.in('id', data.staff_ids);
  }

  const { data: staffList, error: staffError } = await staffQuery;

  if (staffError) {
    throw new Error(staffError.message);
  }

  let createdCount = 0;
  let skippedCount = 0;

  // Create salary records for each staff member
  for (const staff of staffList || []) {
    // Check if salary record already exists
    const { data: existing } = await supabase
      .from('salary_records')
      .select('id')
      .eq('staff_id', staff.id)
      .eq('month', data.month)
      .eq('year', data.year)
      .single();

    if (existing) {
      skippedCount++;
      continue;
    }

    const baseSalary = parseFloat(staff.monthly_salary || '0');
    const netSalary = baseSalary.toString(); // Can be calculated with allowances/deductions

    const { error } = await supabase
      .from('salary_records')
      .insert({
        school_id: staff.school_id,
        staff_id: staff.id,
        month: data.month,
        year: data.year,
        base_salary: baseSalary.toString(),
        allowances: {},
        deductions: {},
        bonuses: '0',
        net_salary: netSalary,
        notes: '',
        paid: false,
      });

    if (error) {
      skippedCount++;
      continue;
    }

    createdCount++;
  }

  return {
    message: `Generated ${createdCount} salary records. ${skippedCount} skipped.`,
  };
};

// Get My Salary (for Staff)
export const getMySalary = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<SalaryRecord>> => {
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

  return listSalaryRecords({
    ...params,
    staff: userData.linked_staff_id,
  });
};

// Get Download Link for Salary Slip
export const getSalaryDownloadLink = async (id: number): Promise<{
  download_url: string;
  token: string;
  expires_in: string;
  staff_name: string;
  month: number;
  year: number;
}> => {
  const record = await getSalaryRecord(id);
  
  // Generate a download token (simple implementation)
  const token = Buffer.from(`${id}:${Date.now()}`).toString('base64');
  
  return {
    download_url: `/download/salary/${id}?token=${token}`,
    token,
    expires_in: '3600',
    staff_name: record.staff_name || '',
    month: record.month,
    year: record.year,
  };
};
