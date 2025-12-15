/**
 * Supabase API Client
 * 
 * This file exports the Supabase client for use in API functions.
 * Supabase handles authentication automatically, so no interceptors are needed.
 */

import { supabase } from '@/lib/supabase/client';

// Re-export supabase client for backward compatibility
// All API functions should import from here or directly from @/lib/supabase/client
export default supabase;

/**
 * Helper function to handle Supabase errors
 */
export const handleSupabaseError = (error: any): Error => {
  if (error?.message) {
    return new Error(error.message);
  }
  return new Error('An unexpected error occurred');
};

/**
 * Helper function to check if user is authenticated
 */
export const ensureAuthenticated = async (): Promise<void> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Not authenticated');
  }
};
