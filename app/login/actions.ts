'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface LoginActionState {
  error?: string;
}

export async function login(
  prevState: LoginActionState | null,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !authData?.session || !authData?.user) {
      return { error: 'Invalid email or password' };
    }

    // Check if user record exists
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (!userData) {
      await supabase.auth.signOut();
      return { error: 'Account not found. Please contact support.' };
    }

    revalidatePath('/', 'layout');
    redirect('/dashboard');
  } catch (error: any) {
    // Next.js redirect throws a special error, don't treat it as an error
    if (error?.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw to let Next.js handle the redirect
    }

    return { error: error?.message || 'An error occurred. Please try again.' };
  }
}

