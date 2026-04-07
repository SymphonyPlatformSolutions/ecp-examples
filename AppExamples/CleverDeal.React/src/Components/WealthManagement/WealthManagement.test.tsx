import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeContext, type ThemeState } from '../../Theme/ThemeProvider';
import { wealthManagementData } from './data/wealthManagement';
import WealthManagement from './WealthManagement';

type CountChangeCallback = (count: number) => void;
type StreamUnreadChangeCallback = (counts: Record<string, number>) => void;

const defaultNotificationDebugSnapshot = {
  totalCount: 0,
  globalUnreadCount: 0,
  fallbackUnreadCount: 0,
  origins: [],
  subscriptions: [],
  recentNotifications: [],
  lastEventSummary: null,
  lastEventAt: null,
};

const mockSdkInit = jest.fn(() => Promise.resolve()) as unknown as jest.Mock<
  Promise<void>,
  [string, string | undefined]
>;
const mockRenderChat = jest.fn(() => Promise.resolve()) as unknown as jest.Mock<
  Promise<void>,
  [string, Record<string, unknown>]
>;
const mockOpenStream = jest.fn(() => Promise.resolve()) as unknown as jest.Mock<
  Promise<void>,
  [string, string, Record<string, unknown> | undefined]
>;
const mockNotificationsInit = jest.fn();
const mockNotificationsReset = jest.fn();
const mockApplyWealthSymphonyTheme = jest.fn();
const mockRefreshWealthSymphonyThemeAfterLayoutChange = jest.fn(() => Promise.resolve());
const mockReleaseWealthSymphonyThemeOwnership = jest.fn();
const mockAcquireWealthSymphonyThemeOwnership = jest.fn(() => mockReleaseWealthSymphonyThemeOwnership);
const notificationListeners = new Set<CountChangeCallback>();
const streamUnreadListeners = new Set<StreamUnreadChangeCallback>();
const notificationEventListeners = new Set<(event: { type: string; summary: string; receivedAt: number; payload: Record<string, unknown> }) => void>();
const mockOnCountChange = jest.fn((callback: CountChangeCallback) => {
  notificationListeners.add(callback);
  callback(mockNotificationCount);
  return () => {
    notificationListeners.delete(callback);
  };
}) as unknown as jest.Mock<() => void, [CountChangeCallback]>;
const mockOnNotificationEvent = jest.fn((callback: (event: { type: string; summary: string; receivedAt: number; payload: Record<string, unknown> }) => void) => {
  notificationEventListeners.add(callback);
  return () => {
    notificationEventListeners.delete(callback);
  };
}) as unknown as jest.Mock<() => void, [(event: { type: string; summary: string; receivedAt: number; payload: Record<string, unknown> }) => void]>;
const mockOnStreamUnreadChange = jest.fn((callback: StreamUnreadChangeCallback) => {
  streamUnreadListeners.add(callback);
  callback(mockStreamUnreadCounts);
  return () => {
    streamUnreadListeners.delete(callback);
  };
}) as unknown as jest.Mock<() => void, [StreamUnreadChangeCallback]>;
const mockOnDebugChange = jest.fn((callback: (snapshot: typeof defaultNotificationDebugSnapshot) => void) => {
  callback(defaultNotificationDebugSnapshot);
  return () => {};
}) as unknown as jest.Mock<() => void, [(snapshot: typeof defaultNotificationDebugSnapshot) => void]>;
const mockUseClientChatSdkController = jest.fn();
const mockUseSharedIframeChatHost = jest.fn();
const mockUseSharedChatPresentationTransition = jest.fn();
let mockNotificationCount = 0;
let mockStreamUnreadCounts: Record<string, number> = {};

