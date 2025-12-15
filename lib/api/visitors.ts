import { supabase } from '@/lib/supabase/client';
import { Visitor } from '@/types';
import { getPaginationRange } from '@/lib/supabase/pagination';

export const listVisitors = async (params: any = {}) => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 10;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('visitor')
    .select(`
      *,
      guard:guard_id (
        id,
        name
      )
    `, { count: 'exact' });

  if (params?.school) {
    query = query.eq('school_id', params.school);
  }
  if (params?.date) {
    query = query.eq('date', params.date);
  }
  if (params?.guard) {
    query = query.eq('guard_id', params.guard);
  }

  query = query.order('date', { ascending: false }).order('time_in', { ascending: false });

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const visitors: Visitor[] = (data || []).map((visitor: any) => ({
    ...visitor,
    school: visitor.school_id,
    guard: visitor.guard_id,
    guard_name: visitor.guard?.name,
  }));

  return {
    count: count || 0,
    next: page * pageSize < (count || 0) ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: visitors,
  };
};

export const createVisitor = async (payload: any) => {
  const insertData: any = {
    school_id: payload.school || payload.school_id,
    guard_id: payload.guard || payload.guard_id || null,
    name: payload.name,
    contact_no: payload.contact_no || '',
    purpose: payload.purpose || '',
    id_proof: payload.id_proof || '',
    vehicle_no: payload.vehicle_no || '',
    date: payload.date || new Date().toISOString().split('T')[0],
    time_in: payload.time_in || new Date().toTimeString().split(' ')[0].slice(0, 5),
    time_out: payload.time_out || null,
    notes: payload.notes || '',
  };

  const { data, error } = await supabase
    .from('visitor')
    .insert(insertData)
    .select(`
      *,
      guard:guard_id (
        id,
        name
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    school: data.school_id,
    guard: data.guard_id,
    guard_name: data.guard?.name,
  } as Visitor;
};

export const updateVisitor = async (id: number, payload: any) => {
  const updateData: any = { ...payload };

  if (updateData.school !== undefined) {
    updateData.school_id = updateData.school;
    delete updateData.school;
  }
  if (updateData.guard !== undefined) {
    updateData.guard_id = updateData.guard;
    delete updateData.guard;
  }

  const { data, error } = await supabase
    .from('visitor')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      guard:guard_id (
        id,
        name
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    school: data.school_id,
    guard: data.guard_id,
    guard_name: data.guard?.name,
  } as Visitor;
};

export const getVisitor = async (id: number) => {
  const { data, error } = await supabase
    .from('visitor')
    .select(`
      *,
      guard:guard_id (
        id,
        name
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
    guard: data.guard_id,
    guard_name: data.guard?.name,
  } as Visitor;
};

export default { listVisitors, createVisitor, updateVisitor, getVisitor };
