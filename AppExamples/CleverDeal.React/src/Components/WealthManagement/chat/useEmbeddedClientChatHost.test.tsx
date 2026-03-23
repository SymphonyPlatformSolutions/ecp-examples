import { act, render, screen, waitFor } from '@testing-library/react';
import { useEmbeddedClientChatHost } from './useEmbeddedClientChatHost';

const mockMarkMessagesViewed = jest.fn();
const mockOnHostMessage = jest.fn();

jest.mock('./symphonyNotifications', () => ({
  symphonyNotifications: {
    markMessagesViewed: (streamId?: string) => mockMarkMessagesViewed(streamId),
  },
}));

function HookHarness({
  contactId,
  ecpOrigin,
  partnerId,
}: {
  contactId?: string | null;
  ecpOrigin?: string;
  partnerId?: string;
}) {
  const state = useEmbeddedClientChatHost({
    contactId,
    ecpOrigin,
    partnerId,
    onHostMessage: mockOnHostMessage,
  });

  return (
    <div>
      <div data-testid="chat-ready">{state.isChatReady ? 'ready' : 'waiting'}</div>
      <div data-testid="chat-error">{state.chatError ?? ''}</div>
      <div data-testid="stream-id">{state.streamId ?? ''}</div>
      <div data-testid="contact-name">{state.contact?.name ?? ''}</div>
      <div data-testid="chat-host-url">{state.chatHostUrl}</div>
    </div>
  );
}

async function dispatchHostMessage(data: Record<string, unknown>, origin = window.location.origin) {
  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin,
        data,
      }),
    );
  });
}

beforeEach(() => {
  mockMarkMessagesViewed.mockClear();
  mockOnHostMessage.mockClear();
});

test('builds the client chat host url from the selected contact and theme payload', () => {
  render(<HookHarness contactId="1" partnerId="partner-123" />);

  const url = new URL(screen.getByTestId('chat-host-url').textContent ?? '');

  expect(screen.getByTestId('contact-name')).toHaveTextContent('Evelyn Reed');
  expect(url.pathname).toBe('/wealth-client-chat-host.html');
  expect(url.searchParams.get('ecpOrigin')).toBe('corporate.symphony.com');
  expect(url.searchParams.get('partnerId')).toBe('partner-123');
  expect(url.searchParams.get('streamId')).toBe(screen.getByTestId('stream-id').textContent);
  expect(url.searchParams.get('mode')).toBe('light');
  expect(url.searchParams.get('theme')).toContain('55b7ff');
});

test('marks the chat ready only for a matching host ready message and clears unread state for that stream', async () => {
  render(<HookHarness contactId="1" />);
  const streamId = screen.getByTestId('stream-id').textContent ?? '';

  await dispatchHostMessage({
    source: 'wealth-client-chat-host',
    type: 'ready',
    payload: { streamId: 'different-stream' },
  });

  expect(screen.getByTestId('chat-ready')).toHaveTextContent('waiting');

  await dispatchHostMessage({
    source: 'wealth-client-chat-host',
    type: 'ready',
    payload: { streamId },
  });

  await waitFor(() => {
    expect(screen.getByTestId('chat-ready')).toHaveTextContent('ready');
  });

  expect(mockMarkMessagesViewed).toHaveBeenCalledWith(streamId);
  expect(mockOnHostMessage).toHaveBeenCalledTimes(2);
});

test('ignores host messages from another origin or another message source', async () => {
  render(<HookHarness contactId="1" />);

  await dispatchHostMessage({
    source: 'wealth-client-chat-host',
    type: 'error',
    payload: { message: 'Wrong origin' },
  }, 'https://example.com');

  await dispatchHostMessage({
    source: 'other-host',
    type: 'error',
    payload: { message: 'Wrong source' },
  });

  expect(screen.getByTestId('chat-error')).toHaveTextContent('');
  expect(mockOnHostMessage).not.toHaveBeenCalled();
});

test('ignores a stale error from a previous stream after the contact changes', async () => {
  const { rerender } = render(<HookHarness contactId="1" />);
  const firstStreamId = screen.getByTestId('stream-id').textContent ?? '';

  await dispatchHostMessage({
    source: 'wealth-client-chat-host',
    type: 'ready',
    payload: { streamId: firstStreamId },
  });

  await waitFor(() => {
    expect(screen.getByTestId('chat-ready')).toHaveTextContent('ready');
  });

  rerender(<HookHarness contactId="2" />);

  expect(screen.getByTestId('chat-ready')).toHaveTextContent('waiting');

  await dispatchHostMessage({
    source: 'wealth-client-chat-host',
    type: 'error',
    payload: { streamId: firstStreamId, message: 'Stale iframe error' },
  });

  expect(screen.getByTestId('chat-error')).toBeEmptyDOMElement();
});