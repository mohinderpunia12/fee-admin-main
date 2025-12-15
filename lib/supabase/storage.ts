import { supabase } from './client';

/**
 * Upload a file to Supabase Storage
 */
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }
): Promise<{ data: { path: string } | null; error: Error | null }> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || '3600',
      contentType: options?.contentType || file.type,
      upsert: options?.upsert || false,
    });

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
};

/**
 * Get public URL for a file in Supabase Storage
 */
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Delete a file from Supabase Storage
 */
export const deleteFile = async (
  bucket: string,
  path: string
): Promise<{ data: any; error: Error | null }> => {
  const { data, error } = await supabase.storage.from(bucket).remove([path]);
  return { data, error };
};

/**
 * Upload school logo
 */
export const uploadSchoolLogo = async (
  schoolId: number,
  file: File
): Promise<{ url: string; error: Error | null }> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${schoolId}_${Date.now()}.${fileExt}`;
  const filePath = `school-logos/${fileName}`;

  const { data, error } = await uploadFile('school-logos', filePath, file);

  if (error) {
    return { url: '', error };
  }

  const publicUrl = getPublicUrl('school-logos', filePath);
  return { url: publicUrl, error: null };
};

/**
 * Upload student profile picture
 */
export const uploadStudentProfile = async (
  studentId: number,
  file: File
): Promise<{ url: string; error: Error | null }> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${studentId}_${Date.now()}.${fileExt}`;
  const filePath = `profiles/students/${fileName}`;

  const { data, error } = await uploadFile('profiles', filePath, file);

  if (error) {
    return { url: '', error };
  }

  const publicUrl = getPublicUrl('profiles', filePath);
  return { url: publicUrl, error: null };
};

/**
 * Upload staff profile picture
 */
export const uploadStaffProfile = async (
  staffId: number,
  file: File
): Promise<{ url: string; error: Error | null }> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${staffId}_${Date.now()}.${fileExt}`;
  const filePath = `profiles/staff/${fileName}`;

  const { data, error } = await uploadFile('profiles', filePath, file);

  if (error) {
    return { url: '', error };
  }

  const publicUrl = getPublicUrl('profiles', filePath);
  return { url: publicUrl, error: null };
};

/**
 * Upload guard profile picture
 */
export const uploadGuardProfile = async (
  guardId: number,
  file: File
): Promise<{ url: string; error: Error | null }> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${guardId}_${Date.now()}.${fileExt}`;
  const filePath = `profiles/guards/${fileName}`;

  const { data, error } = await uploadFile('profiles', filePath, file);

  if (error) {
    return { url: '', error };
  }

  const publicUrl = getPublicUrl('profiles', filePath);
  return { url: publicUrl, error: null };
};

/**
 * Upload payment receipt
 */
export const uploadPaymentReceipt = async (
  recordId: number,
  recordType: 'fee' | 'salary',
  file: File
): Promise<{ url: string; error: Error | null }> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${recordType}_${recordId}_${Date.now()}.${fileExt}`;
  const filePath = `payment-receipts/${recordType}/${fileName}`;

  const { data, error } = await uploadFile('payment-receipts', filePath, file);

  if (error) {
    return { url: '', error };
  }

  const publicUrl = getPublicUrl('payment-receipts', filePath);
  return { url: publicUrl, error: null };
};

