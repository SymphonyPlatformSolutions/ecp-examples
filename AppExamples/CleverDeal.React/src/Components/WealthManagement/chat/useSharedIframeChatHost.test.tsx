import { act, render, screen } from '@testing-library/react';
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
      <div data-testid="status">{state.isChatReady ? 'ready' : 'waiting'}</div>
      <div data-testid="error">{state.chatError ?? ''}</div>
      <div data-testid="chat-url">{state.chatUrl}</div>
      <button type="button" onClick={state.handleLoad}>mark ready</button>
      <button type="button" onClick={state.handleError}>mark error</button>
    </div>
  );
}

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
  expect(url.searchParams.get('theme')).not.toBeNull();
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
  expect(url.searchParams.get('theme')).not.toBeNull();
});

test('tracks iframe load and error state without resetting readiness when the shared layout changes', () => {
  const { rerender } = render(<HookHarness layoutMode="drawer" />);
  const initialUrl = screen.getByTestId('chat-url').textContent ?? '';

  act(() => {
    screen.getByRole('button', { name: 'mark ready' }).click();
  });

  expect(screen.getByTestId('status')).toHaveTextContent('ready');
  expect(screen.getByTestId('error')).toBeEmptyDOMElement();

  rerender(<HookHarness layoutMode="page" />);

  expect(screen.getByTestId('chat-url')).toHaveTextContent(initialUrl);
  expect(screen.getByTestId('status')).toHaveTextContent('ready');
  expect(screen.getByTestId('error')).toBeEmptyDOMElement();

  act(() => {
    screen.getByRole('button', { name: 'mark error' }).click();
  });

  expect(screen.getByTestId('status')).toHaveTextContent('waiting');
  expect(screen.getByTestId('error')).toHaveTextContent('Unable to load Symphony chat.');
});
