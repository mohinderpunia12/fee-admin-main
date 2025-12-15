'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// #region agent log HYPOTHESES: H1 cookie write failure, H2 auth user missing, H3 proxy not refreshing
const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/1a03ea7a-b0aa-4121-ba33-1e913d00c400';
const DEBUG_SESSION = 'debug-session';
// #endregion

export interface LoginActionState {
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
}

export async function login(
  prevState: LoginActionState | null,
  formData: FormData
): Promise<LoginActionState> {
  const email = (formData.get('email') as string | null)?.trim() || '';
  const password = formData.get('password') as string | null;

  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION,
      runId: 'pre-signin',
      hypothesisId: 'H1-H2',
      location: 'app/login/actions.ts:32',
      message: 'login action start',
      data: { emailPresent: !!email, passwordPresent: !!password, email },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  // Validate inputs
  const fieldErrors: LoginActionState['fieldErrors'] = {};
  if (!email) {
    fieldErrors.email = 'Email is required';
  }
  if (!password) {
    fieldErrors.password = 'Password is required';
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { error: 'Please correct the errors', fieldErrors };
  }

  try {
    const supabase = await createClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password: password as string,
      });

    // #region agent log
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION,
        runId: 'post-signin',
        hypothesisId: 'H1-H2',
        location: 'app/login/actions.ts:58',
        message: 'signIn result',
        data: {
          hasError: !!authError,
          hasSession: !!authData?.session,
          hasUser: !!authData?.user,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (authError || !authData.session || !authData.user) {
      return { error: 'Invalid email or password' };
    }

    // Revalidate the root layout to ensure fresh data
    revalidatePath('/', 'layout');

    // #region agent log
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION,
        runId: 'pre-redirect',
        hypothesisId: 'H1-H2',
        location: 'app/login/actions.ts:78',
        message: 'redirecting to dashboard',
        data: {},
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    // Redirect to dashboard - this happens in the same response that sets cookies
    redirect('/dashboard');
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      error: error?.message || 'An error occurred during login. Please try again.',
    };
  }
}

