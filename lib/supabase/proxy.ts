import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// #region agent log HYPOTHESES: H3 proxy not refreshing cookies
const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/1a03ea7a-b0aa-4121-ba33-1e913d00c400';
const DEBUG_SESSION = 'debug-session';
// #endregion

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/**
 * Proxy session refresh function for Supabase SSR.
 * 
 * This function refreshes auth tokens and updates cookies in both:
 * - request.cookies (for downstream Server Components to see updated cookies)
 * - response.cookies (for browser to receive updated cookies)
 * 
 * Server Components cannot write cookies, so this proxy pattern is required
 * to keep cookies synced for both request and response.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION,
      runId: 'proxy-entry',
      hypothesisId: 'H3',
      location: 'lib/supabase/proxy.ts:31',
      message: 'proxy start',
      data: { path: request.nextUrl.pathname },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Update request cookies so downstream Server Components see updated cookies
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set({
            name,
            value,
            ...options,
          });
        });
        
        // Create new response with updated cookies for browser
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        
        // Update response cookies so browser receives updated cookies
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        });
      },
    },
  });

  // This will refresh the session if expired and update cookies
  // Using getUser() triggers token refresh and cookie updates
  const { data, error } = await supabase.auth.getUser();

  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION,
      runId: 'proxy-getUser',
      hypothesisId: 'H3',
      location: 'lib/supabase/proxy.ts:63',
      message: 'getUser result',
      data: {
        hasUser: !!data?.user,
        hasError: !!error,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return response;
}

