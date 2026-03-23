import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from './utils';

export const ScrollArea = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ScrollArea(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('overflow-auto', className)} {...props} />;
});
