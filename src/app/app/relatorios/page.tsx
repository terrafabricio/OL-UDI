import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';

export default async function RelatoriosPage({ searchParams }: { searchParams?: { severity?: string } }) {
  const severity = searchParams?.severity;
  const supabase = createClient();

  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

  const [d7, d30, recent] = await Promise.all([
    supabase.from('divergences').select('id', { count: 'exact', head: true }).gte('created_at', since7),
    supabase.from('divergences').select('id', { count: 'exact', head: true }).gte('created_at', since30),
    supabase
      .from('divergences')
      .select('id,type,severity,description,created_at')
      .order('created_at', { ascending: false })
      .limit(30)
  ]);

  const filtered = recent.data?.filter((row) => (severity ? row.severity === severity : true)) ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Relatórios</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-sm text-slate-500">Divergências (7 dias)</p>
          <p className="text-3xl font-bold">{d7.count ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Divergências (30 dias)</p>
          <p className="text-3xl font-bold">{d30.count ?? 0}</p>
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
              <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
            </div>
            <Badge type={item.severity as 'critical' | 'warning'} />
          </div>
        ))}
      </Card>
    </div>
  );
}
