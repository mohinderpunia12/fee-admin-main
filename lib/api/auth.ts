import { supabase } from '@/lib/supabase/client';
import {
  LoginRequest,
  LoginResponse,
  RegisterSchoolRequest,
  User,
} from '@/types';

// Login - Note: Supabase uses email, so we need to look up email by username
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    let email = credentials.username;
    
    // Check if username is already an email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.username);
    
    if (!isEmail) {
      // Username is not an email, look it up via RPC function
      try {
        const { data: lookupEmail, error: lookupError } = await supabase.rpc('get_email_by_username', {
          username_param: credentials.username
        });
        
        if (lookupError) {
          console.error('RPC lookup error:', lookupError);
          throw new Error(`Username lookup failed: ${lookupError.message || 'Please use your email address to log in.'}`);
        }
        
        // RPC returns scalar TEXT, so data is the string directly
        if (!lookupEmail || typeof lookupEmail !== 'string' || lookupEmail.trim() === '') {
          throw new Error('Username not found. Please use your email address to log in.');
        }
        
        email = lookupEmail.trim();
        console.log('Found email for username:', email);
      } catch (lookupErr: any) {
        console.error('Username lookup error:', lookupErr);
        // Re-throw with a user-friendly message
        if (lookupErr.message && !lookupErr.message.includes('Username')) {
          throw new Error(`Login failed: ${lookupErr.message}`);
        }
        throw lookupErr;
      }
    }
    
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: credentials.password,
    });

    if (authError) {
      throw new Error(authError.message || 'Login failed. Please check your credentials.');
    }

    if (!authData.user || !authData.session) {
      throw new Error('Invalid response from server: user or session is missing');
    }

    // Get user profile from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        schools:school_id (
          id,
          name,
          email,
          mobile,
          logo,
          active,
          subscription_start,
          subscription_end,
          payment_amount,
          last_payment_date
        )
      `)
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      throw new Error(userError.message || 'Failed to fetch user profile');
    }

    if (!userData) {
      throw new Error('User profile not found');
    }

    // Map to User type
    const school = userData.schools as any;
    const user: User = {
      id: userData.id,
      username: userData.username,
      school: school?.id || null,
      school_name: school?.name,
      school_email: school?.email,
      school_mobile: school?.mobile,
      school_logo_url: school?.logo ? supabase.storage.from('school-logos').getPublicUrl(school.logo).data.publicUrl : undefined,
      role: userData.role,
      linked_staff: userData.linked_staff_id,
      linked_student: userData.linked_student_id,
      linked_guard: userData.linked_guard_id,
      created_at: userData.created_at,
      subscription_status: school ? {
        active: school.active && (school.subscription_end ? new Date(school.subscription_end) > new Date() : false),
        subscription_start: school.subscription_start,
        subscription_end: school.subscription_end,
        days_remaining: school.subscription_end ? Math.max(0, Math.ceil((new Date(school.subscription_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0,
        needs_payment: !school.active || (school.subscription_end ? new Date(school.subscription_end) <= new Date() : false),
        subscription_amount: school.payment_amount ? parseFloat(school.payment_amount) : 0,
      } : undefined,
    };

    return {
      message: 'Login successful',
      user,
      tokens: {
        access: authData.session.access_token,
        refresh: authData.session.refresh_token,
      },
      school: school ? {
        id: school.id,
        name: school.name,
        active: school.active,
      } : undefined,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register School
export const registerSchool = async (data: RegisterSchoolRequest): Promise<any> => {
  try {
    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      throw new Error(authError.message || 'Failed to create user account');
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Create school
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: data.school_name,
        mobile: data.school_mobile,
        email: data.email,
        active: false,
      })
      .select()
      .single();

    if (schoolError) {
      // Rollback: delete auth user if school creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (adminError) {
        console.error('Failed to delete auth user during rollback:', adminError);
      }
      throw new Error(schoolError.message || 'Failed to create school');
    }

    // Create user record in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username: data.username,
        school_id: schoolData.id,
        role: 'school_admin',
      })
      .select()
      .single();

    if (userError) {
      // Rollback: delete school and auth user
      await supabase.from('schools').delete().eq('id', schoolData.id);
      // Note: admin.deleteUser requires service role key, handle gracefully
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (adminError) {
        console.error('Failed to delete auth user during rollback:', adminError);
      }
      throw new Error(userError.message || 'Failed to create user record');
    }

    return {
      message: 'School registered successfully',
      user: userData,
      school: schoolData,
    };
  } catch (error: any) {
    console.error('Register school error:', error);
    throw error;
  }
};

// Get User Profile
export const getUserProfile = async (): Promise<User> => {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      throw new Error('Not authenticated');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        schools:school_id (
          id,
          name,
          email,
          mobile,
          logo,
          active,
          subscription_start,
          subscription_end,
          payment_amount,
          last_payment_date
        )
      `)
      .eq('id', authUser.id)
      .single();

    if (userError) {
      throw new Error(userError.message || 'Failed to fetch user profile');
    }

    if (!userData) {
      throw new Error('User profile not found');
    }

    // Map to User type
    const school = userData.schools as any;
    const user: User = {
      id: userData.id,
      username: userData.username,
      school: school?.id || null,
      school_name: school?.name,
      school_email: school?.email,
      school_mobile: school?.mobile,
      school_logo_url: school?.logo ? supabase.storage.from('school-logos').getPublicUrl(school.logo).data.publicUrl : undefined,
      role: userData.role,
      linked_staff: userData.linked_staff_id,
      linked_student: userData.linked_student_id,
      linked_guard: userData.linked_guard_id,
      created_at: userData.created_at,
      subscription_status: school ? {
        active: school.active && (school.subscription_end ? new Date(school.subscription_end) > new Date() : false),
        subscription_start: school.subscription_start,
        subscription_end: school.subscription_end,
        days_remaining: school.subscription_end ? Math.max(0, Math.ceil((new Date(school.subscription_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0,
        needs_payment: !school.active || (school.subscription_end ? new Date(school.subscription_end) <= new Date() : false),
        subscription_amount: school.payment_amount ? parseFloat(school.payment_amount) : 0,
      } : undefined,
    };

    return user;
  } catch (error: any) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

// Logout
export const logout = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message || 'Logout failed');
  }
};
