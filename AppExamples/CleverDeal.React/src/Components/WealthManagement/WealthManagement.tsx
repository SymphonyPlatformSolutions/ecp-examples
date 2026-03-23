import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { AlertCircle, Bell, House, Menu, Search } from 'lucide-react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { getEcpParam } from '../../Utils/utils';
import Loading from '../Loading';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuChevron,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { cn } from './ui/utils';
import SymphonyChatShell from './components/SymphonyChatShell';
import SymphonyMark from './components/SymphonyMark';
import { symphonyNotifications } from './chat/symphonyNotifications';
import { acquireWealthSymphonyThemeOwnership, applyWealthSymphonyTheme } from './chat/wealthSymphonyTheme';
import { useSharedChatPresentationTransition } from './chat/useSharedChatPresentationTransition';
import { wealthManagementShellData } from './data/wealthManagementShell';
import { useSharedWealthChatController } from './chat/useSharedWealthChatController';
import ModulePlaceholderPage from './pages/ModulePlaceholderPage';
import './styles/wealthManagement.css';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ContactsPage = lazy(() => import('./pages/ContactsPage'));
const ClientDetailPage = lazy(() => import('./pages/ClientDetailPage'));

const ecpOrigin = getEcpParam('ecpOrigin') || 'corporate.symphony.com';
const partnerId = getEcpParam('partnerId') ?? undefined;

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/wealth-management' },
  { id: 'clients', label: 'Clients', href: '/wealth-management/clients' },
  { id: 'accounts', label: 'Accounts', href: '/wealth-management/accounts' },
  { id: 'reporting', label: 'Reporting', href: '/wealth-management/reporting' },
  { id: 'tools', label: 'Tools', href: '/wealth-management/tools' },
  { id: 'chat', label: 'Chat', href: '/wealth-management/chat' },
];

const RESIZE_OBSERVER_MESSAGES = new Set([
  'ResizeObserver loop completed with undelivered notifications.',
  'ResizeObserver loop limit exceeded',
]);

type NotificationToast = {
  id: string;
  type: 'message' | 'count';
  senderName: string;
  roomName: string;
  preview: string;
  receivedAt: number;
  avatarUrl?: string;
};

function LargeLoading() {
  return (
    <div
      role="status"
      aria-label="Loading wealth workspace"
      className="absolute inset-0 z-[80] flex items-center justify-center bg-[#e9edf3]"
    >
      <div className="large-loading">
        <Loading animate={true} className="logo" />
      </div>
    </div>
  );
}

function LargeErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-label="Unable to load wealth workspace"
      className="absolute inset-0 z-[80] flex items-center justify-center bg-[#e9edf3]/95 p-6"
    >
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

function WealthPageFallback() {
  return <div className="h-full bg-[#eef3f8]" />;
}

