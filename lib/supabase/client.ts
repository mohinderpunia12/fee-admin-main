import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export function createClient() {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/1a03ea7a-b0aa-4121-ba33-1e913d00c400',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/client.ts:12',message:'createBrowserClient',data:{hasUrl:!!supabaseUrl,hasKey:!!supabaseAnonKey,urlLength:supabaseUrl?.length,keyLength:supabaseAnonKey?.length,origin:window.location.origin,hasCookies:typeof document!=='undefined'&&typeof document.cookie!=='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'prod-debug',hypothesisId:'H1-H5'})}).catch(()=>{});
  }
  // #endregion

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Legacy export for backward compatibility
export const supabase = createClient();

