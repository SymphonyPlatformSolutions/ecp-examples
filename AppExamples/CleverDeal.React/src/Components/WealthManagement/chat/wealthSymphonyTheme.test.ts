import {
  acquireWealthSymphonyThemeOwnership,
  getWealthSymphonyRenderOptions,
  getWealthSymphonyThemeUrlParams,
  refreshWealthSymphonyThemeAfterLayoutChange,
  WEALTH_SYMPHONY_THEME,
} from './wealthSymphonyTheme';

describe('WEALTH_SYMPHONY_THEME', () => {
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalCancelAnimationFrame = window.cancelAnimationFrame;

  beforeEach(() => {
    window.requestAnimationFrame = ((callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(Date.now()), 0)) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = ((handle: number) => window.clearTimeout(handle)) as typeof window.cancelAnimationFrame;
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    delete (window as Window & { symphony?: unknown }).symphony;
  });

  test('keeps the primary Symphony text tokens dark for list readability', () => {
    expect(WEALTH_SYMPHONY_THEME.text).toBe('#111827');
    expect(WEALTH_SYMPHONY_THEME.textSecondary).toBe('#111827');
    expect(WEALTH_SYMPHONY_THEME.textPrimary).toBe('#111827');
    expect(WEALTH_SYMPHONY_THEME.textAccent).toBe('#111827');
  });

  test('preserves white only for tokens that sit on filled status surfaces', () => {
    expect(WEALTH_SYMPHONY_THEME.textSuccess).toBe('#ffffff');
    expect(WEALTH_SYMPHONY_THEME.textError).toBe('#ffffff');
  });

  test('uses red for unread attention styling while keeping a blue accent available', () => {
    expect(WEALTH_SYMPHONY_THEME.primary).toBe('#55b7ff');
    expect(WEALTH_SYMPHONY_THEME.secondary).toBe('#55b7ff');
    expect(WEALTH_SYMPHONY_THEME.accent).toBe('#dc2626');
    expect(WEALTH_SYMPHONY_THEME.error).toBe('#dc2626');
  });

  test('uses a stronger wealth-blue mention highlight while keeping pale-blue secondary shades', () => {
    expect(WEALTH_SYMPHONY_THEME.mention).toBe('#8dcbff');
    expect(WEALTH_SYMPHONY_THEME.secondaryShades[10]).toBe('#e8f3ff');
    expect(WEALTH_SYMPHONY_THEME.secondaryShades[20]).toBe('#d6ebff');
    expect(WEALTH_SYMPHONY_THEME.secondaryShades[90]).toBe('#0d5d96');
  });

  test('injects the wealth collaboration theme directly into render options', () => {
    expect(getWealthSymphonyRenderOptions()).toEqual(
      expect.objectContaining({
        mode: 'light',
        theme: WEALTH_SYMPHONY_THEME,
        showTitle: false,
        condensed: true,
      }),
    );
  });

  test('serializes the shared wealth theme for focused-mode URL rendering', () => {
    expect(getWealthSymphonyThemeUrlParams()).toEqual({
      mode: 'light',
      theme: JSON.stringify(WEALTH_SYMPHONY_THEME),
    });
  });

  test('refreshes the Wealth theme after a layout change by waiting for Symphony to settle and reapplying the owned theme', async () => {
    const updateSettings = jest.fn();
    const updateTheme = jest.fn();
    const releaseOwnership = acquireWealthSymphonyThemeOwnership();

    (window as Window & { symphony?: unknown }).symphony = {
      updateSettings,
      updateTheme,
    } as any;

    await refreshWealthSymphonyThemeAfterLayoutChange();

    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ mode: 'light', theme: expect.objectContaining({ primary: '#55b7ff' }) }));
    expect(updateTheme).toHaveBeenCalledWith(expect.objectContaining({ primary: '#55b7ff' }));
    expect(updateSettings.mock.calls.length).toBeGreaterThanOrEqual(2);

    releaseOwnership();
  });
});
