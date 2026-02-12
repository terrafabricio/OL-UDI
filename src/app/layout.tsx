import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Recebimento Inteligente',
  description: 'MVP AF x NF'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
