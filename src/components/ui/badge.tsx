export const Badge = ({ type }: { type: 'critical' | 'warning' | 'ok' }) => {
  const cls = {
    critical: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-800',
    ok: 'bg-green-100 text-green-700'
  }[type];

  const label = type === 'critical' ? 'Crítico' : type === 'warning' ? 'Atenção' : 'OK';

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
};
