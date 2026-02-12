'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success('Login realizado com sucesso.');
    router.replace('/app');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Recebimento Inteligente</h1>
        <p className="text-sm text-slate-600">Entre com seu email e senha.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input id="email" label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input id="password" label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
