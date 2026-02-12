import { AppShell } from '@/components/layout/app-shell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('unit_code')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile?.unit_code) redirect('/onboarding');

  return <AppShell>{children}</AppShell>;
}
