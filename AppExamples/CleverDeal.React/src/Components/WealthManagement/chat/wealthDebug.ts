export const WEALTH_DEBUG_STORAGE_KEY = 'wealthDebugTheme';

export function isWealthDebugFlagEnabled() {
  try {
    const query = new URLSearchParams(window.location.search);
    return query.get(WEALTH_DEBUG_STORAGE_KEY) === '1' || window.localStorage.getItem(WEALTH_DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function shouldLogWealthDebug() {
  return process.env.NODE_ENV !== 'production' || isWealthDebugFlagEnabled();
}

export function debugWealth(scope: string, message: string, context?: Record<string, unknown>) {
  if (!shouldLogWealthDebug()) {
    return;
  }

  if (context) {
    console.debug(`[${scope}] ${message}`, context);
    return;
  }

  console.debug(`[${scope}] ${message}`);
}