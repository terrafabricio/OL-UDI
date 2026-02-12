'use client';

import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ReceberPage() {
  const [nfKey, setNfKey] = useState('');
  const [unitCode, setUnitCode] = useState<'9152' | '6023'>('9152');
  const [status, setStatus] = useState('Aguardando ativação da câmera.');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    if (!window.isSecureContext) {
      setStatus('Ambiente sem HTTPS. Use o modo manual para digitar a chave.');
      return;
    }

    try {
      setStatus('Procurando QR...');
      const reader = new BrowserMultiFormatReader();
      await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
        if (result) {
          setNfKey(result.getText());
          setStatus('Lido com sucesso!');
          reader.reset();
        }
      });
    } catch {
      setStatus('Erro de permissão/acesso da câmera. Digite manualmente a chave da NF.');
    }
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    let fileUrl: string | null = null;
    if (file) {
      const path = `${user.id}/nf/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('docs').upload(path, file, { upsert: true });
      if (!error) fileUrl = supabase.storage.from('docs').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from('nf_docs').insert({
      nf_key: nfKey,
      unit_code: unitCode,
      file_url: fileUrl,
      created_by: user.id
    });

    if (error) toast.error(`Falha ao salvar NF: ${error.message}`);
    else {
      toast.success('NF salva com sucesso.');
      setNfKey('');
      setFile(null);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Receber NF</h2>
      <Card className="space-y-3">
        <Button onClick={startCamera} aria-label="Ativar câmera para leitura de QR Code">
          Ativar câmera
        </Button>
        <p className="text-sm text-slate-600">{status}</p>
        <video ref={videoRef} className="w-full rounded-lg bg-slate-900" />
        <p className="text-sm text-slate-500">Não consegui ler — digitar chave manualmente.</p>
      </Card>
      <Card>
        <form onSubmit={onSave} className="space-y-4">
          <Input label="Chave NF" id="nfKey" value={nfKey} onChange={(e) => setNfKey(e.target.value)} required helperText="Confirme ou edite a chave lida." />
          <div>
            <label className="text-sm font-medium">Unidade</label>
            <select className="mt-1 w-full rounded-lg border border-slate-300 p-2" value={unitCode} onChange={(e) => setUnitCode(e.target.value as '9152' | '6023')}>
              <option value="9152">9152</option>
              <option value="6023">6023</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Foto do DANFE (opcional)</label>
            <input className="mt-1 w-full" type="file" accept="image/*" onChange={onFile} />
          </div>
          <Button disabled={loading}>{loading ? 'Salvando...' : 'Salvar NF'}</Button>
        </form>
      </Card>
    </div>
  );
}
