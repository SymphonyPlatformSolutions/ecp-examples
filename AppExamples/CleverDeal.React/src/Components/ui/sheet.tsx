import { X } from 'lucide-react';
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from './utils';

type SheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet components must be used inside Sheet.');
  }
  return context;
}

export function Sheet({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

export function SheetTrigger({ asChild, children }: { asChild?: boolean; children: ReactElement }) {
  const { open, setOpen } = useSheetContext();

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

export function SheetClose({ asChild, children }: { asChild?: boolean; children: ReactElement }) {
  const { setOpen } = useSheetContext();

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<any>, {
      onClick: (event: ReactMouseEvent<HTMLElement>) => {
        const original = (children.props as { onClick?: (evt: ReactMouseEvent<HTMLElement>) => void }).onClick;
        if (original) original(event);
        setOpen(false);
      },
    });
  }

  return (
    <button type="button" onClick={() => setOpen(false)}>
      {children}
    </button>
  );
}

export function SheetContent({
  className,
  children,
  side = 'left',
  ...props
}: HTMLAttributes<HTMLDivElement> & { side?: 'left' | 'right' }) {
  const { open, setOpen } = useSheetContext();

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/50" onClick={() => setOpen(false)} />
      <div
        className={cn(
          'fixed top-0 z-50 h-full w-[320px] border-slate-200 bg-white shadow-2xl',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          className,
        )}
        {...props}
      >
        {children}
        <button
          type="button"
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
