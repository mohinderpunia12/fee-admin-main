import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// #region agent log HYPOTHESES: H2 user missing after login, H3 proxy not applied to dashboard request
const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/1a03ea7a-b0aa-4121-ba33-1e913d00c400';
const DEBUG_SESSION = 'debug-session';
// #endregion

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Server-side auth check
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION,
      runId: 'dashboard-getUser',
      hypothesisId: 'H2-H3',
      location: 'app/dashboard/page.tsx:19',
      message: 'dashboard getUser result',
      data: { hasUser: !!authUser, hasError: !!authError },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  
  if (authError || !authUser) {
    redirect('/login');
  }

  // Get user profile from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (userError || !userData) {
    redirect('/login');
  }

  // Redirect based on role
  const role = userData.role;
  switch (role) {
    case 'superuser':
      redirect('/dashboard/superuser');
    case 'school_admin':
      redirect('/dashboard/school-admin');
    case 'staff':
      redirect('/dashboard/staff');
    case 'student':
      redirect('/dashboard/student');
    case 'guard':
      redirect('/dashboard/visitors');
    default:
      redirect('/login');
  }

  // This should never render, but included for type safety
  return <LoadingSpinner />;
}