function withWealthPageSuspense(element: React.ReactElement) {
  return (
    <Suspense fallback={<WealthPageFallback />}>
      {element}
    </Suspense>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getActiveItem(pathname: string) {
  if (pathname.includes('/clients')) return 'clients';
  if (pathname.includes('/contacts')) return 'clients';
  if (pathname.includes('/accounts')) return 'accounts';
  if (pathname.includes('/reporting')) return 'reporting';
  if (pathname.includes('/tools')) return 'tools';
  if (pathname.includes('/chat')) return 'chat';
  return 'dashboard';
}

function resolveNotificationAvatar(senderName: string) {
  if (senderName === wealthManagementShellData.customer.name) {
    return wealthManagementShellData.customer.avatarUrl;
  }

  const contact = (wealthManagementShellData.contacts ?? []).find((item) => item.name === senderName);
  return contact?.avatarUrl;
}

function formatNotification(event: { type: 'GlobalUnreadCountNotifications' | 'MessageNotifications'; summary: string; receivedAt: number; payload: Record<string, unknown> }): NotificationToast {
  if (event.type === 'MessageNotifications') {
    const senderName = typeof event.payload.fromWhomName === 'string' ? event.payload.fromWhomName : 'Unknown sender';
    const roomName = typeof event.payload.streamName === 'string' ? event.payload.streamName : 'Unknown conversation';
    const preview = typeof event.payload.message === 'string'
      ? event.payload.message
      : `New message in ${roomName}`;

    return {
      id: `${event.type}-${event.receivedAt}`,
      type: 'message',
      senderName,
      roomName,
      preview,
      receivedAt: event.receivedAt,
      avatarUrl: resolveNotificationAvatar(senderName),
    };
  }

  return {
    id: `${event.type}-${event.receivedAt}`,
    type: 'count',
    senderName: 'Symphony',
    roomName: 'All conversations',
    preview: event.summary,
    receivedAt: event.receivedAt,
  };
}

const WealthManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSymphonyDrawerOpen, setIsSymphonyDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(symphonyNotifications.count);
  const [recentNotifications, setRecentNotifications] = useState<NotificationToast[]>([]);
  const activeItem = getActiveItem(location.pathname);
  const isChatRoute = activeItem === 'chat';
  const chatContactId = new URLSearchParams(location.search).get('contactId');
  const chatContact = (wealthManagementShellData.contacts ?? []).find((item) => item.id === chatContactId);
  const usesEmbeddedClientDrawer = activeItem === 'clients' && Boolean(chatContactId) && !isChatRoute;
  const activeChatStreamId = chatContact?.streamId;
  const activeChatMode = isChatRoute ? 'page' : 'drawer';
  const {
    bootstrapError,
    isBootstrapping,
    isSwitchingStream,
    slotClassName,
    streamError,
  } = useSharedWealthChatController({
    ecpOrigin,
    partnerId,
    requestedStreamId: usesEmbeddedClientDrawer ? undefined : activeChatStreamId,
  });
  const isSharedChatVisible = !isBootstrapping && (isChatRoute || isSymphonyDrawerOpen);
  const { shellRef, maskFrame } = useSharedChatPresentationTransition({
    mode: activeChatMode,
    isReady: !isBootstrapping && !bootstrapError,
    isVisible: isSharedChatVisible,
  });

  useEffect(() => symphonyNotifications.onCountChange(setUnreadCount), []);

  useEffect(() => {
    const unsubscribe = symphonyNotifications.onNotificationEvent?.((event) => {
      if (event.type !== 'MessageNotifications') {
        return;
      }

      const notification = formatNotification(event);
      setRecentNotifications((current) => [notification, ...current].slice(0, 8));
    });

    return typeof unsubscribe === 'function' ? unsubscribe : undefined;
  }, []);

  useEffect(() => {
    const releaseThemeOwnership = acquireWealthSymphonyThemeOwnership();
    return typeof releaseThemeOwnership === 'function' ? releaseThemeOwnership : undefined;
  }, []);

  useEffect(() => {
    if (isSymphonyDrawerOpen && activeChatMode === 'drawer') {
      applyWealthSymphonyTheme();
    }
  }, [isSymphonyDrawerOpen, activeChatMode]);

  useEffect(() => {
    if (!isBootstrapping && !bootstrapError) {
      applyWealthSymphonyTheme();
    }
  }, [location.pathname, isBootstrapping, bootstrapError]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const suppressResizeObserverError = (event: ErrorEvent) => {
      if (!RESIZE_OBSERVER_MESSAGES.has(event.message)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    };

    window.addEventListener('error', suppressResizeObserverError, true);

    return () => {
      window.removeEventListener('error', suppressResizeObserverError, true);
    };
  }, []);

  useEffect(() => {
    if (!isSymphonyDrawerOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSymphonyDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSymphonyDrawerOpen]);

  useEffect(() => {
    if (isChatRoute && isSymphonyDrawerOpen) {
      setIsSymphonyDrawerOpen(false);
    }
  }, [isChatRoute, isSymphonyDrawerOpen]);

  useEffect(() => {
    if (isChatRoute) {
      return;
    }

    if (activeItem === 'clients' && chatContactId) {
      setIsSymphonyDrawerOpen(true);
      return;
    }

    setIsSymphonyDrawerOpen(false);
  }, [activeItem, chatContactId, isChatRoute]);

  useEffect(() => {
    if (!isSharedChatVisible) {
      return;
    }

    symphonyNotifications.markMessagesViewed?.(activeChatStreamId);
  }, [activeChatStreamId, isSharedChatVisible]);

  const openClientQuickChat = useCallback((contactId: string) => {
    navigate(`/wealth-management/clients?contactId=${contactId}`);
  }, [navigate]);

  const closeSharedChat = useCallback(() => {
    if (activeChatMode === 'page') {
      return;
    }

    if (activeItem === 'clients' && chatContactId) {
      navigate('/wealth-management/clients', { replace: true });
      return;
    }

    setIsSymphonyDrawerOpen(false);
  }, [activeChatMode, activeItem, chatContactId, navigate]);

  return (
    <div className="wealth-theme relative flex h-screen flex-col overflow-hidden bg-[#e9edf3] text-slate-900">
      <div className="pointer-events-none fixed inset-0 z-[60]">
        {isSymphonyDrawerOpen && !isChatRoute && (
          <button
            type="button"
            aria-label="Close Symphony drawer"
            onClick={closeSharedChat}
            className={cn(
              'absolute inset-0 bg-slate-950/35',
              'pointer-events-auto opacity-100',
            )}
          />
        )}
        <div
          ref={shellRef}
          data-testid="wealth-shared-chat-shell"
          className={cn(
            activeChatMode === 'page'
              ? 'absolute inset-x-2.5 bottom-2.5 top-[82px]'
              : 'absolute right-4 top-[88px] w-[min(600px,calc(100vw-32px))] md:right-6',
            activeChatMode === 'page'
              ? 'pointer-events-auto'
              : isSymphonyDrawerOpen
                ? 'pointer-events-auto'
                : 'pointer-events-none',
          )}
          style={{
            ...(activeChatMode === 'drawer'
              ? {
                  height: 'min(800px, calc(100vh - 110px))',
                  transform: isSymphonyDrawerOpen ? 'translateX(0)' : 'translateX(calc(100% + 32px))',
                }
              : {}),
          }}
          aria-hidden={!isSharedChatVisible}
        >
          <SymphonyChatShell
            mode={activeChatMode}
            slotClassName={slotClassName}
            contactId={chatContactId}
            ecpOrigin={ecpOrigin}
            partnerId={partnerId}
            isLoading={Boolean(activeChatStreamId) && isSwitchingStream}
            maskFrame={maskFrame}
            error={streamError}
            onClose={activeChatMode === 'drawer' ? closeSharedChat : undefined}
          />
        </div>
      </div>

      <>
        <header className="border-b border-[#11346c] bg-[linear-gradient(90deg,#07285f_0%,#0f3d83_100%)] text-white">
            <div className="flex h-[72px] items-stretch gap-3 px-4 md:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="border border-white/15 bg-[#0b326d]/60 text-white hover:bg-white/10 hover:text-white"
                  aria-label="Return to wealth home"
                  onClick={() => navigate('/')}
                >
                  <House className="h-4 w-4" />
                </Button>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden text-white hover:bg-white/10 hover:text-white"
                      aria-label="Open navigation"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="bg-[#07285f] text-white">
                    <div className="border-b border-white/10 px-5 py-5">
                      <div className="text-[22px] font-bold tracking-tight">Nakatomi Wealth CRM</div>
                      <div className="mt-1 text-[12px] text-sky-100">Enterprise wealth workflow powered by Symphony</div>
                    </div>
                    <div className="flex flex-col gap-1 p-4">
                      <button
                        type="button"
                        onClick={() => setIsSymphonyDrawerOpen(true)}
                        className="mb-2 flex items-center gap-3 rounded-md border border-white/10 bg-[#0b326d] px-4 py-3 text-left text-[15px] font-medium text-white transition-colors hover:bg-[#15458d]"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white shadow-[0_10px_24px_rgba(7,40,95,0.28)]">
                          <SymphonyMark className="h-7 w-7 object-contain drop-shadow-[0_2px_6px_rgba(17,141,234,0.28)]" />
                        </span>
                        Symphony
                      </button>
                      {NAV_ITEMS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => navigate(item.href)}
                          className={cn(
                            'rounded-md border border-white/10 bg-[#0b326d] px-4 py-3 text-left text-[15px] font-medium text-white transition-colors',
                            activeItem === item.id
                              ? 'bg-sky-400 text-white shadow-[0_8px_24px_rgba(2,8,23,0.24)]'
                              : 'hover:bg-[#15458d] hover:text-white',
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
                <button
                  type="button"
                  className="min-w-0 border-0 bg-transparent px-2 text-left transition-colors hover:bg-white/5"
                  onClick={() => navigate('/wealth-management')}
                >
                  <div className="truncate text-[17px] font-semibold tracking-tight text-white">Nakatomi Wealth CRM</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-sky-100">Symphony-enabled client workspace</div>
                </button>
              </div>

              <div className="hidden min-w-0 flex-1 items-stretch md:flex">
                <nav className="flex min-w-0 items-stretch overflow-hidden rounded-md border border-white/20 bg-[#082a60] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  {NAV_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.href)}
                      className="min-w-[112px] border-r border-white/10 px-5 text-[15px] font-medium transition-colors last:border-r-0 hover:bg-[#133f84]"
                      style={{
                        background: activeItem === item.id ? 'linear-gradient(180deg,#55b7ff 0%,#2196f3 100%)' : '#0b326d',
                        color: activeItem === item.id ? '#ffffff' : '#e6eefb',
                        boxShadow: activeItem === item.id ? 'inset 0 -3px 0 #07285f' : 'none',
                        textShadow: activeItem === item.id ? '0 1px 1px rgba(7,40,95,0.35)' : 'none',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden border border-white/15 bg-[#0b326d]/60 text-white hover:bg-white/10 hover:text-white md:inline-flex"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="border border-white/15 bg-[#0b326d]/60 text-white hover:bg-white/10 hover:text-white"
                        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                      {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-[0_4px_10px_rgba(239,68,68,0.35)]">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[360px] overflow-hidden rounded-2xl p-0">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Recent Notifications</div>
                      <div className="mt-1 text-[13px] font-semibold text-slate-900">
                        {unreadCount > 0 ? `${unreadCount > 99 ? '99+' : unreadCount} unread in Symphony` : 'All conversations are up to date'}
                      </div>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto bg-[linear-gradient(180deg,#f8fbff_0%,#f5f7fb_100%)] p-2.5">
                      {recentNotifications.length > 0 ? recentNotifications.map((notification) => (
                        <div key={notification.id} className="rounded-2xl border border-slate-200/90 bg-white px-3 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                          <div className="flex items-start gap-3">
                            <Avatar className="mt-0.5 h-10 w-10 border border-slate-200 shadow-sm">
                              {notification.avatarUrl ? <AvatarImage src={notification.avatarUrl} alt={notification.senderName} /> : null}
                              <AvatarFallback className={cn(
                                'text-[11px] font-semibold',
                                notification.type === 'message' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600',
                              )}>
                                {getInitials(notification.senderName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-[13px] font-semibold text-slate-900">{notification.senderName}</div>
                                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                                    <span className={cn(
                                      'inline-flex rounded-full px-2 py-0.5 font-semibold',
                                      notification.type === 'message' ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
                                    )}>
                                      {notification.roomName}
                                    </span>
                                  </div>
                                </div>
                                <div className="shrink-0 text-[10px] text-slate-400">{new Date(notification.receivedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                              </div>
                              <div className="mt-2 line-clamp-2 text-[12px] leading-5 text-slate-600">{notification.preview}</div>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-[13px] text-slate-500">
                          No recent Symphony notifications.
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2 py-1 pr-3 transition-colors hover:bg-white/15">
                      <Avatar className="h-9 w-9">
                        {wealthManagementShellData.customer.avatarUrl ? (
                          <AvatarImage src={wealthManagementShellData.customer.avatarUrl} alt={wealthManagementShellData.customer.name} className="object-[center_20%]" />
                        ) : null}
                        <AvatarFallback className="bg-white text-[11px] font-semibold text-[#07285f]">
                          {getInitials(wealthManagementShellData.customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden text-left md:block">
                        <div className="text-[13px] font-semibold text-white">{wealthManagementShellData.customer.name}</div>
                        <div className="text-[11px] text-sky-100">Lead advisor</div>
                      </div>
                      <DropdownMenuChevron />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Advisor Profile</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => navigate('/wealth-management/chat')}>Open Symphony chat</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden p-2.5">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[16px] border border-slate-300 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
            <div className="min-h-0 flex-1">
              <Routes>
                <Route
                  index
                  element={withWealthPageSuspense(
                    <div className="h-full overflow-y-auto">
                      <DashboardPage />
                    </div>
                  )}
                />
                <Route path="clients" element={withWealthPageSuspense(<ContactsPage onOpenChat={openClientQuickChat} />)} />
                <Route path="clients/:id" element={withWealthPageSuspense(<ClientDetailPage ecpOrigin={ecpOrigin} partnerId={partnerId} />)} />
                <Route path="contacts" element={<Navigate to="/wealth-management/clients" replace />} />
                <Route path="contacts/:id" element={withWealthPageSuspense(<ClientDetailPage ecpOrigin={ecpOrigin} partnerId={partnerId} />)} />
                <Route path="chat" element={<div className="h-full bg-transparent" />} />
                <Route
                  path="accounts"
                  element={(
                    <ModulePlaceholderPage
                      title="Accounts"
                      description="Account-level servicing, household structures, and custodian activity will live here in the next phase."
                    />
                  )}
                />
                <Route
                  path="reporting"
                  element={(
                    <ModulePlaceholderPage
                      title="Reporting"
                      description="Performance reporting, investor commentary, and distribution history are reserved in this shell for a later module."
                    />
                  )}
                />
                <Route
                  path="tools"
                  element={(
                    <ModulePlaceholderPage
                      title="Tools"
                      description="Advisor utilities, campaign workflows, and operational shortcuts will sit under Tools once those modules are rebuilt."
                    />
                  )}
                />
                <Route path="campaigns" element={<Navigate to="/wealth-management/tools" replace />} />
                <Route path="*" element={<Navigate to="/wealth-management" replace />} />
              </Routes>
            </div>
          </div>
        </main>

        {!isChatRoute && activeItem !== 'clients' && (
          <button
            type="button"
            onClick={() => setIsSymphonyDrawerOpen(true)}
            className="absolute right-0 top-[184px] z-[55] hidden h-[92px] w-[52px] items-center justify-center rounded-l-xl border border-r-0 border-[#123b7a] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition-colors hover:bg-sky-50 md:flex"
            aria-label="Open Symphony chat"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-white shadow-[0_8px_18px_rgba(18,59,122,0.14)]">
              <SymphonyMark className="h-7 w-7 object-contain drop-shadow-[0_2px_6px_rgba(17,141,234,0.28)]" />
            </span>
          </button>
        )}
      </>
      {isBootstrapping && <LargeLoading />}
      {bootstrapError && <LargeErrorState message={bootstrapError.message} />}
    </div>
  );
};

export default WealthManagement;
export { WealthManagement };
