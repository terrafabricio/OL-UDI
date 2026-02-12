'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { buildAdjustmentEmail, compareDocs } from '@/lib/utils/compare';
import { AFDoc, AFItem, NFDoc, NFItem } from '@/lib/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConfrontarDetalhePage() {
  const params = useParams<{ nf_id: string }>();
  const [nf, setNf] = useState<NFDoc | null>(null);
  const [nfItems, setNfItems] = useState<NFItem[]>([]);
  const [afs, setAfs] = useState<AFDoc[]>([]);
  const [afItems, setAfItems] = useState<AFItem[]>([]);
  const [selectedAfId, setSelectedAfId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: nfData } = await supabase.from('nf_docs').select('*').eq('id', params.nf_id).single();
      const { data: nfItemsData } = await supabase.from('nf_items').select('product_name,qty,unit,price').eq('nf_id', params.nf_id);
      const { data: afData } = await supabase.from('af_docs').select('*').order('created_at', { ascending: false }).limit(20);

      setNf(nfData);
      setNfItems(nfItemsData ?? []);
      setAfs(afData ?? []);

      const nextAf = afData?.[0]?.id ?? '';
      setSelectedAfId(nextAf);

      if (nextAf) {
        const { data: afItemsData } = await supabase.from('af_items').select('product_name,qty,unit,price').eq('af_id', nextAf);
        setAfItems(afItemsData ?? []);
      }

      setLoading(false);
    };

    load();
  }, [params.nf_id]);

  useEffect(() => {
    const loadAfItems = async () => {
      if (!selectedAfId) {
        setAfItems([]);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase.from('af_items').select('product_name,qty,unit,price').eq('af_id', selectedAfId);
      setAfItems(data ?? []);
    };

    loadAfItems();
  }, [selectedAfId]);

  const selectedAF = afs.find((af) => af.id === selectedAfId);

  const [divergences, email] = useMemo(() => {
    if (!nf || !selectedAF) return [[], ''] as const;

    const list = compareDocs(nf, selectedAF, nfItems, afItems);

    const draft = buildAdjustmentEmail({
      unit: nf.unit_code,
      supplier: selectedAF.supplier_name,
      af: selectedAF.af_number,
      nf: nf.nf_key,
      divergences: list.map((d) => d.description),
      attachments: [selectedAF.file_path || 'Sem arquivo de AF', nf.file_path || 'Sem arquivo de NF']
    });

    return [list, draft] as const;
  }, [nf, selectedAF, nfItems, afItems]);

  const saveDivergences = async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !nf || !selectedAF || !divergences.length) return;

    setSaving(true);
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
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

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
              <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <p className="text-sm">{div.description}</p>
                <Badge type={div.severity} />
              </div>
            ))
          ) : (
            <p className="text-sm text-green-700">Nenhuma divergência encontrada neste confronto.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={saveDivergences} disabled={!divergences.length || saving}>
            {saving ? 'Salvando...' : 'Salvar divergências'}
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(email);
              toast.success('Template de e-mail copiado.');
            }}
          >
            Gerar e-mail de ajuste
          </Button>
        </div>
      </Card>
    </div>
  );
}
