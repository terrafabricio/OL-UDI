import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  label: string;
}

export const Input = ({ label, error, helperText, className, id, ...props }: Props) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-sm font-medium text-slate-700">
      {label}
    </label>
    <input
      id={id}
      className={cn(
        'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
        error ? 'border-red-500' : 'border-slate-300',
        className
      )}
      {...props}
    />
    {error ? <p className="text-xs text-red-600">{error}</p> : helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}
  </div>
);
