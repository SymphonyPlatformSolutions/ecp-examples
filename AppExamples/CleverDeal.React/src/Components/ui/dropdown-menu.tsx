import { ChevronDown } from 'lucide-react';
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from './utils';

type MenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used inside DropdownMenu.');
  }
  return context;
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const value = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <MenuContext.Provider value={value}>
      <div ref={ref} className="relative inline-flex">
        {children}
      </div>
    </MenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: ReactElement;
}) {
  const { open, setOpen } = useMenuContext();

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<any>, {
      onClick: (event: ReactMouseEvent<HTMLElement>) => {
        const original = (children.props as { onClick?: (evt: ReactMouseEvent<HTMLElement>) => void }).onClick;
        if (original) original(event);
        setOpen(!open);
      },
    });
  }

  return (
    <button type="button" onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  align = 'start',
  className,
  children,
}: HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' }) {
  const { open } = useMenuContext();

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute top-[calc(100%+8px)] z-50 min-w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.18)]',
        align === 'end' ? 'right-0' : 'left-0',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  className,
  onSelect,
  ...props
}: HTMLAttributes<HTMLButtonElement> & { onSelect?: () => void }) {
  const { setOpen } = useMenuContext();

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] text-slate-700 transition-colors hover:bg-slate-100',
        className,
      )}
      onClick={() => {
        if (onSelect) onSelect();
        setOpen(false);
      }}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400', className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('my-1 h-px bg-slate-200', className)} {...props} />;
}

export function DropdownMenuChevron() {
  return <ChevronDown className="h-4 w-4 text-slate-400" />;
}
