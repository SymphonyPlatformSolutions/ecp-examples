import { symphonyThemeBridge } from '../../../Theme/symphonyThemeBridge';

const WEALTH_ALLOWED_APPS =
  'com.symphony.zoom,com.symphony.teams,salesforce2-app,com.symphony.sfs.admin-app';

export const WEALTH_SHARED_CHAT_SELECTOR = '.wealth-symphony-shared';
export const WEALTH_CLIENT_CHAT_SELECTOR = '.wealth-symphony-client-contact';
export const WEALTH_SYMPHONY_THEME_OWNER = 'wealth-management';
export const WEALTH_SYMPHONY_MODE = 'light';

export const WEALTH_SYMPHONY_THEME = {
  primary: '#55b7ff',
  secondary: '#55b7ff',
  accent: '#dc2626',
  success: '#0f3d83',
  error: '#dc2626',
  background: '#ffffff',
  surface: '#ffffff',
  mention: '#8dcbff',
  text: '#111827',
  textPrimary: '#111827',
  textSecondary: '#111827',
  textAccent: '#111827',
  textSuccess: '#ffffff',
  textError: '#ffffff',
  secondaryShades: {
    10: '#e8f3ff',
    20: '#d6ebff',
    30: '#b6ddff',
    40: '#8dcbff',
    60: '#3eaefc',
    70: '#2498f0',
    80: '#147dcb',
    90: '#0d5d96',
  },
  accentShades: {
    10: '#fff0f0',
    20: '#ffdada',
    30: '#ffbaba',
    40: '#ff9696',
    60: '#ef4444',
    70: '#dc2626',
    80: '#b91c1c',
    90: '#991b1b',
  },
  errorShades: {
    10: '#fff0f0',
    20: '#ffdada',
    30: '#ffbaba',
    40: '#ff9696',
    60: '#ef4444',
    70: '#dc2626',
    80: '#b91c1c',
    90: '#991b1b',
  },
} as const;

export function getWealthSymphonyThemePayload() {
  return {
    mode: WEALTH_SYMPHONY_MODE,
    theme: WEALTH_SYMPHONY_THEME,
  };
}

export function getWealthSymphonyThemeUrlParams() {
  const payload = getWealthSymphonyThemePayload();
  return {
    mode: payload.mode,
    theme: JSON.stringify(payload.theme),
  };
}

export function getWealthSymphonyRenderOptions(overrides: Record<string, unknown> = {}) {
  const payload = getWealthSymphonyThemePayload();
  return {
    showTitle: false,
    ecpLoginPopup: true,
    canAddPeople: true,
    condensed: true,
    allowedApps: WEALTH_ALLOWED_APPS,
    sound: false,
    ...payload,
    ...overrides,
  };
}

export function acquireWealthSymphonyThemeOwnership() {
  return symphonyThemeBridge.acquireOwnership(WEALTH_SYMPHONY_THEME_OWNER);
}

export function applyWealthSymphonyTheme() {
  const payload = getWealthSymphonyThemePayload();
  symphonyThemeBridge.applyOwnedTheme(WEALTH_SYMPHONY_THEME_OWNER, {
    mode: payload.mode,
    theme: { ...payload.theme },
  });
}

function waitForNextAnimationFrame() {
  return new Promise<void>((resolve) => {
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => resolve());
      return;
    }

    window.setTimeout(resolve, 0);
  });
}

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

const SYMPHONY_RESIZE_SETTLE_MS = 600;
const SYMPHONY_THEME_RECONFIRM_MS = 400;

const SYMPHONY_THEME_SETTLE_MS = 250;

export async function applyWealthSymphonyThemeWithSettle() {
  applyWealthSymphonyTheme();
  await delay(SYMPHONY_THEME_SETTLE_MS);
  applyWealthSymphonyTheme();
  await waitForNextAnimationFrame();
}

export async function refreshWealthSymphonyThemeAfterLayoutChange() {
  await waitForNextAnimationFrame();
  await delay(SYMPHONY_RESIZE_SETTLE_MS);
  applyWealthSymphonyTheme();
  await delay(SYMPHONY_THEME_RECONFIRM_MS);
  applyWealthSymphonyTheme();
  await waitForNextAnimationFrame();
}
