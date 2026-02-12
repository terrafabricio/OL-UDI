import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';

export default async function RelatoriosPage({ searchParams }: { searchParams?: { severity?: string } }) {
  const severity = searchParams?.severity;
  const supabase = createClient();

  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

  const [last7, last30, recent] = await Promise.all([
    supabase.from('divergences').select('type,severity').gte('created_at', since7),
    supabase.from('divergences').select('type,severity').gte('created_at', since30),
    supabase.from('divergences').select('id,type,severity,description,created_at').order('created_at', { ascending: false }).limit(30)
  ]);

  const typeCount7 = (last7.data || []).reduce<Record<string, number>>((acc, row) => {
    acc[row.type] = (acc[row.type] || 0) + 1;
    return acc;
  }, {});

  const typeCount30 = (last30.data || []).reduce<Record<string, number>>((acc, row) => {
    acc[row.type] = (acc[row.type] || 0) + 1;
    return acc;
  }, {});

  const filtered = recent.data?.filter((row) => (severity ? row.severity === severity : true)) ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Relatórios</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-sm text-slate-500">Tipos de divergência (7 dias)</p>
          <ul className="mt-2 space-y-1 text-sm">
            {Object.entries(typeCount7).map(([type, count]) => (
              <li key={type} className="flex justify-between">
                <span>{type}</span>
                <span>{count}</span>
              </li>
            ))}
            {!Object.keys(typeCount7).length ? <li className="text-slate-500">Sem divergências no período.</li> : null}
          </ul>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">Tipos de divergência (30 dias)</p>
          <ul className="mt-2 space-y-1 text-sm">
            {Object.entries(typeCount30).map(([type, count]) => (
              <li key={type} className="flex justify-between">
                <span>{type}</span>
                <span>{count}</span>
              </li>
            ))}
            {!Object.keys(typeCount30).length ? <li className="text-slate-500">Sem divergências no período.</li> : null}
          </ul>
        </Card>
      </div>

      <Card className="space-y-2">
        <div className="flex gap-2 text-sm">
          <a className="rounded border px-2 py-1" href="/app/relatorios">
            Todos
          </a>
          <a className="rounded border px-2 py-1" href="/app/relatorios?severity=critical">
            Críticos
          </a>
          <a className="rounded border px-2 py-1" href="/app/relatorios?severity=warning">
            Atenção
          </a>
        </div>
        {filtered.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm">{item.description}</p>
              <p className="text-xs text-slate-500">
                {item.type} • {formatDate(item.created_at)}
              </p>
            </div>
            <Badge type={item.severity as 'critical' | 'warning'} />
          </div>
        ))}
        {!filtered.length ? <p className="text-sm text-slate-500">Nenhuma divergência encontrada com este filtro.</p> : null}
      </Card>
    </div>
  );
}
