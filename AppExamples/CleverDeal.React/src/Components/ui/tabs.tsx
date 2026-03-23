import { type HTMLAttributes } from 'react';
import { cn } from './utils';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  variant?: 'light' | 'dark';
}

export function Tabs({ tabs, active, onChange, variant = 'light', className, ...props }: TabsProps) {
  return (
    <div
      className={cn(
        'flex gap-1 rounded-lg p-1',
        variant === 'dark'
          ? 'border border-white/15 bg-white/10'
          : 'border border-slate-200 bg-slate-50',
        className,
      )}
      {...props}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors',
            active === tab.id
              ? 'bg-white text-slate-900 shadow-sm'
              : variant === 'dark'
                ? 'text-white/60 hover:text-white/80'
                : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