jest.mock('recharts', () => {
  const Wrapper = () => <div />;
  const Leaf = () => null;
  return {
    ResponsiveContainer: Wrapper,
    AreaChart: Wrapper,
    PieChart: Wrapper,
    Area: Leaf,
    Pie: Wrapper,
    Cell: Leaf,
    CartesianGrid: Leaf,
    XAxis: Leaf,
    YAxis: Leaf,
    Tooltip: Leaf,
  };
});

jest.mock('./chat/useSharedIframeChatHost', () => ({
  useSharedIframeChatHost: (options: Record<string, unknown>) => mockUseSharedIframeChatHost(options),
}));

jest.mock('./chat/useSharedChatPresentationTransition', () => ({
  useSharedChatPresentationTransition: (options: Record<string, unknown>) =>
    mockUseSharedChatPresentationTransition(options),
}));

jest.mock('./chat/useClientChatSdkController', () => ({
  useClientChatSdkController: (options: Record<string, unknown>) =>
    mockUseClientChatSdkController(options),
}));

jest.mock('./chat/symphonyNotifications', () => ({
  symphonyNotifications: {
    init: (ecpOrigin: string) => mockNotificationsInit(ecpOrigin),
    reset: () => mockNotificationsReset(),
    onCountChange: (callback: CountChangeCallback) => mockOnCountChange(callback),
    onNotificationEvent: (callback: (event: { type: string; summary: string; receivedAt: number; payload: Record<string, unknown> }) => void) => mockOnNotificationEvent(callback),
    onStreamUnreadChange: (callback: StreamUnreadChangeCallback) => mockOnStreamUnreadChange(callback),
    onDebugChange: (callback: (snapshot: typeof defaultNotificationDebugSnapshot) => void) => mockOnDebugChange(callback),
    get debugSnapshot() {
      return defaultNotificationDebugSnapshot;
    },
    get streamUnreadSnapshot() {
      return mockStreamUnreadCounts;
    },
    markMessagesViewed: jest.fn(),
    get count() {
      return mockNotificationCount;
    },
  },
}));

jest.mock('./chat/symphonySdk', () => ({
  symphonySdk: {
    init: (ecpOrigin: string, partnerId?: string) => mockSdkInit(ecpOrigin, partnerId),
    renderChat: (containerSelector: string, options: Record<string, unknown>) =>
      mockRenderChat(containerSelector, options),
    openStream: (streamId: string, containerSelector: string, renderOptions?: Record<string, unknown>) =>
      mockOpenStream(streamId, containerSelector, renderOptions),
    get isReady() {
      return true;
    },
    get error() {
      return null;
    },
    onStatusChange: (callback: (snapshot: { isReady: boolean; error: Error | null }) => void) => {
      callback({ isReady: true, error: null });
      return () => {};
    },
  },
}));

jest.mock('./chat/wealthSymphonyTheme', () => {
  const actual = jest.requireActual('./chat/wealthSymphonyTheme');
  return {
    ...actual,
    acquireWealthSymphonyThemeOwnership: () => mockAcquireWealthSymphonyThemeOwnership(),
    applyWealthSymphonyTheme: () => mockApplyWealthSymphonyTheme(),
    applyWealthSymphonyThemeWithSettle: () => { mockApplyWealthSymphonyTheme(); return Promise.resolve(); },
    refreshWealthSymphonyThemeAfterLayoutChange: () => mockRefreshWealthSymphonyThemeAfterLayoutChange(),
  };
});

const themeValue: ThemeState = {
  theme: {
    id: 'light',
    name: 'Light',
    colors: {
      primary: '#0a2c63',
      secondary: '#123b7a',
      error: '#dc2626',
      background: '#ffffff',
      surface: '#f8fafc',
      onPrimary: '#ffffff',
      onSecondary: '#ffffff',
      onBackground: '#0f172a',
      onSurface: '#0f172a',
      onError: '#ffffff',
      symphonyMode: 'light',
    },
  },
  themes: {},
  setTheme: jest.fn(),
  applyTheme: jest.fn(),
};

