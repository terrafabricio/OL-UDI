'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export const LogoutButton = () => {
  const router = useRouter();

  const onLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <Button variant="ghost" onClick={onLogout}>
      Sair
    </Button>
  );
};
