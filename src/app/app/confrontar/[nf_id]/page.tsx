'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { buildAdjustmentEmail, compareDocs } from '@/lib/utils/compare';
import { AFDoc, NFDoc } from '@/lib/types';
import { toast } from 'sonner';

export default function ConfrontarDetalhePage() {
  const params = useParams<{ nf_id: string }>();
  const [nf, setNf] = useState<NFDoc | null>(null);
  const [afs, setAfs] = useState<AFDoc[]>([]);
  const [selectedAfId, setSelectedAfId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: nfData } = await supabase.from('nf_docs').select('*').eq('id', params.nf_id).single();
      const { data: afData } = await supabase.from('af_docs').select('*').order('created_at', { ascending: false }).limit(20);
      setNf(nfData);
      setAfs(afData ?? []);
      setSelectedAfId(afData?.[0]?.id ?? '');
      setLoading(false);
    };
    load();
  }, [params.nf_id]);

  const selectedAF = afs.find((af) => af.id === selectedAfId);

  const [divergences, email] = useMemo(() => {
    if (!nf || !selectedAF) return [[], ''] as const;
    const list = compareDocs(nf, { ...selectedAF, items: [] }, []);
    const draft = buildAdjustmentEmail({
      unit: nf.unit_code,
      supplier: selectedAF.supplier_name,
      af: selectedAF.af_number,
      nf: nf.nf_key,
      divergences: list.map((d) => d.description)
    });
    return [list, draft] as const;
  }, [nf, selectedAF]);

  const saveDivergences = async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !nf || !selectedAF || !divergences.length) return;

    const { error } = await supabase.from('divergences').insert(
      divergences.map((d) => ({
        nf_id: nf.id,
        af_id: selectedAF.id,
        type: d.type,
        severity: d.severity,
        description: d.description,
        created_by: userData.user.id
      }))
    );

    if (error) toast.error(error.message);
    else toast.success('Divergências salvas com sucesso.');
  };

  if (loading) return <p>Carregando confronto...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Confronto detalhado</h2>
      <Card className="space-y-4">
        <label className="text-sm font-medium">Selecione a AF</label>
        <select className="w-full rounded-lg border p-2" value={selectedAfId} onChange={(e) => setSelectedAfId(e.target.value)}>
          {afs.map((af) => (
            <option key={af.id} value={af.id}>
              {af.af_number} - {af.supplier_name}
            </option>
          ))}
        </select>
        <div className="space-y-2">
          {divergences.length ? (
            divergences.map((div, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm">{div.description}</p>
                <Badge type={div.severity} />
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Nenhuma divergência encontrada no comparador MVP.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={saveDivergences} disabled={!divergences.length}>
            Salvar divergências
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(email);
              toast.success('Template copiado.');
            }}
          >
            Gerar e-mail de ajuste (copiar)
          </Button>
        </div>
      </Card>
    </div>
  );
}
