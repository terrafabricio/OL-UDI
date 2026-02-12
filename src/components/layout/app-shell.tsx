import Link from 'next/link';
import { Home, FileDown, ScanLine, AlertTriangle, BarChart3 } from 'lucide-react';
import { ReactNode } from 'react';
import { LogoutButton } from './logout-button';

const items = [
  { href: '/app', label: 'Dashboard', icon: Home },
  { href: '/app/receber', label: 'Receber NF', icon: ScanLine },
  { href: '/app/importar-af', label: 'Importar AF', icon: FileDown },
  { href: '/app/confrontar', label: 'Confrontos', icon: AlertTriangle },
  { href: '/app/relatorios', label: 'Relatórios', icon: BarChart3 }
];

export const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-slate-50">
    <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold">Recebimento Inteligente</h1>
        <LogoutButton />
      </div>
    </header>
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-5 md:grid-cols-[220px_1fr]">
      <aside className="hidden rounded-2xl border bg-white p-3 shadow-sm md:block">
        <nav className="space-y-2">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
              <item.icon size={18} /> {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="pb-20 md:pb-0">{children}</main>
    </div>
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white p-2 md:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {items.slice(0, 4).map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="flex flex-col items-center rounded-md p-2 text-xs text-slate-700">
              <item.icon size={16} />
              {item.label.split(' ')[0]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  </div>
);
