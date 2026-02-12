import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { assertSupabaseEnv, supabaseAnonKey, supabaseUrl } from './env';

export const createClient = () => {
  assertSupabaseEnv();
  const cookieStore = cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options) {
        cookieStore.set({ name, value: '', ...options });
      }
    }
  });
};
