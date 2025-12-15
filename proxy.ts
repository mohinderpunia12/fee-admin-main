import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

/**
 * Proxy function for Supabase SSR cookie refresh.
 * 
 * This replaces middleware.ts for auth cookie management.
 * The proxy pattern is required because Server Components cannot write cookies.
 * This ensures cookies are refreshed and synced before Server Components run.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

// Default export for Next.js proxy detection compatibility
export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

