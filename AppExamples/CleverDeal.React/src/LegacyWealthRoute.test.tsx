import { render, screen, waitFor } from '@testing-library/react';
import { LegacyWealthRoute } from './LegacyWealthRoute';

const mockReset = jest.fn();
const mockLegacyWealthRender = jest.fn(() => <div>Legacy Wealth Route</div>);

jest.mock('./Components/WealthManagement/chat/symphonySdk', () => ({
  symphonySdk: {
    reset: () => mockReset(),
  },
}));

jest.mock('./Components/CleverWealth', () => ({
  __esModule: true,
  default: () => mockLegacyWealthRender(),
}));

describe('LegacyWealthRoute handoff', () => {
  beforeEach(() => {
    mockReset.mockReset();
    mockReset.mockImplementation(() => {
      document.getElementById('symphony-ecm-sdk')?.remove();
    });
    mockLegacyWealthRender.mockClear();
    (window as Window & { symphony?: unknown; renderRoom?: unknown; renderEcp?: unknown }).symphony = { ready: true };
    (window as Window & { renderRoom?: unknown }).renderRoom = jest.fn();
    (window as Window & { renderEcp?: unknown }).renderEcp = jest.fn();

    const script = document.createElement('script');
    script.id = 'symphony-ecm-sdk';
    document.body.appendChild(script);
  });

  afterEach(() => {
    delete (window as Window & { symphony?: unknown }).symphony;
    delete (window as Window & { renderRoom?: unknown }).renderRoom;
    delete (window as Window & { renderEcp?: unknown }).renderEcp;
    document.body.innerHTML = '';
  });

  test('resets the shared sdk state before rendering the legacy wealth app', async () => {
    mockLegacyWealthRender.mockImplementation(() => {
      expect((window as Window & { symphony?: unknown }).symphony).toBeUndefined();
      expect((window as Window & { renderRoom?: unknown }).renderRoom).toBeUndefined();
      expect((window as Window & { renderEcp?: unknown }).renderEcp).toBeUndefined();
      expect(document.getElementById('symphony-ecm-sdk')).toBeNull();
      return <div>Legacy Wealth Route</div>;
    });

    render(<LegacyWealthRoute />);

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(mockLegacyWealthRender).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Legacy Wealth Route')).toBeInTheDocument();
  });
});