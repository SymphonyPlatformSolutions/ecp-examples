import { symphonyThemeBridge } from './symphonyThemeBridge';

describe('symphonyThemeBridge', () => {
  const updateSettings = jest.fn();
  const updateTheme = jest.fn();

  beforeEach(() => {
    updateSettings.mockClear();
    updateTheme.mockClear();
    symphonyThemeBridge.reset();
    (window as Window & { symphony?: unknown }).symphony = {
      updateSettings,
      updateTheme,
    } as any;
  });

  afterEach(() => {
    symphonyThemeBridge.reset();
    delete (window as Window & { symphony?: unknown }).symphony;
  });

  test('keeps the owner theme active while a route-scoped owner is mounted and restores the global theme on release', () => {
    symphonyThemeBridge.applyGlobalTheme({
      mode: 'light',
      theme: { primary: '#0476D6' },
    });

    const releaseOwner = symphonyThemeBridge.acquireOwnership('wealth-management');
    symphonyThemeBridge.applyOwnedTheme('wealth-management', {
      mode: 'light',
      theme: { primary: '#55b7ff' },
    });

    symphonyThemeBridge.applyGlobalTheme({
      mode: 'dark',
      theme: { primary: '#123b7a' },
    });

    expect(updateSettings).toHaveBeenLastCalledWith({ mode: 'light', theme: { primary: '#55b7ff' } });
    expect(updateTheme).toHaveBeenLastCalledWith({ primary: '#55b7ff' });

    releaseOwner();

    expect(updateSettings).toHaveBeenLastCalledWith({ mode: 'dark', theme: { primary: '#123b7a' } });
    expect(updateTheme).toHaveBeenLastCalledWith({ primary: '#123b7a' });
  });
});
