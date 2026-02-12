import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';

const cards = [
  { href: '/app/receber', title: 'Receber NF', desc: 'Leia QR/código e registre rapidamente.' },
  { href: '/app/importar-af', title: 'Importar AF', desc: 'Faça upload de PDF/foto e revise o texto.' },
  { href: '/app/confrontar', title: 'Confrontos', desc: 'Compare AF x NF e gere e-mail de ajuste.' },
  { href: '/app/relatorios', title: 'Relatórios', desc: 'Acompanhe divergências recentes.' }
];

export default async function DashboardPage() {
  const supabase = createClient();
  const [{ data: nfs }, { data: afs }] = await Promise.all([
    supabase.from('nf_docs').select('id,nf_key,created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('af_docs').select('id,af_number,created_at').order('created_at', { ascending: false }).limit(5)
  ]);

  const lastRecords = [
    ...(nfs?.map((item) => ({ type: 'NF', code: item.nf_key, date: item.created_at })) ?? []),
    ...(afs?.map((item) => ({ type: 'AF', code: item.af_number, date: item.created_at })) ?? [])
  ]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Link className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white" href="/app/receber">
          Começar recebimento
        </Link>
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="h-full">
              <h3 className="font-semibold">{card.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{card.desc}</p>
            </Card>
          </Link>
        ))}
      </section>
      <Card>
        <h3 className="mb-3 font-semibold">Últimos 5 registros</h3>
        <ul className="space-y-2 text-sm">
          {lastRecords.map((record) => (
            <li key={`${record.type}-${record.code}`} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span>
                {record.type}: {record.code}
              </span>
              <span className="text-slate-500">{formatDate(record.date)}</span>
            </li>
          ))}
          {lastRecords.length === 0 ? <li className="text-slate-500">Nenhum registro ainda.</li> : null}
        </ul>
      </Card>
    </div>
  );
}
