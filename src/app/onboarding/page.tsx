'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const [unit, setUnit] = useState<'9152' | '6023'>('9152');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.replace('/login');
      return;
    }

    await supabase.from('profiles').upsert({ id: userData.user.id, unit_code: unit, updated_at: new Date().toISOString() });
    router.replace('/app');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold">Bem-vindo! Defina sua unidade padrão</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <select className="w-full rounded-lg border border-slate-300 p-2" value={unit} onChange={(e) => setUnit(e.target.value as '9152' | '6023')}>
            <option value="9152">9152</option>
            <option value="6023">6023</option>
          </select>
          <Button disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Continuar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
