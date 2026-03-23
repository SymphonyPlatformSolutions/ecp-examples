import { X } from 'lucide-react';
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type Ref,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from './utils';

type SheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
};

const SheetContext = createContext<SheetContextValue | null>(null);

type ElementWithRef<T extends HTMLElement> = ReactElement & {
  ref?: Ref<T>;
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref && typeof ref === 'object') {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

function useSheetContext() {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet components must be used inside Sheet.');
  }
  return context;
}

export function Sheet({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const value = useMemo(() => ({ open, setOpen, triggerRef }), [open]);
  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

export function SheetTrigger({ asChild, children }: { asChild?: boolean; children: ReactElement }) {
  const { open, setOpen, triggerRef } = useSheetContext();
  const child = children as ElementWithRef<HTMLElement>;

  const toggleOpen = (event?: ReactMouseEvent<HTMLElement> | ReactKeyboardEvent<HTMLElement>) => {
    event?.preventDefault();
    setOpen(!open);
  };

  if (asChild && isValidElement(children)) {
    return cloneElement(child, {
      'aria-expanded': open,
      onClick: (event: ReactMouseEvent<HTMLElement>) => {
        const original = (children.props as { onClick?: (evt: ReactMouseEvent<HTMLElement>) => void }).onClick;
        original?.(event);
        toggleOpen(event);
      },
      onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
        const original = (children.props as { onKeyDown?: (evt: ReactKeyboardEvent<HTMLElement>) => void }).onKeyDown;
        original?.(event);
        if (event.key === 'Enter' || event.key === ' ') {
          toggleOpen(event);
        }
      },
      ref: (element: HTMLElement | null) => {
        triggerRef.current = element;
        assignRef(child.ref, element);
      },
    });
  }

  return (
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
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
        original?.(event);
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
  const { open, setOpen, triggerRef } = useSheetContext();
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActiveElement = document.activeElement as HTMLElement | null;
    const fallbackFocusTarget = triggerRef.current;
    contentRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement && document.contains(previousActiveElement)) {
        previousActiveElement.focus();
      } else {
        fallbackFocusTarget?.focus();
      }
    };
  }, [open, setOpen, triggerRef]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/50" onClick={() => setOpen(false)} />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          'fixed top-0 z-50 h-full w-[320px] border-slate-200 bg-white shadow-2xl outline-none',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          className,
        )}
        {...props}
      >
        {children}
        <button
          type="button"
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          onClick={() => setOpen(false)}
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}