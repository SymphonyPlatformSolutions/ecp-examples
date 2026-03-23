import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from './utils';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'info' | 'alert' | 'warning';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#0a2c63] text-white',
  secondary: 'bg-slate-200 text-slate-800',
  success: 'bg-emerald-600 text-white',
  info: 'bg-sky-600 text-white',
  alert: 'bg-rose-600 text-white',
  warning: 'bg-amber-500 text-white',
};

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(function Badge(
  { className, variant = 'default', ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold', variantClasses[variant], className)}
      {...props}
    />
  );
});