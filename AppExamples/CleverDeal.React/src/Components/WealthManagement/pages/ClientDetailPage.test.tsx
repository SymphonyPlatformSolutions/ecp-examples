import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeContext, type ThemeState } from '../../../Theme/ThemeProvider';
import ClientDetailPage from './ClientDetailPage';

const mockMarkMessagesViewed = jest.fn();

jest.mock('recharts', () => {
  const Wrapper = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const Leaf = () => null;
  return {
    ResponsiveContainer: Wrapper,
    PieChart: Wrapper,
    Pie: Wrapper,
    Cell: Leaf,
    Tooltip: Leaf,
  };
});

jest.mock('../chat/symphonyNotifications', () => ({
  symphonyNotifications: {
    markMessagesViewed: (streamId?: string) => mockMarkMessagesViewed(streamId),
  },
}));

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

function renderClientDetail() {
  return render(
    <ThemeContext.Provider value={themeValue}>
      <MemoryRouter initialEntries={['/wealth-management/clients/1']}>
        <Routes>
          <Route path="/wealth-management/clients/:id" element={<ClientDetailPage />} />
          <Route path="/wealth-management/clients" element={<div>Clients</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeContext.Provider>,
  );
}

function dispatchHostMessage(data: Record<string, unknown>, origin = window.location.origin) {
  window.dispatchEvent(
    new MessageEvent('message', {
      origin,
      data,
    }),
  );
}

beforeEach(() => {
  mockMarkMessagesViewed.mockClear();
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('keeps sharing in progress when a stale share error arrives and clears it when the active request succeeds', async () => {
  renderClientDetail();

  expect(await screen.findByRole('heading', { name: 'Evelyn Reed' })).toBeInTheDocument();

  const iframe = screen.getByTitle('Wealth client chat') as HTMLIFrameElement;
  const postMessage = jest.fn();
  Object.defineProperty(iframe, 'contentWindow', {
    configurable: true,
    value: { postMessage },
  });

  const streamId = new URL(iframe.src).searchParams.get('streamId');

  act(() => {
    dispatchHostMessage({
      source: 'wealth-client-chat-host',
      type: 'ready',
      payload: { streamId },
    });
  });

  const shareButton = screen.getByRole('button', { name: 'Share Q1 Allocation Memo.pdf to chat' });
  await userEvent.click(shareButton);

  expect(await screen.findByRole('button', { name: 'Share Q1 Allocation Memo.pdf to chat' })).toHaveTextContent('Sharing...');

  act(() => {
    dispatchHostMessage({
      source: 'wealth-client-chat-host',
      type: 'share-error',
      payload: {
        requestId: 'client-share-999',
        documentName: 'Q1 Allocation Memo.pdf',
        message: 'Ignore stale request',
        streamId,
      },
    });
  });

  expect(screen.getByRole('button', { name: 'Share Q1 Allocation Memo.pdf to chat' })).toHaveTextContent('Sharing...');
  expect(screen.queryByText('Ignore stale request')).not.toBeInTheDocument();

  act(() => {
    dispatchHostMessage({
      source: 'wealth-client-chat-host',
      type: 'share-success',
      payload: {
        requestId: 'client-share-1',
        documentName: 'Q1 Allocation Memo.pdf',
        streamId,
      },
    });
  });

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Share Q1 Allocation Memo.pdf to chat' })).toHaveTextContent('Share');
  });
});

test('shows the active share error and re-enables the document action when the host rejects the request', async () => {
  renderClientDetail();

  expect(await screen.findByRole('heading', { name: 'Evelyn Reed' })).toBeInTheDocument();

  const iframe = screen.getByTitle('Wealth client chat') as HTMLIFrameElement;
  Object.defineProperty(iframe, 'contentWindow', {
    configurable: true,
    value: { postMessage: jest.fn() },
  });

  const streamId = new URL(iframe.src).searchParams.get('streamId');

  act(() => {
    dispatchHostMessage({
      source: 'wealth-client-chat-host',
      type: 'ready',
      payload: { streamId },
    });
  });

  await userEvent.click(screen.getByRole('button', { name: 'Share Q1 Allocation Memo.pdf to chat' }));

  act(() => {
    dispatchHostMessage({
      source: 'wealth-client-chat-host',
      type: 'share-error',
      payload: {
        requestId: 'client-share-1',
        documentName: 'Q1 Allocation Memo.pdf',
        message: 'Host rejected upload',
        streamId,
      },
    });
  });

  await waitFor(() => {
    expect(screen.getByText('Host rejected upload')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share Q1 Allocation Memo.pdf to chat' })).toHaveTextContent('Share');
  });
});