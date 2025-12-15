import { supabase } from '@/lib/supabase/client';
import { Guard } from '@/types';
import { getPaginationRange } from '@/lib/supabase/pagination';
import { uploadGuardProfile, getPublicUrl } from '@/lib/supabase/storage';

export const listGuards = async (params: any = {}) => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 10;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('guard')
    .select('*', { count: 'exact' });

  if (params?.school) {
    query = query.eq('school_id', params.school);
  }
  if (params?.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const guards: Guard[] = (data || []).map((guard: any) => ({
    ...guard,
    school: guard.school_id,
    profile_picture_url: guard.profile_picture ? getPublicUrl('profiles', `guards/${guard.profile_picture}`) : null,
  }));

  return {
    count: count || 0,
    next: page * pageSize < (count || 0) ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: guards,
  };
};

export const createGuard = async (data: any): Promise<Guard> => {
  // Handle profile picture upload if provided
  let profilePicturePath: string | null = null;
  if (data.profile_picture instanceof File) {
    const tempId = Date.now();
    const { url, error: uploadError } = await uploadGuardProfile(tempId, data.profile_picture);
    if (uploadError) {
      throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
    }
    profilePicturePath = url.split('/storage/v1/object/public/profiles/guards/')[1] || null;
  }

  const insertData: any = {
    school_id: data.school || data.school_id,
    name: data.name,
    mobile: data.mobile || '',
    shift: data.shift || '',
    employee_id: data.employee_id || null,
    profile_picture: profilePicturePath,
  };

  const { data: guardData, error } = await supabase
    .from('guard')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...guardData,
    school: guardData.school_id,
    profile_picture_url: guardData.profile_picture ? getPublicUrl('profiles', `guards/${guardData.profile_picture}`) : null,
  } as Guard;
};

export const updateGuard = async (id: number, data: any): Promise<Guard> => {
  const updateData: any = { ...data };

  // Handle profile picture upload if provided
  if (data.profile_picture instanceof File) {
    const { url, error: uploadError } = await uploadGuardProfile(id, data.profile_picture);
    if (uploadError) {
      throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
    }
    const profilePicturePath = url.split('/storage/v1/object/public/profiles/guards/')[1] || null;
    updateData.profile_picture = profilePicturePath;
  }

  if (updateData.school !== undefined) {
    updateData.school_id = updateData.school;
    delete updateData.school;
  }

  const { data: guardData, error } = await supabase
    .from('guard')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...guardData,
    school: guardData.school_id,
    profile_picture_url: guardData.profile_picture ? getPublicUrl('profiles', `guards/${guardData.profile_picture}`) : null,
  } as Guard;
};

export const deleteGuard = async (id: number) => {
  const { error } = await supabase
    .from('guard')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

export const getGuard = async (id: number) => {
  const { data, error } = await supabase
    .from('guard')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    school: data.school_id,
    profile_picture_url: data.profile_picture ? getPublicUrl('profiles', `guards/${data.profile_picture}`) : null,
  } as Guard;
};

export default { listGuards, createGuard, updateGuard, deleteGuard, getGuard };