function renderWealthTree(path: string) {
  return (
    <ThemeContext.Provider value={themeValue}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={[path]}
      >
        <Routes>
          <Route path="/wealth-management/*" element={<WealthManagement />} />
          <Route path="/" element={<div>Root Home</div>} />
          <Route path="/wealth" element={<div>Legacy Wealth Home</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeContext.Provider>
  );
}

function renderWealth(path: string) {
  return render(renderWealthTree(path));
}

beforeEach(() => {
  mockNotificationCount = 0;
  mockStreamUnreadCounts = {};
  notificationListeners.clear();
  streamUnreadListeners.clear();
  notificationEventListeners.clear();
  mockSdkInit.mockClear();
  mockRenderChat.mockClear();
  mockOpenStream.mockClear();
  mockNotificationsInit.mockClear();
  mockNotificationsReset.mockClear();
  mockOnNotificationEvent.mockClear();
  mockOnStreamUnreadChange.mockClear();
  mockOnDebugChange.mockClear();
  mockApplyWealthSymphonyTheme.mockClear();
  mockRefreshWealthSymphonyThemeAfterLayoutChange.mockClear();
  mockReleaseWealthSymphonyThemeOwnership.mockClear();
  mockAcquireWealthSymphonyThemeOwnership.mockClear();
  mockAcquireWealthSymphonyThemeOwnership.mockImplementation(() => mockReleaseWealthSymphonyThemeOwnership);
  mockUseClientChatSdkController.mockReset();
  mockUseClientChatSdkController.mockImplementation((options: { contactId?: string | null; containerSelector?: string; enabled?: boolean; preload?: boolean }) => {
    const contact = (wealthManagementData.contacts ?? []).find((item) => item.id === options.contactId);
    const slotClassName = options.containerSelector?.startsWith('.')
      ? options.containerSelector.slice(1)
      : options.containerSelector ?? 'wealth-symphony-client-contact';
    return {
      chatError: null,
      contact,
      isChatReady: options.enabled !== false || options.preload === true,
      isLoading: false,
      sendMessageToChat: jest.fn(() => Promise.resolve()),
      slotClassName,
      streamId: contact?.streamId ?? 'wealth-room-default',
    };
  });
  mockUseSharedIframeChatHost.mockReset();
  mockUseSharedIframeChatHost.mockReturnValue({
    chatError: null,
    chatUrl: 'https://corporate.symphony.com/client-bff/index.html?embed=true&mode=light',
    handleError: jest.fn(),
    handleLoad: jest.fn(),
    isChatPrimed: true,
    isChatReady: true,
  });
  mockUseSharedChatPresentationTransition.mockReset();
  mockUseSharedChatPresentationTransition.mockImplementation(() => ({
    shellRef: { current: null },
    maskFrame: false,
  }));
});

afterEach(() => {
  jest.useRealTimers();
});

test('renders the wealth dashboard shell and key KPI tiles', async () => {
  renderWealth('/wealth-management');

  expect(await screen.findByText('Active Clients')).toBeInTheDocument();
  expect(screen.getByText('Hans Gruber')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Hans Gruber' })).toBeInTheDocument();
  expect(screen.getByText('Open Conversations')).toBeInTheDocument();
  expect(screen.queryByText('Unread Messages:')).not.toBeInTheDocument();
  expect(screen.getAllByText('E. Reed').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByRole('button', { name: 'Open Symphony chat' })).toBeInTheDocument();
  expect(screen.getByTestId('wealth-shared-chat-shell')).toBeInTheDocument();
  expect(screen.queryByText('Connecting to Symphony...')).not.toBeInTheDocument();
  const latestClientControllerArgs = mockUseClientChatSdkController.mock.calls.at(-1)?.[0] as {
    containerSelector?: string;
    enabled?: boolean;
    preload?: boolean;
  };
  expect(latestClientControllerArgs).toMatchObject({
    containerSelector: '.wealth-symphony-client-drawer-contact',
    enabled: false,
    preload: true,
  });
});

test('resets Wealth-local notification state when the module unmounts', async () => {
  const { unmount } = renderWealth('/wealth-management');

  expect(await screen.findByText('Active Clients')).toBeInTheDocument();

  unmount();

  expect(mockNotificationsReset).toHaveBeenCalledTimes(1);
});

test('keeps the full-page workspace loader visible while the hidden shared chat frame is only primed', async () => {
  mockUseSharedIframeChatHost.mockReturnValue({
    chatError: null,
    chatUrl: 'https://corporate.symphony.com/client-bff/index.html?embed=true&mode=light',
    handleError: jest.fn(),
    handleLoad: jest.fn(),
    isChatPrimed: true,
    isChatReady: false,
  });
  const { container } = renderWealth('/wealth-management');

  await waitFor(() => {
    expect(mockSdkInit).toHaveBeenCalled();
  });
  expect(screen.getByLabelText('Loading wealth workspace')).toBeInTheDocument();
  expect(screen.queryByText('Active Clients')).not.toBeInTheDocument();
  expect(container.querySelector('[data-testid="wealth-shared-chat-shell"]')).toBeInTheDocument();
  expect(container.querySelector('[data-testid="wealth-shared-chat-frame"]')).toBeInTheDocument();
  expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
});

test('keeps hard-refresh client drawer entry blocked until shared chat is ready', async () => {
  let sharedChatState = {
    chatError: null,
    chatUrl: 'https://corporate.symphony.com/client-bff/index.html?embed=true&mode=light',
    handleError: jest.fn(),
    handleLoad: jest.fn(),
    iframeRef: { current: null },
    isChatPrimed: true,
    isChatReady: false,
  };

  mockUseSharedIframeChatHost.mockImplementation(() => sharedChatState);

  const { rerender } = render(renderWealthTree('/wealth-management/clients?contactId=1'));

  await waitFor(() => {
    expect(mockSdkInit).toHaveBeenCalled();
  });

  expect(screen.getByLabelText('Loading wealth workspace')).toBeInTheDocument();
  expect(screen.queryByText(/Advisor coverage, relationship health/i)).not.toBeInTheDocument();

  sharedChatState = {
    ...sharedChatState,
    isChatReady: true,
  };

  rerender(renderWealthTree('/wealth-management/clients?contactId=1'));

  expect(await screen.findByText(/Advisor coverage, relationship health/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Wealth Chat' })).toBeInTheDocument();
  expect(screen.getByTestId('wealth-client-drawer-chat-slot')).toHaveClass('wealth-symphony-client-drawer-contact');
});

test('routes to the shared chat page from the advisor menu and hides the floating launcher', async () => {
  mockUseSharedChatPresentationTransition.mockImplementation(({ mode }: { mode: 'page' | 'drawer' }) => ({
    shellRef: { current: null },
    maskFrame: mode === 'page',
  }));
  renderWealth('/wealth-management');

  expect(await screen.findByText('Active Clients')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Hans Gruber/i }));
  await userEvent.click(screen.getByText('Open Symphony chat'));

  expect(await screen.findByRole('heading', { name: 'Wealth Chat' })).toBeInTheDocument();
  expect(screen.getByTestId('wealth-shared-chat-frame')).toBeInTheDocument();
  expect(screen.getByTestId('wealth-chat-frame-mask')).toBeInTheDocument();
  expect(screen.getByText('Loading chat')).toBeInTheDocument();
  const latestSharedChatArgs = mockUseSharedIframeChatHost.mock.calls.at(-1)?.[0] as {
    layoutMode?: 'drawer' | 'page';
  };
  expect(latestSharedChatArgs.layoutMode).toBe('page');
  expect(screen.queryByText('Active Clients')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Open Symphony chat' })).not.toBeInTheDocument();
});

test('shows the mounted drawer instantly without the first-open loader when shared chat is ready', async () => {
  renderWealth('/wealth-management');

  expect(await screen.findByText('Active Clients')).toBeInTheDocument();
  expect(screen.getByTestId('wealth-shared-chat-shell')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Open Symphony chat' }));

  expect(await screen.findByText('Wealth Chat')).toBeInTheDocument();
  expect(screen.getByText('Symphony')).toBeInTheDocument();
  expect(screen.queryByText('Connecting to Symphony...')).not.toBeInTheDocument();
  const shell = screen.getByTestId('wealth-shared-chat-shell');
  expect(shell).toHaveStyle({ transform: 'translateX(0)' });
});

test('opens the embedded client chat drawer when launching from the client list', async () => {
  renderWealth('/wealth-management/clients');

  expect(await screen.findByText(/Advisor coverage, relationship health/i)).toBeInTheDocument();
  await userEvent.type(screen.getByPlaceholderText('Search clients…'), 'Evelyn');
  const clientRowLabel = screen.getAllByText('Evelyn Reed').find((element) => element.closest('tr'));
  expect(clientRowLabel).toBeTruthy();
  const clientRow = clientRowLabel?.closest('tr');
  expect(clientRow).not.toBeNull();

  await userEvent.click(within(clientRow as HTMLElement).getByRole('button', { name: /chat/i }));

  expect(await screen.findByRole('heading', { name: 'Wealth Chat' })).toBeInTheDocument();
  expect(screen.getByTestId('wealth-client-drawer-chat-slot')).toHaveClass('wealth-symphony-client-drawer-contact');
  expect(screen.queryByTitle('Wealth client chat')).not.toBeInTheDocument();
  const latestSharedChatArgs = mockUseSharedIframeChatHost.mock.calls.at(-1)?.[0] as {
    layoutMode?: 'drawer' | 'page';
  };
  expect(latestSharedChatArgs.layoutMode).toBe('drawer');
  const latestClientControllerArgs = mockUseClientChatSdkController.mock.calls.at(-1)?.[0] as {
    containerSelector?: string;
    contactId?: string | null;
    enabled?: boolean;
    preload?: boolean;
  };
  expect(latestClientControllerArgs).toMatchObject({
    containerSelector: '.wealth-symphony-client-drawer-contact',
    contactId: '1',
    enabled: true,
    preload: true,
  });
  expect(screen.getAllByRole('button', { name: 'Close Symphony drawer' }).length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText(/Advisor coverage, relationship health/i)).toBeInTheDocument();
});

test('renders the client detail page and opens the dedicated client slot stream', async () => {
  renderWealth('/wealth-management/clients/1');

  expect(await screen.findByRole('heading', { name: 'Evelyn Reed' })).toBeInTheDocument();
  expect(screen.getByText('Embedded Communication Panel')).toBeInTheDocument();
  expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  expect(screen.getByTestId('wealth-client-chat-slot')).toHaveClass('wealth-symphony-client-contact');
  expect(screen.queryByTitle('Wealth client chat')).not.toBeInTheDocument();
  const latestClientControllerArgs = mockUseClientChatSdkController.mock.calls.at(-1)?.[0] as {
    contactId?: string | null;
  };
  expect(latestClientControllerArgs.contactId).toBe('1');
  expect(screen.getByTestId('wealth-shared-chat-shell')).toBeInTheDocument();
});

test('surfaces the shared chat iframe error inside the shared chat shell', async () => {
  mockUseSharedIframeChatHost.mockReturnValue({
    chatError: 'Shared collaboration render failed.',
    chatUrl: 'https://corporate.symphony.com/client-bff/index.html?embed=true&mode=light',
    handleError: jest.fn(),
    handleLoad: jest.fn(),
    isChatPrimed: false,
    isChatReady: false,
  });

  renderWealth('/wealth-management/chat');

  expect(await screen.findByRole('heading', { name: 'Wealth Chat' })).toBeInTheDocument();
  expect(screen.queryByText('Active Clients')).not.toBeInTheDocument();
  expect(await screen.findByText('Unable to load Symphony chat')).toBeInTheDocument();
  expect(screen.getByText('Shared collaboration render failed.')).toBeInTheDocument();
});

test('shows a red unread count badge on the top notifications bell', async () => {
  mockNotificationCount = 3;
  renderWealth('/wealth-management');

  expect(await screen.findByText('Active Clients')).toBeInTheDocument();
  const notificationsButton = await screen.findByLabelText('Notifications (3 unread)');

  expect(notificationsButton).toBeInTheDocument();
  expect(notificationsButton.parentElement).toHaveTextContent('3');
  expect(screen.getByText('Unread Messages')).toBeInTheDocument();
  expect(screen.getByText('Unread Messages').parentElement).toHaveTextContent('3Unread Messages');
});

test('shows the Symphony notification menu under the bell icon', async () => {
  mockNotificationCount = 2;
  renderWealth('/wealth-management');

  expect(await screen.findByText('Active Clients')).toBeInTheDocument();
  await waitFor(() => expect(mockOnNotificationEvent).toHaveBeenCalled());

  act(() => {
    notificationEventListeners.forEach((callback) => {
      callback({
        type: 'MessageNotifications',
        summary: 'Reed Family Office: Hans Gruber',
        receivedAt: 1711111111111,
        payload: {
          streamName: 'Reed Family Office',
          fromWhomName: 'Hans Gruber',
          message: 'Quarterly review deck is ready.',
        },
      });
    });
  });

  await userEvent.click(screen.getByLabelText('Notifications (2 unread)'));

  expect(screen.getByText('Recent Notifications')).toBeInTheDocument();
  expect(screen.getByText('2 unread in Symphony')).toBeInTheDocument();
  expect(screen.getByText('Hans Gruber')).toBeInTheDocument();
});

test('shows unread client indicators on the client list page', async () => {
  const evelynStreamId = (wealthManagementData.contacts ?? []).find((contact) => contact.name === 'Evelyn Reed')?.streamId;
  mockStreamUnreadCounts = {
    [evelynStreamId ?? '']: 2,
  };

  renderWealth('/wealth-management/clients');

  expect(await screen.findByText(/Advisor coverage, relationship health/i)).toBeInTheDocument();

  const evelynLabel = screen.getAllByText('Evelyn Reed').find((element) => element.closest('tr'));
  expect(evelynLabel).toBeTruthy();
  const evelynRow = evelynLabel?.closest('tr') as HTMLElement;

  await waitFor(() => {
    expect(within(evelynRow).getByText(/2 unread/i)).toBeInTheDocument();
    expect(within(evelynRow).getByRole('button', { name: /chat/i })).toHaveTextContent('2');
  });
});

test('returns to the root page from the header home button', async () => {
  renderWealth('/wealth-management');

  expect(await screen.findByText('Active Clients')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Return to wealth home' }));

  expect(await screen.findByText('Root Home')).toBeInTheDocument();
});

test('leaves no visible drawer shell when navigating from chat back to the homepage', async () => {
  renderWealth('/wealth-management/chat');

  expect(await screen.findByRole('heading', { name: 'Wealth Chat' })).toBeInTheDocument();
  expect(screen.queryByText('Active Clients')).not.toBeInTheDocument();
  await userEvent.click(screen.getAllByRole('button', { name: 'Dashboard' })[0]);

  expect(await screen.findByText('Active Clients')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Close Symphony drawer' })).not.toBeInTheDocument();
});

test('releases wealth Symphony theme ownership when the mini app unmounts', async () => {
  const { unmount } = renderWealth('/wealth-management');

  expect(await screen.findByText('Active Clients')).toBeInTheDocument();

  unmount();

  expect(mockReleaseWealthSymphonyThemeOwnership).toHaveBeenCalledTimes(1);
});
