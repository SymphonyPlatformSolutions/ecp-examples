import { GripVertical } from 'lucide-react';
import {
  Children,
  cloneElement,
  isValidElement,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from './utils';

interface ResizablePanelProps extends HTMLAttributes<HTMLDivElement> {
  defaultSize?: number;
  minSize?: number;
  panelSize?: number;
}

interface ResizableHandleProps extends HTMLAttributes<HTMLDivElement> {
  withHandle?: boolean;
  onDragStart?: (event: ReactMouseEvent<HTMLDivElement>) => void;
}

function ResizablePanelComponent({
  className,
  panelSize,
  style,
  defaultSize: _defaultSize,
  minSize: _minSize,
  ...props
}: ResizablePanelProps) {
  return (
    <div
      className={cn('min-w-0 min-h-0', className)}
      style={{
        flexBasis: panelSize ? `${panelSize}%` : undefined,
        flexGrow: panelSize ? 0 : 1,
        flexShrink: 0,
        ...style,
      }}
      {...props}
    />
  );
}

ResizablePanelComponent.displayName = 'ResizablePanel';

function ResizableHandleComponent({ className, onDragStart, withHandle, ...props }: ResizableHandleProps) {
  return (
    <div
      className={cn('relative flex w-px items-center justify-center bg-slate-200 after:absolute after:inset-y-0 after:left-[-4px] after:right-[-4px]', className)}
      onMouseDown={onDragStart}
      {...props}
    >
      {withHandle && (
        <div className="z-10 rounded-full border border-slate-200 bg-white p-1 text-slate-400 shadow-sm">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}

ResizableHandleComponent.displayName = 'ResizableHandle';

export function ResizablePanelGroup({
  children,
  className,
  direction = 'horizontal',
}: HTMLAttributes<HTMLDivElement> & { direction?: 'horizontal' | 'vertical'; children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const childArray = Children.toArray(children) as ReactElement[];
  const panelElements = childArray.filter(
    (child) => isValidElement(child) && child.type === ResizablePanelComponent,
  ) as ReactElement<ResizablePanelProps>[];

  const initialSizes = useMemo(() => {
    const firstSize = panelElements[0]?.props.defaultSize ?? 60;
    const secondSize = panelElements[1]?.props.defaultSize ?? 40;
    const total = firstSize + secondSize;
    return [(firstSize / total) * 100, (secondSize / total) * 100];
  }, [panelElements]);

  const [sizes, setSizes] = useState(initialSizes);

  const handleDragStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const [leftSize] = sizes;
    const leftMin = panelElements[0]?.props.minSize ?? 30;
    const rightMin = panelElements[1]?.props.minSize ?? 30;

    const handleMove = (moveEvent: MouseEvent) => {
      const delta = ((moveEvent.clientX - startX) / rect.width) * 100;
      const nextLeft = Math.min(Math.max(leftSize + delta, leftMin), 100 - rightMin);
      setSizes([nextLeft, 100 - nextLeft]);
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  let panelIndex = 0;
  const renderedChildren = childArray.map((child) => {
    if (isValidElement(child) && child.type === ResizablePanelComponent) {
      const element = cloneElement(child as ReactElement<any>, {
        panelSize: sizes[panelIndex],
      });
      panelIndex += 1;
      return element;
    }

    if (isValidElement(child) && child.type === ResizableHandleComponent) {
      return cloneElement(child as ReactElement<any>, {
        onDragStart: handleDragStart,
      });
    }

    return child;
  });

  return (
    <div
      ref={containerRef}
      className={cn('flex h-full w-full', direction === 'vertical' && 'flex-col', className)}
    >
      {renderedChildren}
    </div>
  );
}

export const ResizablePanel = ResizablePanelComponent;
export const ResizableHandle = ResizableHandleComponent;
