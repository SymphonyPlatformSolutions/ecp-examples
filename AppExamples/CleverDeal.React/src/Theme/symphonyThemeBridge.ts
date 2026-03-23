export interface SymphonyThemePayload {
  mode: string;
  theme: Record<string, unknown>;
}

const WEALTH_DEBUG_STORAGE_KEY = 'wealthDebugTheme';

type SymphonyWindow = Window & {
  symphony?: {
    updateSettings?: (settings: Record<string, unknown>) => void;
    updateTheme?: (theme: Record<string, unknown>) => void;
  };
};

function isWealthThemeDebugEnabled() {
  try {
    const query = new URLSearchParams(window.location.search);
    return query.get(WEALTH_DEBUG_STORAGE_KEY) === '1' || window.localStorage.getItem(WEALTH_DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function debugWealthTheme(message: string, context?: Record<string, unknown>) {
  if (!isWealthThemeDebugEnabled()) {
    return;
  }

  if (context) {
    console.debug(`[WealthTheme] ${message}`, context);
    return;
  }

  console.debug(`[WealthTheme] ${message}`);
}

class SymphonyThemeBridge {
  private activeOwnerId: string | null = null;
  private globalTheme: SymphonyThemePayload | null = null;
  private ownerThemes = new Map<string, SymphonyThemePayload>();

  private applyToWindow(payload: SymphonyThemePayload) {
    const symphony = (window as SymphonyWindow).symphony;
    if (!symphony) {
      debugWealthTheme('Skipped theme apply because window.symphony is unavailable.', {
        activeOwnerId: this.activeOwnerId,
        payload,
      });
      return;
    }

    debugWealthTheme('Applying theme to Symphony window.', {
      activeOwnerId: this.activeOwnerId,
      mode: payload.mode,
      theme: payload.theme,
      hasUpdateSettings: typeof symphony.updateSettings === 'function',
      hasUpdateTheme: typeof symphony.updateTheme === 'function',
    });

    symphony.updateSettings?.({ mode: payload.mode, theme: { ...payload.theme } });
    symphony.updateTheme?.({ ...payload.theme });
  }

  applyGlobalTheme(payload: SymphonyThemePayload) {
    this.globalTheme = payload;
    debugWealthTheme('Registered global theme payload.', {
      activeOwnerId: this.activeOwnerId,
      payload,
    });
    if (!this.activeOwnerId) {
      this.applyToWindow(payload);
    }
  }

  acquireOwnership(ownerId: string) {
    this.activeOwnerId = ownerId;
    debugWealthTheme('Acquired theme ownership.', {
      ownerId,
      hasOwnerTheme: this.ownerThemes.has(ownerId),
    });
    const ownerTheme = this.ownerThemes.get(ownerId);
    if (ownerTheme) {
      this.applyToWindow(ownerTheme);
    }

    return () => {
      this.releaseOwnership(ownerId);
    };
  }

  releaseOwnership(ownerId: string) {
    this.ownerThemes.delete(ownerId);
    if (this.activeOwnerId !== ownerId) {
      debugWealthTheme('Ignored ownership release for inactive owner.', {
        ownerId,
        activeOwnerId: this.activeOwnerId,
      });
      return;
    }

    debugWealthTheme('Released theme ownership.', {
      ownerId,
      hasGlobalTheme: Boolean(this.globalTheme),
    });
    this.activeOwnerId = null;
    if (this.globalTheme) {
      this.applyToWindow(this.globalTheme);
    }
  }

  applyOwnedTheme(ownerId: string, payload: SymphonyThemePayload) {
    this.ownerThemes.set(ownerId, payload);
    debugWealthTheme('Registered owner theme payload.', {
      ownerId,
      isActiveOwner: this.activeOwnerId === ownerId,
      payload,
    });
    if (this.activeOwnerId === ownerId) {
      this.applyToWindow(payload);
    }
  }

  reset() {
    this.activeOwnerId = null;
    this.globalTheme = null;
    this.ownerThemes.clear();
  }
}

export const symphonyThemeBridge = new SymphonyThemeBridge();
