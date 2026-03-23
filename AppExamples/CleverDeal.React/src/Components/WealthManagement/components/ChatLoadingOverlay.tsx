import { Loader2 } from 'lucide-react';
import { cn } from '../../ui/utils';

interface ChatLoadingOverlayProps {
  title?: string;
  message?: string;
  testId?: string;
  className?: string;
}

export default function ChatLoadingOverlay({
  title = 'Loading chat',
  message = 'Connecting your conversation and syncing recent messages.',
  testId,
  className,
}: ChatLoadingOverlayProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center bg-white p-6',
        className,
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-[420px] rounded-[24px] border border-sky-200/55 bg-white px-8 py-9 text-center text-slate-900 shadow-[0_28px_70px_rgba(15,23,42,0.28)] ring-1 ring-slate-200/80">
        <div className="text-[28px] font-semibold tracking-tight text-slate-900">{title}</div>
        <div className="mt-2 text-[15px] leading-6 text-slate-600">{message}</div>
        <div className="mt-6 flex items-center justify-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-300/35 bg-sky-400/10 text-sky-300 shadow-[0_0_18px_rgba(85,183,255,0.16)]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        </div>
      </div>
    </div>
  );
}