import { supabase } from '@/lib/supabase/client';
import { Student, PaginatedResponse, CreateUserRequest, MessageResponse } from '@/types';
import { getPaginationRange } from '@/lib/supabase/pagination';
import { uploadStudentProfile, getPublicUrl } from '@/lib/supabase/storage';

// List All Students
export const listStudents = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  classroom?: number;
  enrollment_status?: 'active' | 'inactive';
  gender?: 'male' | 'female' | 'other';
  ordering?: string;
  school?: number;
}): Promise<PaginatedResponse<Student>> => {
  const page = params?.page || 1;
  const pageSize = params?.page_size || 10;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('students')
    .select(`
      *,
      classrooms:classroom_id (
        id,
        name,
        section
      )
    `, { count: 'exact' });

  // Apply filters
  if (params?.search) {
    query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,admission_no.ilike.%${params.search}%`);
  }
  if (params?.classroom) {
    query = query.eq('classroom_id', params.classroom);
  }
  if (params?.enrollment_status) {
    query = query.eq('enrollment_status', params.enrollment_status);
  }
  if (params?.gender) {
    query = query.eq('gender', params.gender);
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

  // Map data and add computed fields
  const students: Student[] = (data || []).map((student: any) => ({
    ...student,
    school: student.school_id,
    classroom: student.classroom_id,
    classroom_name: student.classrooms ? `${student.classrooms.name} - ${student.classrooms.section}` : undefined,
    profile_picture_url: student.profile_picture ? getPublicUrl('profiles', `students/${student.profile_picture}`) : null,
  }));

  return {
    count: count || 0,
    next: page * pageSize < (count || 0) ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: students,
  };
};

// Create Student
export const createStudent = async (data: any): Promise<Student> => {
  // Handle profile picture upload if provided
  let profilePicturePath: string | null = null;
  if (data.profile_picture instanceof File) {
    const tempId = Date.now();
    const { url, error: uploadError } = await uploadStudentProfile(tempId, data.profile_picture);
    if (uploadError) {
      throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
    }
    profilePicturePath = url.split('/storage/v1/object/public/profiles/students/')[1] || null;
  }

  const insertData: any = {
    school_id: data.school || data.school_id,
    classroom_id: data.classroom || data.classroom_id || null,
    admission_no: data.admission_no || null,
    roll_number: data.roll_number || null,
    first_name: data.first_name,
    last_name: data.last_name,
    dob: data.dob,
    gender: data.gender,
    mobile: data.mobile,
    address: data.address,
    parent_guardian_name: data.parent_guardian_name,
    parent_guardian_contact: data.parent_guardian_contact,
    enrollment_status: data.enrollment_status || 'active',
    total_amount: data.total_amount || null,
    profile_picture: profilePicturePath,
  };

  const { data: studentData, error } = await supabase
    .from('students')
    .insert(insertData)
    .select(`
      *,
      classrooms:classroom_id (
        id,
        name,
        section
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...studentData,
    school: studentData.school_id,
    classroom: studentData.classroom_id,
    classroom_name: studentData.classrooms ? `${studentData.classrooms.name} - ${studentData.classrooms.section}` : undefined,
    profile_picture_url: studentData.profile_picture ? getPublicUrl('profiles', `students/${studentData.profile_picture}`) : null,
  } as Student;
};

// Get Student Details
export const getStudent = async (id: number): Promise<Student> => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      classrooms:classroom_id (
        id,
        name,
        section
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
    classroom: data.classroom_id,
    classroom_name: data.classrooms ? `${data.classrooms.name} - ${data.classrooms.section}` : undefined,
    profile_picture_url: data.profile_picture ? getPublicUrl('profiles', `students/${data.profile_picture}`) : null,
  } as Student;
};

// Update Student (Full)
export const updateStudent = async (id: number, data: any): Promise<Student> => {
  const updateData: any = { ...data };

  // Handle profile picture upload if provided
  if (data.profile_picture instanceof File) {
    const { url, error: uploadError } = await uploadStudentProfile(id, data.profile_picture);
    if (uploadError) {
      throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
    }
    const profilePicturePath = url.split('/storage/v1/object/public/profiles/students/')[1] || null;
    updateData.profile_picture = profilePicturePath;
  }

  // Map field names
  if (updateData.school !== undefined) {
    updateData.school_id = updateData.school;
    delete updateData.school;
  }
  if (updateData.classroom !== undefined) {
    updateData.classroom_id = updateData.classroom;
    delete updateData.classroom;
  }

  const { data: studentData, error } = await supabase
    .from('students')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      classrooms:classroom_id (
        id,
        name,
        section
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...studentData,
    school: studentData.school_id,
    classroom: studentData.classroom_id,
    classroom_name: studentData.classrooms ? `${studentData.classrooms.name} - ${studentData.classrooms.section}` : undefined,
    profile_picture_url: studentData.profile_picture ? getPublicUrl('profiles', `students/${studentData.profile_picture}`) : null,
  } as Student;
};

// Update Student (Partial)
export const patchStudent = async (id: number, data: Partial<{
  classroom: number;
  admission_no: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  address: string;
  parent_guardian_name: string;
  parent_guardian_contact: string;
  enrollment_status: 'active' | 'inactive';
}>): Promise<Student> => {
  const updateData: any = { ...data };

  if (updateData.classroom !== undefined) {
    updateData.classroom_id = updateData.classroom;
    delete updateData.classroom;
  }

  const { data: studentData, error } = await supabase
    .from('students')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      classrooms:classroom_id (
        id,
        name,
        section
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...studentData,
    school: studentData.school_id,
    classroom: studentData.classroom_id,
    classroom_name: studentData.classrooms ? `${studentData.classrooms.name} - ${studentData.classrooms.section}` : undefined,
    profile_picture_url: studentData.profile_picture ? getPublicUrl('profiles', `students/${studentData.profile_picture}`) : null,
  } as Student;
};

// Delete Student
export const deleteStudent = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

// List Active Students
export const listActiveStudents = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Student>> => {
  return listStudents({
    ...params,
    enrollment_status: 'active',
  });
};

// List Inactive Students
export const listInactiveStudents = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Student>> => {
  return listStudents({
    ...params,
    enrollment_status: 'inactive',
  });
};

// Create User Account for Student
export const createStudentUser = async (
  id: number,
  data: CreateUserRequest
): Promise<MessageResponse> => {
  // Get student data first
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('school_id')
    .eq('id', id)
    .single();

  if (studentError || !student) {
    throw new Error('Student not found');
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: `${data.username}@student.local`, // Using a placeholder email
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
      school_id: student.school_id,
      role: 'student',
      linked_student_id: id,
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

  return { message: 'User account created successfully for student' };
};

// Get Students by Classroom
export const getStudentsByClassroom = async (
  classroomId: number,
  params?: {
    page?: number;
    page_size?: number;
  }
): Promise<PaginatedResponse<Student>> => {
  return listStudents({
    ...params,
    classroom: classroomId,
  });
};
