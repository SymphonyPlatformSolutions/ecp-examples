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
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type Ref,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from './utils';

let dropdownMenuIdSequence = 0;

type MenuContextValue = {
  contentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
};

const MenuContext = createContext<MenuContextValue | null>(null);

type ElementWithRef<T extends HTMLElement> = ReactElement<Record<string, unknown>> & {
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

function useMenuContext() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used inside DropdownMenu.');
  }
  return context;
}

function focusMenuItem(container: HTMLDivElement | null, index: number) {
  if (!container) {
    return;
  }

  const items = Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  if (items.length === 0) {
    return;
  }

  const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
  items[clampedIndex].focus();
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentIdRef = useRef<string | null>(null);

  if (!contentIdRef.current) {
    dropdownMenuIdSequence += 1;
    contentIdRef.current = `wealth-dropdown-menu-${dropdownMenuIdSequence}`;
  }

  const contentId = contentIdRef.current;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    focusMenuItem(contentRef.current, 0);
  }, [open]);

  const value = useMemo(() => ({ contentId, open, setOpen, triggerRef, contentRef }), [contentId, open]);

  return (
    <MenuContext.Provider value={value}>
      <div ref={wrapperRef} className="relative inline-flex">
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
  const { contentId, open, setOpen, triggerRef } = useMenuContext();
  const child = children as ElementWithRef<HTMLElement>;

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }

    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  if (asChild && isValidElement(children)) {
    return cloneElement(child, {
      'aria-controls': open ? contentId : undefined,
      'aria-expanded': open,
      'aria-haspopup': 'menu',
      onClick: (event: ReactMouseEvent<HTMLElement>) => {
        const original = (children.props as { onClick?: (evt: ReactMouseEvent<HTMLElement>) => void }).onClick;
        original?.(event);
        setOpen(!open);
      },
      onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
        const original = (children.props as { onKeyDown?: (evt: ReactKeyboardEvent<HTMLElement>) => void }).onKeyDown;
        original?.(event);
        handleKeyDown(event);
      },
      ref: (element: HTMLElement | null) => {
        triggerRef.current = element;
        assignRef(child.ref, element);
      },
    });
  }

  return (
    <button
      type="button"
      aria-controls={open ? contentId : undefined}
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={() => setOpen(!open)}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  align = 'start',
  className,
  children,
}: HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' }) {
  const { contentId, open, setOpen, triggerRef, contentRef } = useMenuContext();

  if (!open) {
    return null;
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const currentIndex = items.findIndex((item) => item === document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusMenuItem(contentRef.current, currentIndex + 1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusMenuItem(contentRef.current, currentIndex <= 0 ? items.length - 1 : currentIndex - 1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusMenuItem(contentRef.current, 0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusMenuItem(contentRef.current, items.length - 1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div
      id={contentId}
      ref={contentRef}
      role="menu"
      tabIndex={-1}
      aria-orientation="vertical"
      className={cn(
        'absolute top-[calc(100%+8px)] z-50 min-w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.18)]',
        align === 'end' ? 'right-0' : 'left-0',
        className,
      )}
      onKeyDown={handleKeyDown}
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
  const { setOpen, triggerRef } = useMenuContext();

  const commitSelection = () => {
    onSelect?.();
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] text-slate-700 transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
        className,
      )}
      onClick={commitSelection}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          commitSelection();
        }
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