import { supabase } from '@/lib/supabase/client';
import { School, PaginatedResponse, MessageResponse, StartSubscriptionRequest } from '@/types';
import { executePaginatedQuery, getPaginationRange } from '@/lib/supabase/pagination';
import { uploadSchoolLogo, getPublicUrl } from '@/lib/supabase/storage';

// List All Schools (with pagination & filters)
export const listSchools = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  active?: boolean;
  ordering?: string;
}): Promise<PaginatedResponse<School>> => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 10;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('schools')
    .select('*', { count: 'exact' });

  // Apply filters
  if (params?.search) {
    query = query.ilike('name', `%${params.search}%`);
  }
  if (params?.active !== undefined) {
    query = query.eq('active', params.active);
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

  // Map data and add logo URLs
  const schools: School[] = (data || []).map((school: any) => ({
    ...school,
    logo_url: school.logo ? getPublicUrl('school-logos', school.logo) : null,
  }));

  return {
    count: count || 0,
    next: page * pageSize < (count || 0) ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: schools,
  };
};

// Create School
export const createSchool = async (data: {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  logo?: File;
}): Promise<School> => {
  // Upload logo if provided
  let logoPath: string | null = null;
  if (data.logo) {
    // We'll need to create the school first to get the ID, then upload logo
    // For now, use a temporary name
    const tempId = Date.now();
    const { url, error: uploadError } = await uploadSchoolLogo(tempId, data.logo);
    if (uploadError) {
      throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }
    // Extract path from URL
    logoPath = url.split('/storage/v1/object/public/school-logos/')[1] || null;
  }

  const { data: schoolData, error } = await supabase
    .from('schools')
    .insert({
      name: data.name,
      mobile: data.mobile,
      email: data.email || null,
      address: data.address || null,
      logo: logoPath,
      active: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...schoolData,
    logo_url: schoolData.logo ? getPublicUrl('school-logos', schoolData.logo) : null,
  } as School;
};

// Get School Details
export const getSchool = async (id: number): Promise<School> => {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    logo_url: data.logo ? getPublicUrl('school-logos', data.logo) : null,
  } as School;
};

// Update School (Full)
export const updateSchool = async (id: number, data: {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  logo?: File;
}): Promise<School> => {
  const updateData: any = {
    name: data.name,
    mobile: data.mobile,
    email: data.email || null,
    address: data.address || null,
  };

  // Upload new logo if provided
  if (data.logo) {
    const { url, error: uploadError } = await uploadSchoolLogo(id, data.logo);
    if (uploadError) {
      throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }
    const logoPath = url.split('/storage/v1/object/public/school-logos/')[1] || null;
    updateData.logo = logoPath;
  }

  const { data: schoolData, error } = await supabase
    .from('schools')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...schoolData,
    logo_url: schoolData.logo ? getPublicUrl('school-logos', schoolData.logo) : null,
  } as School;
};

// Update School (Partial)
export const patchSchool = async (id: number, data: Partial<{
  name: string;
  mobile: string;
  email: string;
  address: string;
  logo: File;
  payment_amount: string;
  last_payment_date: string;
}>): Promise<School> => {
  const updateData: any = { ...data };

  // Handle logo upload if provided
  if (data.logo instanceof File) {
    const { url, error: uploadError } = await uploadSchoolLogo(id, data.logo);
    if (uploadError) {
      throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }
    const logoPath = url.split('/storage/v1/object/public/school-logos/')[1] || null;
    updateData.logo = logoPath;
    delete updateData.logo; // Remove File object
  }

  const { data: schoolData, error } = await supabase
    .from('schools')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...schoolData,
    logo_url: schoolData.logo ? getPublicUrl('school-logos', schoolData.logo) : null,
  } as School;
};

// Delete School
export const deleteSchool = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('schools')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

// Start/Renew Subscription
export const startSubscription = async (
  id: number,
  data: StartSubscriptionRequest
): Promise<MessageResponse> => {
  const updateData: any = {
    active: true,
  };

  if (data.subscription_start) {
    updateData.subscription_start = data.subscription_start;
  }
  if (data.subscription_end) {
    updateData.subscription_end = data.subscription_end;
  }
  if (data.duration_months && !data.subscription_end) {
    const start = data.subscription_start ? new Date(data.subscription_start) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + data.duration_months);
    updateData.subscription_end = end.toISOString().split('T')[0];
  }
  if (data.payment_amount) {
    updateData.payment_amount = data.payment_amount;
    updateData.last_payment_date = new Date().toISOString().split('T')[0];
  }

  const { error } = await supabase
    .from('schools')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return { message: 'Subscription started successfully' };
};

// End Subscription
export const endSubscription = async (id: number): Promise<MessageResponse> => {
  const { error } = await supabase
    .from('schools')
    .update({ active: false })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return { message: 'Subscription ended successfully' };
};

// List Inactive Schools
export const listInactiveSchools = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<School>> => {
  return listSchools({
    ...params,
    active: false,
  });
};

// List Schools Expiring Soon (within 7 days)
export const listExpiringSoonSchools = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<School>> => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 10;
  const { from, to } = getPaginationRange(page, pageSize);

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysFromNowStr = sevenDaysFromNow.toISOString().split('T')[0];

  const { data, error, count } = await supabase
    .from('schools')
    .select('*', { count: 'exact' })
    .eq('active', true)
    .lte('subscription_end', sevenDaysFromNowStr)
    .gte('subscription_end', new Date().toISOString().split('T')[0])
    .order('subscription_end', { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const schools: School[] = (data || []).map((school: any) => ({
    ...school,
    logo_url: school.logo ? getPublicUrl('school-logos', school.logo) : null,
  }));

  return {
    count: count || 0,
    next: page * pageSize < (count || 0) ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: schools,
  };
};

// List Expired Schools
export const listExpiredSchools = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<School>> => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 10;
  const { from, to } = getPaginationRange(page, pageSize);

  const today = new Date().toISOString().split('T')[0];

  const { data, error, count } = await supabase
    .from('schools')
    .select('*', { count: 'exact' })
    .lt('subscription_end', today)
    .order('subscription_end', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const schools: School[] = (data || []).map((school: any) => ({
    ...school,
    logo_url: school.logo ? getPublicUrl('school-logos', school.logo) : null,
  }));

  return {
    count: count || 0,
    next: page * pageSize < (count || 0) ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: schools,
  };
};
