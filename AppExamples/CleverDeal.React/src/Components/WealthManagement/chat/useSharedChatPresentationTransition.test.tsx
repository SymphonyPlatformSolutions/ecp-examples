import { act, render, screen, waitFor } from '@testing-library/react';
import { useSharedChatPresentationTransition } from './useSharedChatPresentationTransition';

const mockRefreshWealthSymphonyThemeAfterLayoutChange = jest.fn(() => Promise.resolve());

jest.mock('./wealthSymphonyTheme', () => ({
  refreshWealthSymphonyThemeAfterLayoutChange: () => mockRefreshWealthSymphonyThemeAfterLayoutChange(),
}));

class ResizeObserverMock {
  observe = jest.fn();
  disconnect = jest.fn();
}

function HookHarness({ mode, isReady, isVisible = true }: { mode: 'page' | 'drawer'; isReady: boolean; isVisible?: boolean }) {
  const { shellRef, maskFrame } = useSharedChatPresentationTransition({ mode, isReady, isVisible });

  return (
    <div ref={shellRef} data-testid="shell">
      <span data-testid="mask-state">{maskFrame ? 'masked' : 'clear'}</span>
    </div>
  );
}

describe('useSharedChatPresentationTransition', () => {
  const originalResizeObserver = global.ResizeObserver;
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalCancelAnimationFrame = window.cancelAnimationFrame;

  beforeEach(() => {
    jest.useFakeTimers();
    global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
    window.requestAnimationFrame = ((callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(Date.now()), 0)) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = ((handle: number) => window.clearTimeout(handle)) as typeof window.cancelAnimationFrame;
    mockRefreshWealthSymphonyThemeAfterLayoutChange.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    global.ResizeObserver = originalResizeObserver;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  test('masks and refreshes the shared frame when switching from drawer to page mode', async () => {
    const { rerender } = render(<HookHarness mode="drawer" isReady={true} />);

    expect(screen.getByTestId('mask-state')).toHaveTextContent('masked');

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(mockRefreshWealthSymphonyThemeAfterLayoutChange).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('mask-state')).toHaveTextContent('clear');
    });

    mockRefreshWealthSymphonyThemeAfterLayoutChange.mockClear();

    let resolveRefresh: (() => void) | undefined;
    mockRefreshWealthSymphonyThemeAfterLayoutChange.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    rerender(<HookHarness mode="page" isReady={true} />);

    expect(screen.getByTestId('mask-state')).toHaveTextContent('masked');

    await act(async () => {
      jest.runAllTimers();
    });

    expect(mockRefreshWealthSymphonyThemeAfterLayoutChange).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mask-state')).toHaveTextContent('masked');

    await act(async () => {
      resolveRefresh?.();
    });

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByTestId('mask-state')).toHaveTextContent('clear');
    });
  });

  test('repeats the hidden refresh path when switching back from page to drawer mode', async () => {
    const { rerender } = render(<HookHarness mode="page" isReady={true} />);

    rerender(<HookHarness mode="drawer" isReady={true} />);

    expect(screen.getByTestId('mask-state')).toHaveTextContent('masked');

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(mockRefreshWealthSymphonyThemeAfterLayoutChange).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('mask-state')).toHaveTextContent('clear');
    });
  });

  test('masks and refreshes when the drawer chat becomes visible after being hidden', async () => {
    const { rerender } = render(<HookHarness mode="drawer" isReady={true} isVisible={false} />);

    expect(screen.getByTestId('mask-state')).toHaveTextContent('clear');

    rerender(<HookHarness mode="drawer" isReady={true} isVisible={true} />);

    expect(screen.getByTestId('mask-state')).toHaveTextContent('masked');

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(mockRefreshWealthSymphonyThemeAfterLayoutChange).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('mask-state')).toHaveTextContent('clear');
    });
  });

  test('masks and refreshes when a page chat becomes visible after being hidden', async () => {
    const { rerender } = render(<HookHarness mode="page" isReady={true} isVisible={false} />);

    expect(screen.getByTestId('mask-state')).toHaveTextContent('clear');

    rerender(<HookHarness mode="page" isReady={true} isVisible={true} />);

    expect(screen.getByTestId('mask-state')).toHaveTextContent('masked');

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(mockRefreshWealthSymphonyThemeAfterLayoutChange).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('mask-state')).toHaveTextContent('clear');
    });
  });

  test('keeps the first visible ready state masked until layout settle and theme refresh complete', async () => {
    const { rerender } = render(<HookHarness mode="drawer" isReady={false} isVisible={true} />);

    expect(screen.getByTestId('mask-state')).toHaveTextContent('clear');

    rerender(<HookHarness mode="drawer" isReady={true} isVisible={true} />);

    expect(screen.getByTestId('mask-state')).toHaveTextContent('masked');

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(mockRefreshWealthSymphonyThemeAfterLayoutChange).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('mask-state')).toHaveTextContent('clear');
    });
  });
});
