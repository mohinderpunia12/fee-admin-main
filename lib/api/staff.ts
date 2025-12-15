import { supabase } from '@/lib/supabase/client';
import { Staff, PaginatedResponse, CreateUserRequest, MessageResponse } from '@/types';
import { getPaginationRange } from '@/lib/supabase/pagination';
import { uploadStaffProfile, getPublicUrl } from '@/lib/supabase/storage';

// List All Staff
export const listStaff = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  employment_status?: 'active' | 'resigned';
  designation?: string;
  ordering?: string;
  school?: number;
}): Promise<PaginatedResponse<Staff>> => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 10;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('staff')
    .select('*', { count: 'exact' });

  // Apply filters
  if (params?.search) {
    query = query.ilike('name', `%${params.search}%`);
  }
  if (params?.employment_status) {
    query = query.eq('employment_status', params.employment_status);
  }
  if (params?.designation) {
    query = query.ilike('designation', `%${params.designation}%`);
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
    query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  // Map data and add profile picture URLs
  const staff: Staff[] = (data || []).map((staffMember: any) => ({
    ...staffMember,
    school: staffMember.school_id,
    profile_picture_url: staffMember.profile_picture ? getPublicUrl('profiles', `staff/${staffMember.profile_picture}`) : null,
  }));

  return {
    count: count || 0,
    next: page * pageSize < (count || 0) ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: staff,
  };
};

// Create Staff
export const createStaff = async (data: any): Promise<Staff> => {
  // Handle profile picture upload if provided
  let profilePicturePath: string | null = null;
  if (data.profile_picture instanceof File) {
    const tempId = Date.now();
    const { url, error: uploadError } = await uploadStaffProfile(tempId, data.profile_picture);
    if (uploadError) {
      throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
    }
    profilePicturePath = url.split('/storage/v1/object/public/profiles/staff/')[1] || null;
  }

  const insertData: any = {
    school_id: data.school || data.school_id,
    name: data.name,
    designation: data.designation,
    qualifications: data.qualifications,
    mobile: data.mobile,
    joining_date: data.joining_date,
    employment_status: data.employment_status || 'active',
    monthly_salary: data.monthly_salary,
    total_amount: data.total_amount || null,
    profile_picture: profilePicturePath,
    bank_account_no: data.bank_account_no || '',
    bank_name: data.bank_name || '',
    ifsc_code: data.ifsc_code || '',
  };

  const { data: staffData, error } = await supabase
    .from('staff')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...staffData,
    school: staffData.school_id,
    profile_picture_url: staffData.profile_picture ? getPublicUrl('profiles', `staff/${staffData.profile_picture}`) : null,
  } as Staff;
};

// Get Staff Details
export const getStaff = async (id: number): Promise<Staff> => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    school: data.school_id,
    profile_picture_url: data.profile_picture ? getPublicUrl('profiles', `staff/${data.profile_picture}`) : null,
  } as Staff;
};

// Update Staff (Full)
export const updateStaff = async (id: number, data: any): Promise<Staff> => {
  const updateData: any = { ...data };

  // Handle profile picture upload if provided
  if (data.profile_picture instanceof File) {
    const { url, error: uploadError } = await uploadStaffProfile(id, data.profile_picture);
    if (uploadError) {
      throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
    }
    const profilePicturePath = url.split('/storage/v1/object/public/profiles/staff/')[1] || null;
    updateData.profile_picture = profilePicturePath;
  }

  // Map field names
  if (updateData.school !== undefined) {
    updateData.school_id = updateData.school;
    delete updateData.school;
  }

  const { data: staffData, error } = await supabase
    .from('staff')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...staffData,
    school: staffData.school_id,
    profile_picture_url: staffData.profile_picture ? getPublicUrl('profiles', `staff/${staffData.profile_picture}`) : null,
  } as Staff;
};

// Update Staff (Partial)
export const patchStaff = async (id: number, data: Partial<{
  name: string;
  designation: string;
  qualifications: string;
  mobile: string;
  joining_date: string;
  employment_status: 'active' | 'resigned';
  monthly_salary: string;
  bank_account_no: string;
  bank_name: string;
  ifsc_code: string;
}>): Promise<Staff> => {
  const { data: staffData, error } = await supabase
    .from('staff')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...staffData,
    school: staffData.school_id,
    profile_picture_url: staffData.profile_picture ? getPublicUrl('profiles', `staff/${staffData.profile_picture}`) : null,
  } as Staff;
};

// Delete Staff
export const deleteStaff = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

// List Active Staff
export const listActiveStaff = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Staff>> => {
  return listStaff({
    ...params,
    employment_status: 'active',
  });
};

// List Resigned Staff
export const listResignedStaff = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Staff>> => {
  return listStaff({
    ...params,
    employment_status: 'resigned',
  });
};

// Create User Account for Staff
export const createStaffUser = async (
  id: number,
  data: CreateUserRequest
): Promise<MessageResponse> => {
  // Get staff data first
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('school_id')
    .eq('id', id)
    .single();

  if (staffError || !staff) {
    throw new Error('Staff not found');
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: `${data.username}@staff.local`, // Using a placeholder email
    password: data.password,
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Failed to create user account');
  }

  // Create user record in users table
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      username: data.username,
      school_id: staff.school_id,
      role: 'staff',
      linked_staff_id: id,
    });

  if (userError) {
    // Rollback: delete auth user
    try {
      await supabase.auth.admin.deleteUser(authData.user.id);
    } catch (adminError) {
      console.error('Failed to delete auth user during rollback:', adminError);
    }
    throw new Error(userError.message || 'Failed to create user record');
  }

  return { message: 'User account created successfully for staff' };
};
