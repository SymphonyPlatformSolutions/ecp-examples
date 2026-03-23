import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from './utils';

export function Menubar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-1 rounded-xl bg-transparent p-1', className)} {...props} />;
}

export function MenubarMenu({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function MenubarTrigger({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-lg px-4 py-2 text-[14px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white',
        className,
      )}
      {...props}
    />
  );
}
