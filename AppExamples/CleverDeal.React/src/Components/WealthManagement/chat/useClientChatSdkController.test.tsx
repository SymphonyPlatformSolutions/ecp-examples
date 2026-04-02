import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useClientChatSdkController } from './useClientChatSdkController';

const mockInit = jest.fn(() => Promise.resolve()) as unknown as jest.Mock<
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
const mockSendMessage = jest.fn(() => Promise.resolve()) as unknown as jest.Mock<
  Promise<void>,
  [Record<string, unknown>, Record<string, unknown>]
>;
const mockResetIfError = jest.fn(() => true) as unknown as jest.Mock<boolean, []>;
const mockMarkMessagesViewed = jest.fn();
const mockApplyWealthSymphonyTheme = jest.fn();
const mockApplyWealthSymphonyThemeWithSettle = jest.fn(() => Promise.resolve());
let mockRenderedStreamId: string | undefined;
let mockHasRendered = false;
let mockIsReady = false;

jest.mock('./symphonySdk', () => ({
  symphonySdk: {
    init: async (ecpOrigin: string, partnerId?: string) => {
      await mockInit(ecpOrigin, partnerId);
      mockIsReady = true;
    },
    renderChat: async (containerSelector: string, options: Record<string, unknown>) => {
      await mockRenderChat(containerSelector, options);
      mockHasRendered = true;
      mockRenderedStreamId = typeof options.streamId === 'string' ? options.streamId : undefined;
    },
    openStream: async (streamId: string, containerSelector: string, options?: Record<string, unknown>) => {
      await mockOpenStream(streamId, containerSelector, options);
      mockHasRendered = true;
      mockRenderedStreamId = streamId;
    },
    sendMessage: (message: Record<string, unknown>, options: Record<string, unknown>) =>
      mockSendMessage(message, options),
    hasRendered: () => mockHasRendered,
    getRenderedStreamId: () => mockRenderedStreamId,
    resetIfError: () => {
      const didReset = mockResetIfError();
      if (didReset) {
        mockHasRendered = false;
        mockIsReady = false;
        mockRenderedStreamId = undefined;
      }
      return didReset;
    },
    get isReady() {
      return mockIsReady;
    },
  },
}));

jest.mock('./symphonyNotifications', () => ({
  symphonyNotifications: {
    markMessagesViewed: (streamId?: string) => mockMarkMessagesViewed(streamId),
  },
}));

jest.mock('./wealthSymphonyTheme', () => {
  const actual = jest.requireActual('./wealthSymphonyTheme');
  return {
    ...actual,
    applyWealthSymphonyTheme: () => mockApplyWealthSymphonyTheme(),
    applyWealthSymphonyThemeWithSettle: () => mockApplyWealthSymphonyThemeWithSettle(),
  };
});

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function HookHarness({
  contactId,
  enabled = true,
  preload = false,
}: {
  contactId?: string | null;
  enabled?: boolean;
  preload?: boolean;
}) {
  const state = useClientChatSdkController({
    contactId,
    ecpOrigin: 'corporate.symphony.com',
    enabled,
    preload,
  });

  return (
    <div>
      <div data-testid="status">{state.isLoading ? 'loading' : state.isChatReady ? 'ready' : 'idle'}</div>
      <div data-testid="error">{state.chatError ?? ''}</div>
      <div data-testid="contact-name">{state.contact?.name ?? ''}</div>
      <div data-testid="stream-id">{state.streamId ?? ''}</div>
      <div data-testid="slot">{state.slotClassName}</div>
      <button
        type="button"
        onClick={() => {
          void state.sendMessageToChat({
            text: {
              'text/markdown': 'Sample client message',
            },
          });
        }}
      >
        Send sample message
      </button>
      <div className={state.slotClassName} />
    </div>
  );
}

