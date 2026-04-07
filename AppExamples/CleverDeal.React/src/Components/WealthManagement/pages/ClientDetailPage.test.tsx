import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeContext, type ThemeState } from '../../../Theme/ThemeProvider';
import { wealthManagementData } from '../data/wealthManagement';
import ClientDetailPage from './ClientDetailPage';

const mockSendMessageToChat = jest.fn();
const mockUseClientChatSdkController = jest.fn();
const mockFetch = jest.fn();
const originalFetch = global.fetch;

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

jest.mock('../chat/useClientChatSdkController', () => ({
  useClientChatSdkController: (options: Record<string, unknown>) => mockUseClientChatSdkController(options),
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

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, reject, resolve };
}

function renderClientDetail() {
  return render(
    <ThemeContext.Provider value={themeValue}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={['/wealth-management/clients/1']}
      >
        <Routes>
          <Route path="/wealth-management/clients/:id" element={<ClientDetailPage />} />
          <Route path="/wealth-management/clients" element={<div>Clients</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeContext.Provider>,
  );
}

beforeEach(() => {
  mockSendMessageToChat.mockReset();
  mockUseClientChatSdkController.mockReset();
  mockFetch.mockReset();
  mockUseClientChatSdkController.mockImplementation(() => ({
    chatError: null,
    isChatReady: true,
    isLoading: false,
    sendMessageToChat: (message: Record<string, unknown>) => mockSendMessageToChat(message),
    streamId: 'stream-1',
    slotClassName: 'wealth-symphony-client-contact',
  }));
  global.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(new Blob(['sample-pdf'], { type: 'application/pdf' })),
  });
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  if (originalFetch) {
    global.fetch = originalFetch;
  } else {
    delete (global as typeof globalThis & { fetch?: typeof fetch }).fetch;
  }
  jest.restoreAllMocks();
});

test('renders the dedicated Symphony client slot and keeps sharing in progress until the SDK send resolves', async () => {
  const deferred = createDeferred<void>();
  mockSendMessageToChat.mockReturnValueOnce(deferred.promise);
  const sharedDocument = wealthManagementData.contacts?.find((contact) => contact.id === '1')?.documents[0];

  expect(sharedDocument).toBeDefined();

  renderClientDetail();

  expect(await screen.findByRole('heading', { name: 'Evelyn Reed' })).toBeInTheDocument();
  expect(screen.getByTestId('wealth-client-chat-slot')).toHaveClass('wealth-symphony-client-contact');

  const shareButton = screen.getByRole('button', { name: 'Share Q1 Allocation Memo.pdf to chat' });
  await userEvent.click(shareButton);

  expect(screen.getByRole('button', { name: 'Share Q1 Allocation Memo.pdf to chat' })).toHaveTextContent('Sharing...');
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith(sharedDocument?.assetUrl);
    expect(mockSendMessageToChat).toHaveBeenCalledWith({
      text: {
        'text/markdown': 'Shared *Q1 Allocation Memo.pdf* with Evelyn Reed.\n\nType: Investment Memo\nUpdated: Mar 11',
      },
      entities: {
        report: {
          type: 'fdc3.fileAttachment',
          data: {
            name: 'Q1 Allocation Memo.pdf',
            dataUri: 'data:application/pdf;base64,c2FtcGxlLXBkZg==',
          },
        },
      },
    });
  });

  deferred.resolve();

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Share Q1 Allocation Memo.pdf to chat' })).toHaveTextContent('Share');
  });
});

test('shows the SDK send failure and re-enables the document action', async () => {
  mockSendMessageToChat.mockRejectedValueOnce(new Error('Host rejected upload'));

  renderClientDetail();

  expect(await screen.findByRole('heading', { name: 'Evelyn Reed' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Share Q1 Allocation Memo.pdf to chat' }));

  await waitFor(() => {
    expect(screen.getByText('Host rejected upload')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share Q1 Allocation Memo.pdf to chat' })).toHaveTextContent('Share');
  });
});
