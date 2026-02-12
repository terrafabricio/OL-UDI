import { redirect } from 'next/navigation';
import { createClient } from './server';

export const getUser = async () => {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
};

export const requireAuth = async () => {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
};

export const uploadToStorage = async (file: File, path: string, bucket = 'docs') => {
  const supabase = createClient();

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
