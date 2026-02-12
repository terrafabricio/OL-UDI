import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';

export default async function ConfrontarPage() {
  const supabase = createClient();
  const { data: nfs } = await supabase.from('nf_docs').select('id,nf_key,unit_code,created_at').order('created_at', { ascending: false }).limit(20);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Confrontos AF x NF</h2>
      <Card>
        <ul className="space-y-2">
          {nfs?.map((nf) => (
            <li key={nf.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{nf.nf_key}</p>
                <p className="text-xs text-slate-500">Unidade {nf.unit_code} • {formatDate(nf.created_at)}</p>
              </div>
              <Link className="rounded-lg border px-3 py-1 text-sm" href={`/app/confrontar/${nf.id}`}>
                Confrontar
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
