import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}>{children}</div>
);
