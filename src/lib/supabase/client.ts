'use client';

import { createBrowserClient } from '@supabase/ssr';
import { assertSupabaseEnv, supabaseAnonKey, supabaseUrl } from './env';

export const createClient = () => {
  assertSupabaseEnv();
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
};
