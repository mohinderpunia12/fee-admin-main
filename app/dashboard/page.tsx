import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Server-side auth check
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  
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
