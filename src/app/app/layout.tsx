import { AppShell } from '@/components/layout/app-shell';
import { getRequiredUnit, requireAuth } from '@/lib/supabase/data';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  await getRequiredUnit(user.id);

  return <AppShell>{children}</AppShell>;
}
