import type { Ref } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useClientChatSdkController } from '../chat/useClientChatSdkController';
import { WEALTH_CLIENT_DRAWER_CHAT_SELECTOR } from '../chat/wealthSymphonyTheme';
import ChatLoadingOverlay from './ChatLoadingOverlay';
import SymphonyMark from './SymphonyMark';

function EcpErrorState({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 p-6">
      <div className="max-w-sm rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-center shadow-sm">
        <div className="flex items-center justify-center gap-2 text-[15px] font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4" />
          Unable to load Symphony chat
        </div>
        <div className="mt-2 text-[13px] leading-6 text-rose-600">{message}</div>
      </div>
    </div>
  );
}

interface SymphonyChatShellProps {
  contactId?: string | null;
  ecpOrigin?: string;
  partnerId?: string;
  mode?: 'page' | 'drawer';
  isLoading?: boolean;
  maskFrame?: boolean;
  onSharedChatError?: () => void;
  onSharedChatLoad?: () => void;
  sharedChatRef?: Ref<HTMLIFrameElement>;
  sharedChatError?: string | null;
  sharedChatUrl?: string;
  onClose?: () => void;
}

export default function SymphonyChatShell({
  contactId,
  ecpOrigin,
  partnerId,
  mode = 'page',
  isLoading = false,
  maskFrame = false,
  onSharedChatError,
  onSharedChatLoad,
  sharedChatRef,
  sharedChatError = null,
  sharedChatUrl,
  onClose,
}: SymphonyChatShellProps) {
  const navigate = useNavigate();
  const useDrawerClientShell = mode === 'drawer';
  const showDrawerClientChat = useDrawerClientShell && Boolean(contactId);
  const {
    chatError: clientChatError,
    contact,
    isChatReady: isClientChatReady,
    isLoading: isClientChatLoading,
    slotClassName: clientSlotClassName,
  } = useClientChatSdkController({
    contactId,
    containerSelector: WEALTH_CLIENT_DRAWER_CHAT_SELECTOR,
    ecpOrigin,
    enabled: showDrawerClientChat,
    partnerId,
    preload: useDrawerClientShell,
  });
  const subheading = showDrawerClientChat && contact ? contact.name : 'Symphony';
  const showBlockingLoader = isLoading;
  const hideSharedFrame = showDrawerClientChat || showBlockingLoader || maskFrame || Boolean(sharedChatError);
  const hideClientFrame = !showDrawerClientChat;
  const showClientLoader =
    showDrawerClientChat && (isClientChatLoading || !isClientChatReady) && !clientChatError;
  const revealClientChat = showDrawerClientChat && !showClientLoader && !clientChatError;

  const frameOverlay = showDrawerClientChat
    ? null
    : sharedChatError
      ? <EcpErrorState message={sharedChatError} />
      : showBlockingLoader
        ? <ChatLoadingOverlay />
        : maskFrame
          ? <ChatLoadingOverlay testId="wealth-chat-frame-mask" />
          : null;

  return (
    <div
      className={
        mode === 'page'
          ? 'flex h-full flex-col overflow-hidden rounded-t-2xl bg-[#f6f8fb]'
          : 'flex h-full flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_32px_60px_rgba(15,23,42,0.28)]'
      }
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-[linear-gradient(90deg,#07285f_0%,#0f3d83_100%)] px-5 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-white shadow-[0_10px_24px_rgba(7,40,95,0.28)]">
            <SymphonyMark className="h-5 w-5 object-contain drop-shadow-[0_2px_6px_rgba(17,141,234,0.28)]" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight">Wealth Chat</h1>
            <div className="text-[11px] text-sky-100">{subheading}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {contact && mode === 'page' && (
            <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-[11px] text-white hover:bg-white/20 hover:text-white" onClick={() => navigate(`/wealth-management/clients/${contact.id}`)}>
              View Profile
            </Button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={(event) => {
                event.currentTarget.blur();
                onClose();
              }}
              className="appearance-none rounded-md border-0 bg-transparent p-1.5 text-white shadow-none outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="Close Symphony drawer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className={mode === 'page' ? 'min-h-0 flex-1 p-6' : 'min-h-0 flex-1 p-4'}>
        <div
          className={
            mode === 'page'
              ? 'relative h-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_55px_rgba(15,23,42,0.08)]'
              : 'relative h-full overflow-hidden rounded-[18px] border border-slate-200 bg-white'
          }
        >
          {frameOverlay}
          <iframe
            ref={sharedChatRef}
            data-testid="wealth-shared-chat-frame"
            title="Wealth shared chat"
            src={sharedChatUrl}
            onLoad={onSharedChatLoad}
            onError={onSharedChatError}
            allow="clipboard-read; clipboard-write"
            className="h-full w-full border-0"
            style={{ opacity: hideSharedFrame ? 0 : 1 }}
            aria-hidden={hideSharedFrame}
          />
          {useDrawerClientShell ? (
            <div
              className="absolute inset-0 bg-[#fbfcfe]"
              style={{ opacity: hideClientFrame ? 0 : 1, pointerEvents: hideClientFrame ? 'none' : 'auto' }}
              aria-hidden={hideClientFrame}
            >
              {showClientLoader ? <ChatLoadingOverlay /> : null}
              {(showDrawerClientChat && clientChatError) ? <EcpErrorState message={clientChatError} /> : null}
              <div
                data-testid="wealth-client-drawer-chat-slot"
                className={`${clientSlotClassName} h-full w-full transition-opacity duration-200`}
                style={{ opacity: revealClientChat ? 1 : 0, pointerEvents: revealClientChat ? 'auto' : 'none' }}
                aria-hidden={hideClientFrame || Boolean(clientChatError) || !revealClientChat}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
