import { redirect } from 'next/navigation';
import { createClient } from './server';
import { UnitCode } from '@/lib/types';

export const getUser = async () => {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
};

export const requireAuth = async () => {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
};

export const getProfile = async (userId: string) => {
  const supabase = createClient();
  const { data } = await supabase.from('profiles').select('id,unit_code,role').eq('id', userId).maybeSingle();
  return data;
};

export const getRequiredUnit = async (userId: string) => {
  const profile = await getProfile(userId);
  if (!profile?.unit_code) redirect('/onboarding');
  return profile.unit_code as UnitCode;
};

export const uploadToStorage = async (file: File, path: string, bucket = 'docs') => {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || 'application/octet-stream'
  });

  if (error) throw error;
  return path;
};
