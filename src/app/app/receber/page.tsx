'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { UnitCode } from '@/lib/types';

export default function ReceberPage() {
  const [nfKey, setNfKey] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [unitCode, setUnitCode] = useState<UnitCode>('9152');
  const [status, setStatus] = useState('Aguardando ativação da câmera.');
  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase.from('profiles').select('unit_code').eq('id', userData.user.id).maybeSingle();
      if (data?.unit_code) setUnitCode(data.unit_code);
    };
    loadProfile();

    return () => readerRef.current?.reset();
  }, []);

  const startCamera = async () => {
    if (!window.isSecureContext) {
      setCameraError('Sem HTTPS, a câmera pode não funcionar. Use o modo manual.');
      setStatus('Use o campo abaixo para digitar a chave da NF manualmente.');
      return;
    }

    try {
      setStatus('Procurando QR...');
      setCameraError(null);
      setCameraOn(true);

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
        if (!result) return;
        setNfKey(result.getText());
        setStatus('QR lido com sucesso. Confirme e salve.');
        reader.reset();
        setCameraOn(false);
      });
    } catch {
      setCameraError('Permissão negada ou câmera indisponível.');
      setStatus('Não foi possível usar a câmera. Digite a chave manualmente.');
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    readerRef.current?.reset();
    setCameraOn(false);
    setStatus('Câmera desativada.');
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!nfKey.trim()) {
      toast.error('A chave da NF é obrigatória.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setLoading(false);
      return;
    }

    let filePath: string | null = null;
    if (file) {
      filePath = `${user.id}/nf/${Date.now()}-${file.name}`;
      const upload = await supabase.storage.from('docs').upload(filePath, file, { upsert: true });
      if (upload.error) {
        toast.error('Não foi possível anexar a imagem do DANFE. Salvando NF sem anexo.');
        filePath = null;
      }
    }

    const { error } = await supabase.from('nf_docs').insert({
      nf_key: nfKey.trim(),
      supplier_name: supplierName.trim() || null,
      unit_code: unitCode,
      file_path: filePath,
      created_by: user.id
    });

    if (error) toast.error(`Falha ao salvar NF: ${error.message}`);
    else {
      toast.success('NF salva com sucesso.');
      setNfKey('');
      setSupplierName('');
      setFile(null);
      stopCamera();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Receber NF</h2>
      <Card className="space-y-3">
        <div className="flex gap-2">
          <Button onClick={startCamera} aria-label="Ativar câmera para leitura de QR Code" disabled={cameraOn}>
            Ativar câmera
          </Button>
          {cameraOn ? (
            <Button onClick={stopCamera} variant="secondary" aria-label="Desativar câmera">
              Desativar câmera
            </Button>
          ) : null}
        </div>

        <p className="text-sm text-slate-600">{status}</p>
        {cameraError ? <p className="text-sm text-amber-700">{cameraError}</p> : null}
        <video ref={videoRef} className="w-full rounded-lg bg-slate-900" />
        <p className="text-sm text-slate-500">Não conseguiu ler? Use o campo abaixo para digitar manualmente.</p>
      </Card>

      <Card>
        <form onSubmit={onSave} className="space-y-4">
          <Input label="Chave NF" id="nfKey" value={nfKey} onChange={(e) => setNfKey(e.target.value)} required helperText="Cole ou revise a chave capturada pelo QR." />
          <Input label="Fornecedor (opcional)" id="supplierName" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} helperText="Ajuda no confronto AF x NF." />
          <div>
            <label className="text-sm font-medium">Unidade</label>
            <select className="mt-1 w-full rounded-lg border border-slate-300 p-2" value={unitCode} onChange={(e) => setUnitCode(e.target.value as UnitCode)}>
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
