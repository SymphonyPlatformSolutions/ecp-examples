import { act, render, screen, waitFor } from '@testing-library/react';
import { useSharedWealthChatController } from './useSharedWealthChatController';

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
const mockNotificationsInit = jest.fn();
const mockApplyWealthSymphonyTheme = jest.fn();
const mockApplyWealthSymphonyThemeWithSettle = jest.fn(() => Promise.resolve());
const mockResetIfError = jest.fn(() => true) as unknown as jest.Mock<boolean, []>;

jest.mock('./symphonySdk', () => ({
  symphonySdk: {
    init: (ecpOrigin: string, partnerId?: string) => mockInit(ecpOrigin, partnerId),
    renderChat: (containerSelector: string, options: Record<string, unknown>) =>
      mockRenderChat(containerSelector, options),
    openStream: (streamId: string, containerSelector: string, options?: Record<string, unknown>) =>
      mockOpenStream(streamId, containerSelector, options),
    resetIfError: () => mockResetIfError(),
  },
}));

jest.mock('./symphonyNotifications', () => ({
  symphonyNotifications: {
    init: (ecpOrigin: string) => mockNotificationsInit(ecpOrigin),
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

function HookHarness({
  requestedStreamId,
}: {
  requestedStreamId?: string;
}) {
  const state = useSharedWealthChatController({
    ecpOrigin: 'corporate.symphony.com',
    partnerId: undefined,
    requestedStreamId,
  });

  return (
    <div>
      <div data-testid="status">{state.isBootstrapping ? 'bootstrapping' : 'ready'}</div>
      <div data-testid="switching">{state.isSwitchingStream ? 'switching' : 'idle'}</div>
      <div data-testid="slot">{state.slotClassName}</div>
      <div data-testid="error">{state.bootstrapError?.message ?? state.streamError?.message ?? ''}</div>
    </div>
  );
}

beforeEach(() => {
  mockInit.mockClear();
  mockRenderChat.mockClear();
  mockOpenStream.mockClear();
  mockResetIfError.mockClear();
  mockNotificationsInit.mockClear();
  mockApplyWealthSymphonyTheme.mockClear();
  mockApplyWealthSymphonyThemeWithSettle.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

test('bootstraps the shared chat by rendering the real collaboration slot once', async () => {
  render(<HookHarness />);

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  expect(mockInit).toHaveBeenCalledWith('corporate.symphony.com', undefined);
  expect(mockRenderChat).toHaveBeenCalledWith(
    '.wealth-symphony-shared',
    expect.objectContaining({ mode: 'light' }),
  );
  expect(mockNotificationsInit).toHaveBeenCalledWith('corporate.symphony.com');
  expect(mockApplyWealthSymphonyTheme).toHaveBeenCalled();
  expect(screen.getByTestId('slot')).toHaveTextContent('wealth-symphony-shared');
});

test('opens a requested contact stream after the shared chat has bootstrapped without re-rendering', async () => {
  const { rerender } = render(<HookHarness />);

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });
  mockRenderChat.mockClear();

  rerender(<HookHarness requestedStreamId="stream-1" />);

  await waitFor(() => {
    expect(mockOpenStream).toHaveBeenCalledWith(
      'stream-1',
      '.wealth-symphony-shared',
      expect.objectContaining({ mode: 'light' }),
    );
  });
  expect(mockApplyWealthSymphonyThemeWithSettle).toHaveBeenCalledTimes(1);
  expect(mockRenderChat).not.toHaveBeenCalled();
});

test('does not reopen the same shared stream twice', async () => {
  const { rerender } = render(<HookHarness requestedStreamId="stream-1" />);

  await waitFor(() => {
    expect(mockOpenStream).toHaveBeenCalledTimes(1);
  });

  rerender(<HookHarness requestedStreamId="stream-1" />);

  await waitFor(() => {
    expect(mockOpenStream).toHaveBeenCalledTimes(1);
  });
});

test('retries a transient bootstrap failure before surfacing an error', async () => {
  jest.useFakeTimers();
  mockRenderChat
    .mockRejectedValueOnce(new Error('render failed'))
    .mockResolvedValueOnce(undefined);

  render(<HookHarness />);

  await waitFor(() => {
    expect(mockRenderChat).toHaveBeenCalledTimes(1);
  });

  expect(screen.getByTestId('status')).toHaveTextContent('bootstrapping');
  expect(screen.getByTestId('error')).toHaveTextContent('');

  await act(async () => {
    jest.advanceTimersByTime(1000);
  });

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  expect(mockResetIfError).toHaveBeenCalledTimes(1);
  expect(mockRenderChat).toHaveBeenCalledTimes(2);
  expect(mockNotificationsInit).toHaveBeenCalledTimes(1);
});

test('surfaces a non-retryable bootstrap failure immediately', async () => {
  mockRenderChat.mockRejectedValueOnce(new Error('403 forbidden'));

  render(<HookHarness />);

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    expect(screen.getByTestId('error')).toHaveTextContent('403 forbidden');
  });

  expect(mockResetIfError).not.toHaveBeenCalled();
  expect(mockRenderChat).toHaveBeenCalledTimes(1);
});

test('retries a transient stream switch failure before surfacing an error', async () => {
  jest.useFakeTimers();
  mockOpenStream
    .mockRejectedValueOnce(new Error('stream failed'))
    .mockResolvedValueOnce(undefined);

  const { rerender } = render(<HookHarness />);

  await waitFor(() => {
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  rerender(<HookHarness requestedStreamId="stream-1" />);

  await waitFor(() => {
    expect(mockOpenStream).toHaveBeenCalledTimes(1);
  });

  expect(screen.getByTestId('switching')).toHaveTextContent('switching');

  await act(async () => {
    jest.advanceTimersByTime(500);
  });

  await waitFor(() => {
    expect(mockOpenStream).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('switching')).toHaveTextContent('idle');
  });

  expect(mockResetIfError).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('error')).toHaveTextContent('');
});
