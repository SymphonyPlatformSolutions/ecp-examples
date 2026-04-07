import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeContext, type ThemeState } from '../../Theme/ThemeProvider';
import { App } from './App';

const mockShellRender = jest.fn();

jest.mock('../Loading', () => ({
  __esModule: true,
  default: ({ className }: { className?: string }) => <div data-testid={className ?? 'loading'}>Loading</div>,
}));

jest.mock('../LandingPage', () => ({
  __esModule: true,
  default: () => <div>Landing Page</div>,
}));

jest.mock('../HelpButton', () => ({
  __esModule: true,
  default: () => <div>Help Button</div>,
}));

jest.mock('../ThemePicker', () => ({
  __esModule: true,
  default: () => <div>Theme Picker</div>,
}));

jest.mock('../PodPicker', () => ({
  __esModule: true,
  default: () => <div>Pod Picker</div>,
}));

jest.mock('../CleverInvestments', () => ({
  __esModule: true,
  default: () => <div>Investments Route</div>,
}));

jest.mock('../CleverOperations', () => ({
  __esModule: true,
  default: () => <div>Operations Route</div>,
}));

jest.mock('../CleverResearch', () => ({
  __esModule: true,
  default: () => <div>Research Route</div>,
}));

jest.mock('../CleverWealth', () => ({
  __esModule: true,
  default: () => <div>Legacy Wealth Route</div>,
}));

jest.mock('../ContentDistribution', () => ({
  __esModule: true,
  default: () => <div>Content Route</div>,
}));

jest.mock('../WealthManagement/WealthManagementRoute', () => {
  const { useNavigate } = require('react-router-dom');

  return {
    __esModule: true,
    default: () => {
      const navigate = useNavigate();

      return (
        <div>
          <div>Wealth Management Route</div>
          <button type="button" onClick={() => navigate('/investments')}>
            Go To Investments
          </button>
        </div>
      );
    },
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

function renderApp(path: string) {
  return render(
    <ThemeContext.Provider value={themeValue}>
      <MemoryRouter
        initialEntries={[path]}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </MemoryRouter>
    </ThemeContext.Provider>,
  );
}

async function bootstrapShell() {
  await waitFor(() => {
    expect((window as Window & { renderRoom?: () => void }).renderRoom).toBeDefined();
  });

  (window as Window & { symphony?: { render: typeof mockShellRender } }).symphony = {
    render: mockShellRender,
  };

  await act(async () => {
    (window as Window & { renderRoom?: () => void }).renderRoom?.();
    await Promise.resolve();
  });
}

beforeEach(() => {
  mockShellRender.mockReset();
  mockShellRender.mockResolvedValue(undefined);
  document.body.innerHTML = '<div id="symphony-ecm"></div>';
  delete (window as Window & { symphony?: unknown }).symphony;
  delete (window as Window & { renderRoom?: unknown }).renderRoom;
});

afterEach(() => {
  document.body.innerHTML = '';
  delete (window as Window & { symphony?: unknown }).symphony;
  delete (window as Window & { renderRoom?: unknown }).renderRoom;
});

test('routes Wealth through App and hides the App header on Wealth routes', async () => {
  renderApp('/wealth-management/clients');

  await bootstrapShell();

  expect(await screen.findByText('Wealth Management Route')).toBeInTheDocument();
  expect(screen.queryByText(/Clever Deal 2.0/i)).not.toBeInTheDocument();
  expect(mockShellRender).toHaveBeenCalledWith('symphony-ecm', expect.objectContaining({
    showTitle: false,
    ecpLoginPopup: true,
    canAddPeople: true,
    sound: false,
  }));
});

test('keeps the App shell alive when navigating from Wealth to Investments', async () => {
  renderApp('/wealth-management');

  await bootstrapShell();

  expect(await screen.findByText('Wealth Management Route')).toBeInTheDocument();
  expect(screen.queryByText(/Clever Deal 2.0/i)).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Go To Investments' }));

  expect(await screen.findByText('Investments Route')).toBeInTheDocument();
  expect(screen.getByText(/Clever Deal 2.0: Investments/i)).toBeInTheDocument();
  expect(mockShellRender).toHaveBeenCalledTimes(1);
});