export interface SymphonyThemePayload {
  mode: string;
  theme: Record<string, unknown>;
}

type SymphonyWindow = Window & {
  symphony?: {
    updateSettings?: (settings: Record<string, unknown>) => void;
    updateTheme?: (theme: Record<string, unknown>) => void;
  };
};

class SymphonyThemeBridge {
  private activeOwnerId: string | null = null;
  private globalTheme: SymphonyThemePayload | null = null;
  private ownerThemes = new Map<string, SymphonyThemePayload>();

  private applyToWindow(payload: SymphonyThemePayload) {
    const symphony = (window as SymphonyWindow).symphony;
    if (!symphony) {
      return;
    }

    symphony.updateSettings?.({ mode: payload.mode, theme: { ...payload.theme } });
    symphony.updateTheme?.({ ...payload.theme });
  }

  applyGlobalTheme(payload: SymphonyThemePayload) {
    this.globalTheme = payload;
    if (!this.activeOwnerId) {
      this.applyToWindow(payload);
    }
  }

  acquireOwnership(ownerId: string) {
    this.activeOwnerId = ownerId;
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
      return;
    }
    this.activeOwnerId = null;
    if (this.globalTheme) {
      this.applyToWindow(this.globalTheme);
    }
  }

  applyOwnedTheme(ownerId: string, payload: SymphonyThemePayload) {
    this.ownerThemes.set(ownerId, payload);
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