beforeEach(() => {
  mockInit.mockClear();
  mockRenderChat.mockClear();
  mockOpenStream.mockClear();
  mockSendMessage.mockClear();
  mockResetIfError.mockClear();
  mockMarkMessagesViewed.mockClear();
  mockApplyWealthSymphonyTheme.mockClear();
  mockApplyWealthSymphonyThemeWithSettle.mockClear();
  mockApplyWealthSymphonyThemeWithSettle.mockImplementation(() => Promise.resolve());
  mockRenderedStreamId = undefined;
  mockHasRendered = false;
  mockIsReady = false;
});

afterEach(() => {
  jest.useRealTimers();
});

test('preloads the client chat SDK by initialising the SDK without rendering a generic stream', async () => {
  render(<HookHarness enabled={false} preload />);

  await waitFor(() => {
    expect(mockInit).toHaveBeenCalledWith('corporate.symphony.com', undefined);
  });

  expect(mockRenderChat).not.toHaveBeenCalled();
  expect(mockOpenStream).not.toHaveBeenCalled();
  expect(screen.getByTestId('status')).toHaveTextContent('idle');
});

test('opens the selected contact stream directly after the preload-only bootstrap', async () => {
  const { rerender } = render(<HookHarness enabled={false} preload />);

  await waitFor(() => {
    expect(mockInit).toHaveBeenCalled();
  });

  mockInit.mockClear();
  mockRenderChat.mockClear();
  mockOpenStream.mockClear();

  rerender(<HookHarness contactId="1" preload />);

  const streamId = screen.getByTestId('stream-id').textContent ?? '';

  await waitFor(() => {
    expect(mockInit).toHaveBeenCalled();
    expect(mockOpenStream).toHaveBeenCalledWith(
      streamId,
      '.wealth-symphony-client-contact',
      expect.objectContaining({
        condensed: false,
        showMembers: false,
        symphonyLogo: false,
      }),
    );
  });

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  expect(screen.getByTestId('contact-name')).toHaveTextContent('Evelyn Reed');
  expect(screen.getByTestId('slot')).toHaveTextContent('wealth-symphony-client-contact');
  expect(mockInit).toHaveBeenCalledWith('corporate.symphony.com', undefined);
  expect(mockOpenStream).toHaveBeenCalledWith(
    streamId,
    '.wealth-symphony-client-contact',
    expect.objectContaining({
      condensed: false,
      showMembers: false,
      symphonyLogo: false,
    }),
  );
  expect(mockRenderChat).not.toHaveBeenCalled();
  expect(mockApplyWealthSymphonyTheme).toHaveBeenCalled();
  expect(mockApplyWealthSymphonyThemeWithSettle).toHaveBeenCalled();
  expect(mockMarkMessagesViewed).toHaveBeenCalledWith(streamId);
});

test('opens the contact stream directly after init-only preload without duplicate renders', async () => {
  const { rerender } = render(<HookHarness enabled={false} preload />);

  await waitFor(() => {
    expect(mockInit).toHaveBeenCalled();
  });

  mockInit.mockClear();
  mockRenderChat.mockClear();
  mockOpenStream.mockClear();

  rerender(<HookHarness contactId="1" preload />);

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  const streamId = screen.getByTestId('stream-id').textContent ?? '';

  expect(mockOpenStream).toHaveBeenCalledWith(
    streamId,
    '.wealth-symphony-client-contact',
    expect.objectContaining({
      condensed: false,
      showMembers: false,
      symphonyLogo: false,
    }),
  );
  expect(mockRenderChat).not.toHaveBeenCalled();
});

test('opens the client stream directly with Wealth SDK options when a client page loads directly', async () => {
  render(<HookHarness contactId="1" />);

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  const streamId = screen.getByTestId('stream-id').textContent ?? '';

  expect(mockOpenStream).toHaveBeenCalledWith(
    streamId,
    '.wealth-symphony-client-contact',
    expect.objectContaining({
      condensed: false,
      showMembers: false,
      symphonyLogo: false,
    }),
  );
  expect(mockRenderChat).not.toHaveBeenCalled();
});

test('reuses the mounted client container when the drawer closes and reopens on the same client', async () => {
  const { rerender } = render(<HookHarness contactId="1" preload />);

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  mockOpenStream.mockClear();

  rerender(<HookHarness enabled={false} preload />);
  rerender(<HookHarness contactId="1" preload />);

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  expect(mockOpenStream).not.toHaveBeenCalled();
});

