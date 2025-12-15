import { supabase } from '@/lib/supabase/client';
import { getPublicUrl } from '@/lib/supabase/storage';

export interface SystemSettings {
  id: number;
  monthly_subscription_amount: number;
  trial_period_days: number;
  payment_qr_code?: string;
  payment_qr_code_url?: string;
  payment_upi_id?: string;
  support_email: string;
  support_mobile: string;
  support_address: string;
  tutorial_video?: string;
  tutorial_video_url?: string;
  updated_at: string;
  updated_by?: number;
}

// Get system settings (public)
export const getSystemSettings = async (): Promise<SystemSettings> => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .maybeSingle();

  if (error) {
    // If table doesn't exist or no settings found, return default values
    if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
      return {
        id: 0,
        monthly_subscription_amount: 299,
        trial_period_days: 7,
        support_email: 'support@example.com',
        support_mobile: '+1234567890',
        support_address: '',
        updated_at: new Date().toISOString(),
      } as SystemSettings;
    }
    throw new Error(error.message);
  }

  if (!data) {
    // Return default settings if none exist
    return {
      id: 0,
      monthly_subscription_amount: 299,
      trial_period_days: 7,
      support_email: 'support@example.com',
      support_mobile: '+1234567890',
      support_address: '',
      updated_at: new Date().toISOString(),
    } as SystemSettings;
  }

  return {
    ...data,
    payment_qr_code_url: data.payment_qr_code ? getPublicUrl('system', data.payment_qr_code) : undefined,
    tutorial_video_url: data.tutorial_video ? getPublicUrl('system', data.tutorial_video) : undefined,
  } as SystemSettings;
};

// Update system settings (superuser only)
export const updateSystemSettings = async (data: Partial<SystemSettings> | FormData): Promise<SystemSettings> => {
  const updateData: any = {};

  if (data instanceof FormData) {
    // Extract values from FormData
    for (const [key, value] of data.entries()) {
      if (key === 'payment_qr_code' || key === 'tutorial_video') {
        // Handle file uploads if needed
        // For now, assume file path is provided as string
        updateData[key] = value.toString();
      } else if (key === 'monthly_subscription_amount' || key === 'trial_period_days') {
        updateData[key] = parseFloat(value.toString());
      } else {
        updateData[key] = value.toString();
      }
    }
  } else {
    Object.assign(updateData, data);
  }

  // Get current user for updated_by
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    updateData.updated_by = user.id;
  }

  const { data: settingsData, error } = await supabase
    .from('system_settings')
    .update(updateData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...settingsData,
    payment_qr_code_url: settingsData.payment_qr_code ? getPublicUrl('system', settingsData.payment_qr_code) : undefined,
    tutorial_video_url: settingsData.tutorial_video ? getPublicUrl('system', settingsData.tutorial_video) : undefined,
  } as SystemSettings;
};
