import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider';

const mockApplyGlobalTheme = jest.fn();

jest.mock('./symphonyThemeBridge', () => ({
  symphonyThemeBridge: {
    applyGlobalTheme: (payload: Record<string, unknown>) => mockApplyGlobalTheme(payload),
  },
}));

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockApplyGlobalTheme.mockClear();
  });

  test('routes Symphony theme updates through the shared theme bridge', async () => {
    render(
      <ThemeProvider>
        <div>Theme Ready</div>
      </ThemeProvider>,
    );

    expect(await screen.findByText('Theme Ready')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockApplyGlobalTheme).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'light',
          theme: expect.objectContaining({
            primary: '#0476D6',
            secondary: '#F8C43F',
            error: '#C51162',
          }),
        }),
      );
    });
  });
});
