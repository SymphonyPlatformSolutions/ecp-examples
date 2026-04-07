import { act, render, screen } from '@testing-library/react';
import { beforeEach, expect, jest, test } from '@jest/globals';
import { useSharedIframeChatHost } from './useSharedIframeChatHost';

function HookHarness({
  layoutMode,
}: {
  layoutMode?: 'drawer' | 'page';
}) {
  const state = useSharedIframeChatHost({
    ecpOrigin: 'corporate.symphony.com',
    layoutMode,
    partnerId: 'partner-123',
  });

  return (
    <div>
      <div data-testid="primed-status">{state.isChatPrimed ? 'primed' : 'cold'}</div>
      <div data-testid="status">{state.isChatReady ? 'ready' : 'waiting'}</div>
      <div data-testid="error">{state.chatError ?? ''}</div>
      <div data-testid="chat-url">{state.chatUrl}</div>
      <iframe ref={state.iframeRef} title="Shared iframe" />
      <button type="button" onClick={state.handleLoad}>mark ready</button>
      <button type="button" onClick={state.handleError}>mark error</button>
    </div>
  );
}

function dispatchClientReadyMessage(source: MessageEventSource | null, origin = 'https://corporate.symphony.com') {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { eventType: 'clientReady' },
        origin,
        source,
      }),
    );
  });
}

beforeEach(() => {
  jest.useRealTimers();
});

test('builds the shared drawer iframe url in collaboration mode without pinning a room', () => {
  render(<HookHarness layoutMode="drawer" />);

  const url = new URL(screen.getByTestId('chat-url').textContent ?? '');

  expect(url.origin).toBe('https://corporate.symphony.com');
  expect(url.pathname).toBe('/client-bff/index.html');
  expect(url.searchParams.get('embed')).toBe('true');
  expect(url.searchParams.get('partnerId')).toBe('partner-123');
  expect(url.searchParams.get('streamId')).toBeNull();
  expect(url.searchParams.get('mode')).toBe('light');
  expect(url.searchParams.get('condensed')).toBe('true');
  expect(url.searchParams.get('allowChatCreation')).toBe('true');
  expect(url.searchParams.get('allowedApps')).toContain('com.symphony.zoom');
  expect(url.searchParams.get('sdkOrigin')).toBe(window.location.origin);
  expect(url.searchParams.get('theme')).toBeNull();
});

test('builds the shared page iframe url in collaboration mode without pinning a room', () => {
  render(<HookHarness layoutMode="page" />);

  const url = new URL(screen.getByTestId('chat-url').textContent ?? '');

  expect(url.origin).toBe('https://corporate.symphony.com');
  expect(url.pathname).toBe('/client-bff/index.html');
  expect(url.searchParams.get('embed')).toBe('true');
  expect(url.searchParams.get('partnerId')).toBe('partner-123');
  expect(url.searchParams.get('mode')).toBe('light');
  expect(url.searchParams.get('condensed')).toBe('false');
  expect(url.searchParams.get('allowChatCreation')).toBe('true');
  expect(url.searchParams.get('streamId')).toBeNull();
  expect(url.searchParams.get('sdkOrigin')).toBe(window.location.origin);
  expect(url.searchParams.get('theme')).toBeNull();
});

test('waits for the shared iframe clientReady message before marking the chat ready', () => {
  render(<HookHarness layoutMode="drawer" />);

  const iframe = screen.getByTitle('Shared iframe') as HTMLIFrameElement;
  const iframeWindow = { name: 'shared-frame' } as unknown as Window;
  Object.defineProperty(iframe, 'contentWindow', {
    configurable: true,
    value: iframeWindow,
  });

  act(() => {
    screen.getByRole('button', { name: 'mark ready' }).click();
  });

  expect(screen.getByTestId('primed-status').textContent).toBe('primed');
  expect(screen.getByTestId('status').textContent).toBe('waiting');

  dispatchClientReadyMessage({ name: 'another-frame' } as unknown as Window);
  expect(screen.getByTestId('primed-status').textContent).toBe('primed');
  expect(screen.getByTestId('status').textContent).toBe('waiting');

  dispatchClientReadyMessage(iframeWindow);
  expect(screen.getByTestId('primed-status').textContent).toBe('primed');
  expect(screen.getByTestId('status').textContent).toBe('ready');
  expect(screen.getByTestId('error').textContent).toBe('');
});

test('ignores shared iframe clientReady messages until the iframe window is attached', () => {
  render(<HookHarness layoutMode="drawer" />);

  dispatchClientReadyMessage({ name: 'shared-frame' } as unknown as Window);
  expect(screen.getByTestId('primed-status').textContent).toBe('cold');
  expect(screen.getByTestId('status').textContent).toBe('waiting');

  const iframe = screen.getByTitle('Shared iframe') as HTMLIFrameElement;
  const iframeWindow = { name: 'shared-frame' } as unknown as Window;
  Object.defineProperty(iframe, 'contentWindow', {
    configurable: true,
    value: iframeWindow,
  });

  dispatchClientReadyMessage(iframeWindow);
  expect(screen.getByTestId('primed-status').textContent).toBe('primed');
  expect(screen.getByTestId('status').textContent).toBe('ready');
});

test('treats iframe load as primed without declaring the chat ready yet', () => {
  render(<HookHarness layoutMode="drawer" />);

  act(() => {
    screen.getByRole('button', { name: 'mark ready' }).click();
  });

  expect(screen.getByTestId('primed-status').textContent).toBe('primed');
  expect(screen.getByTestId('status').textContent).toBe('waiting');
  expect(screen.getByTestId('error').textContent).toBe('');
});

test('tracks iframe error state without resetting the locked shared url when the layout changes', () => {
  const { rerender } = render(<HookHarness layoutMode="drawer" />);
  const initialUrl = screen.getByTestId('chat-url').textContent ?? '';

  const iframe = screen.getByTitle('Shared iframe') as HTMLIFrameElement;
  const iframeWindow = { name: 'shared-frame' } as unknown as Window;
  Object.defineProperty(iframe, 'contentWindow', {
    configurable: true,
    value: iframeWindow,
  });

  dispatchClientReadyMessage(iframeWindow);

  expect(screen.getByTestId('primed-status').textContent).toBe('primed');
  expect(screen.getByTestId('status').textContent).toBe('ready');
  expect(screen.getByTestId('error').textContent).toBe('');

  rerender(<HookHarness layoutMode="page" />);

  expect(screen.getByTestId('chat-url').textContent).toBe(initialUrl);
  expect(screen.getByTestId('primed-status').textContent).toBe('primed');
  expect(screen.getByTestId('status').textContent).toBe('ready');
  expect(screen.getByTestId('error').textContent).toBe('');

  act(() => {
    screen.getByRole('button', { name: 'mark error' }).click();
  });

  expect(screen.getByTestId('primed-status').textContent).toBe('cold');
  expect(screen.getByTestId('status').textContent).toBe('waiting');
  expect(screen.getByTestId('error').textContent).toBe('Unable to load Symphony chat.');
});
