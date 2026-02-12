'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const copy = useMemo(
    () =>
      mode === 'login'
        ? { title: 'Entrar na plataforma', button: 'Entrar', helper: 'Use seu e-mail corporativo para acessar.' }
        : { title: 'Criar conta', button: 'Criar conta', helper: 'Vamos criar seu acesso para começar os recebimentos.' },
    [mode]
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    if (mode === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError('Não foi possível entrar. Confira e-mail e senha.');
        setLoading(false);
        return;
      }
      toast.success('Login realizado com sucesso.');
      router.replace('/app');
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError('Falha ao criar conta. Tente outro e-mail ou senha mais forte.');
      setLoading(false);
      return;
    }

    toast.success('Conta criada. Agora faça login para continuar.');
    setMode('login');
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Recebimento Inteligente</h1>
        <h2 className="text-lg font-semibold">{copy.title}</h2>
        <p className="text-sm text-slate-600">{copy.helper}</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Input id="email" label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required helperText="Ex.: nome@empresa.com" />
          <Input
            id="password"
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText={mode === 'signup' ? 'Mínimo de 6 caracteres.' : undefined}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button className="w-full" disabled={loading}>
            {loading ? 'Processando...' : copy.button}
          </Button>
        </form>

        <button
          className="text-sm text-blue-700 underline-offset-2 hover:underline"
          onClick={() => setMode((prev) => (prev === 'login' ? 'signup' : 'login'))}
          type="button"
        >
          {mode === 'login' ? 'Não tem conta? Criar agora' : 'Já possui conta? Entrar'}
        </button>
      </Card>
    </div>
  );
}
