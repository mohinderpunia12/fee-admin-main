import { supabase } from '@/lib/supabase/client';
import { ClassRoom, PaginatedResponse, Student } from '@/types';
import { getPaginationRange } from '@/lib/supabase/pagination';

// List All ClassRooms
export const listClassRooms = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  school?: number;
}): Promise<PaginatedResponse<ClassRoom>> => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 10;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('classrooms')
    .select('*', { count: 'exact' });

  // Apply filters
  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,section.ilike.%${params.search}%`);
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
    query = query.order('name', { ascending: true }).order('section', { ascending: true });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  // Map data
  const classrooms: ClassRoom[] = (data || []).map((classroom: any) => ({
    ...classroom,
    school: classroom.school_id,
    school_name: undefined, // Can be joined if needed
  }));

  return {
    count: count || 0,
    next: page * pageSize < (count || 0) ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: classrooms,
  };
};

// Create ClassRoom
export const createClassRoom = async (data: {
  name: string;
  section: string;
  school_id?: number;
}): Promise<ClassRoom> => {
  // Get school_id from current user if not provided
  let schoolId = data.school_id;
  if (!schoolId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('school_id')
        .eq('id', user.id)
        .single();
      schoolId = userData?.school_id;
    }
  }

  if (!schoolId) {
    throw new Error('School ID is required');
  }

  const { data: classroomData, error } = await supabase
    .from('classrooms')
    .insert({
      school_id: schoolId,
      name: data.name,
      section: data.section,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...classroomData,
    school: classroomData.school_id,
  } as ClassRoom;
};

// Get ClassRoom Details
export const getClassRoom = async (id: number): Promise<ClassRoom> => {
  const { data, error } = await supabase
    .from('classrooms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    school: data.school_id,
  } as ClassRoom;
};

// Update ClassRoom (Full)
export const updateClassRoom = async (id: number, data: {
  name: string;
  section: string;
}): Promise<ClassRoom> => {
  const { data: classroomData, error } = await supabase
    .from('classrooms')
    .update({
      name: data.name,
      section: data.section,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...classroomData,
    school: classroomData.school_id,
  } as ClassRoom;
};

// Update ClassRoom (Partial)
export const patchClassRoom = async (id: number, data: Partial<{
  name: string;
  section: string;
}>): Promise<ClassRoom> => {
  const { data: classroomData, error } = await supabase
    .from('classrooms')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...classroomData,
    school: classroomData.school_id,
  } as ClassRoom;
};

// Delete ClassRoom
export const deleteClassRoom = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('classrooms')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

// List ClassRooms with Students
export const listClassRoomsWithStudents = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<ClassRoom>> => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 10;
  const { from, to } = getPaginationRange(page, pageSize);

  const { data, error, count } = await supabase
    .from('classrooms')
    .select(`
      *,
      students:students!classroom_id (
        id
      )
    `, { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const classrooms: ClassRoom[] = (data || []).map((classroom: any) => ({
    ...classroom,
    school: classroom.school_id,
    students_count: classroom.students?.length || 0,
  }));

  return {
    count: count || 0,
    next: page * pageSize < (count || 0) ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: classrooms,
  };
};

// List Empty ClassRooms
export const listEmptyClassRooms = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<ClassRoom>> => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 10;
  const { from, to } = getPaginationRange(page, pageSize);

  // Get all classrooms and filter empty ones
  const { data: allClassrooms, error: allError } = await supabase
    .from('classrooms')
    .select('id');

  if (allError) {
    throw new Error(allError.message);
  }

  const classroomIds = (allClassrooms || []).map(c => c.id);

  // Get classrooms with students
  const { data: withStudents } = await supabase
    .from('students')
    .select('classroom_id')
    .in('classroom_id', classroomIds)
    .not('classroom_id', 'is', null);

  const occupiedClassroomIds = new Set((withStudents || []).map(s => s.classroom_id));
  const emptyClassroomIds = classroomIds.filter(id => !occupiedClassroomIds.has(id));

  const { data, error, count } = await supabase
    .from('classrooms')
    .select('*', { count: 'exact' })
    .in('id', emptyClassroomIds)
    .order('name', { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const classrooms: ClassRoom[] = (data || []).map((classroom: any) => ({
    ...classroom,
    school: classroom.school_id,
    students_count: 0,
  }));

  return {
    count: count || 0,
    next: page * pageSize < (count || 0) ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: classrooms,
  };
};

// Get ClassRoom Students
export const getClassRoomStudents = async (id: number, params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Student>> => {
  // Use the students API with classroom filter
  const { listStudents } = await import('./students');
  return listStudents({
    ...params,
    classroom: id,
  });
};