test('switches quickly to a new contact stream and sends messages through the active client slot', async () => {
  const { rerender } = render(<HookHarness contactId="1" preload />);

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  mockRenderChat.mockClear();
  mockOpenStream.mockClear();

  rerender(<HookHarness contactId="2" />);

  await waitFor(() => {
    expect(screen.getByTestId('contact-name')).toHaveTextContent('Jonathan Smith');
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  const streamId = screen.getByTestId('stream-id').textContent ?? '';

  expect(mockOpenStream).toHaveBeenCalledWith(
    streamId,
    '.wealth-symphony-client-contact',
    expect.objectContaining({
      condensed: false,
      showMembers: false,
      symphonyLogo: false,
    }),
  );
  expect(mockRenderChat).not.toHaveBeenCalled();

  await userEvent.click(screen.getByRole('button', { name: 'Send sample message' }));

  await waitFor(() => {
    expect(mockSendMessage).toHaveBeenCalledWith(
      {
        text: {
          'text/markdown': 'Sample client message',
        },
      },
      expect.objectContaining({
        containerSelector: '.wealth-symphony-client-contact',
        mode: 'blast',
        streamIds: [streamId],
        users: [],
      }),
    );
  });
});

test('keeps using openStream when switching a warm rendered client container', async () => {
  const { rerender } = render(<HookHarness contactId="1" preload />);

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  mockOpenStream.mockClear();
  mockRenderChat.mockClear();

  rerender(<HookHarness contactId="2" preload />);

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  expect(mockOpenStream).toHaveBeenCalledWith(
    screen.getByTestId('stream-id').textContent ?? '',
    '.wealth-symphony-client-contact',
    expect.objectContaining({
      condensed: false,
      showMembers: false,
      symphonyLogo: false,
    }),
  );
  expect(mockRenderChat).not.toHaveBeenCalled();
});

test('reveals the client chat before the background theme settle finishes on a warm switch', async () => {
  const themeSettle = createDeferred<void>();
  mockApplyWealthSymphonyThemeWithSettle.mockImplementation(() => themeSettle.promise);

  const { rerender } = render(<HookHarness contactId="1" preload />);

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  mockOpenStream.mockClear();

  rerender(<HookHarness contactId="2" preload />);

  await waitFor(() => {
    expect(screen.getByTestId('contact-name')).toHaveTextContent('Jonathan Smith');
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  expect(mockOpenStream).toHaveBeenCalledWith(
    screen.getByTestId('stream-id').textContent ?? '',
    '.wealth-symphony-client-contact',
    expect.objectContaining({
      condensed: false,
      showMembers: false,
      symphonyLogo: false,
    }),
  );

  themeSettle.resolve();
  await act(async () => {
    await themeSettle.promise;
  });
});

test('does not fall back to the shared wealth room when a requested client stream is missing', async () => {
  render(<HookHarness contactId="missing-client" preload />);

  await waitFor(() => {
    expect(screen.getByTestId('error')).toHaveTextContent('Client chat is not available right now.');
  });

  expect(screen.getByTestId('status')).toHaveTextContent('idle');
  expect(mockRenderChat).not.toHaveBeenCalled();
  expect(mockOpenStream).not.toHaveBeenCalled();
});

test('retries a transient client stream load failure before surfacing an error', async () => {
  jest.useFakeTimers();
  mockOpenStream
    .mockRejectedValueOnce(new Error('open failed'))
    .mockResolvedValueOnce(undefined);

  render(<HookHarness contactId="1" preload />);

  await waitFor(() => {
    expect(mockOpenStream).toHaveBeenCalledTimes(1);
  });

  expect(screen.getByTestId('status')).toHaveTextContent('loading');
  expect(screen.getByTestId('error')).toHaveTextContent('');

  await act(async () => {
    jest.advanceTimersByTime(500);
  });

  await waitFor(() => {
    expect(mockOpenStream).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  expect(mockResetIfError).toHaveBeenCalledTimes(1);
});
