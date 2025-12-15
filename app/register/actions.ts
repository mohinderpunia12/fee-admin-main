'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface RegisterSchoolActionState {
  error?: string;
}

export async function registerSchoolAction(
  prevState: RegisterSchoolActionState | null,
  formData: FormData
): Promise<RegisterSchoolActionState> {
  const mobile = (formData.get('mobile') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const password_confirm = formData.get('confirmPassword') as string;

  // Basic validation
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return { error: 'Mobile must be 10 digits' };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Valid email is required' };
  }
  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }
  if (password !== password_confirm) {
    return { error: 'Passwords do not match' };
  }

  try {
    const supabase = await createClient();

    // Check if auth user already exists (email is in auth.users, not public.users)
    // We'll let signUp handle this check

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
        return { error: 'An account with this email already exists' };
      }
      return { error: authError.message || 'Failed to create account' };
    }

    if (!authData?.user || !authData?.session) {
      return { error: 'Account creation failed. Please try again.' };
    }

    // Create school using RPC function (bypasses RLS, without name)
    const { data: schoolIdData, error: schoolError } = await supabase.rpc('create_school_for_registration', {
      p_mobile: mobile,
      p_email: email,
      p_user_id: authData.user.id
    });

    if (schoolError) {
      console.error('School creation error:', schoolError);
      await supabase.auth.signOut();
      return { error: schoolError.message || 'Failed to create school' };
    }

    // Validate that we got a school ID (bigint)
    if (!schoolIdData || typeof schoolIdData !== 'number') {
      await supabase.auth.signOut();
      return { error: 'School creation failed: Invalid response' };
    }

    const schoolId = schoolIdData;

    // Check if user record already exists (from previous failed registration)
    const { data: existingUserRecord } = await supabase
      .from('users')
      .select('id')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (existingUserRecord) {
      // User record already exists, update it instead
      const { error: userError } = await supabase
        .from('users')
        .update({
          school_id: schoolId,
          role: 'school_admin',
        })
        .eq('id', authData.user.id);

      if (userError) {
        console.error('Failed to update user record:', userError);
        await supabase.auth.signOut();
        return { error: `Failed to update user record: ${userError.message || userError.code || 'Unknown error'}` };
      }
    } else {
      // Create new user record (without username and email - email is in auth.users)
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          school_id: schoolId,
          role: 'school_admin',
        });

      if (userError) {
        console.error('Failed to create user record:', userError);
        await supabase.auth.signOut();
        return { error: `Failed to create user record: ${userError.message || userError.code || 'Unknown error'}. Code: ${userError.code || 'N/A'}` };
      }
    }

    // Verify session is set before redirecting
    const { data: { session: verifySession } } = await supabase.auth.getSession();
    if (!verifySession) {
      console.error('Session not found after registration');
      return { error: 'Registration successful but session not established. Please log in.' };
    }

    revalidatePath('/', 'layout');
    redirect('/dashboard');
  } catch (error: any) {
    // Next.js redirect throws a special error, don't treat it as an error
    if (error?.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw to let Next.js handle the redirect
    }
    console.error('Registration error:', error);
    return { error: error?.message || 'An error occurred. Please try again.' };
  }
}
