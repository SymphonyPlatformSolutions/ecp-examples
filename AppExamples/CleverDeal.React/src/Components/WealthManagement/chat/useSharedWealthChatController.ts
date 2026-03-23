import { useEffect, useRef, useState } from 'react';
import { symphonyNotifications } from './symphonyNotifications';
import { symphonySdk } from './symphonySdk';
import {
  applyWealthSymphonyTheme,
  applyWealthSymphonyThemeWithSettle,
  getWealthSymphonyRenderOptions,
  WEALTH_SHARED_CHAT_SELECTOR,
} from './wealthSymphonyTheme';

const WEALTH_DEBUG_STORAGE_KEY = 'wealthDebugTheme';

function isWealthThemeDebugEnabled() {
  try {
    const query = new URLSearchParams(window.location.search);
    return query.get(WEALTH_DEBUG_STORAGE_KEY) === '1' || window.localStorage.getItem(WEALTH_DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function debugWealthChat(message: string, context?: Record<string, unknown>) {
  if (!isWealthThemeDebugEnabled()) {
    return;
  }

  if (context) {
    console.debug(`[WealthChat] ${message}`, context);
    return;
  }

  console.debug(`[WealthChat] ${message}`);
}

const BOOTSTRAP_RETRY_DELAYS_MS = [1000, 2000, 4000];
const STREAM_RETRY_DELAYS_MS = [500, 1000];

function getNow() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
}

function getElapsedMs(startedAt: number) {
  return Math.round(getNow() - startedAt);
}

function toError(cause: unknown, fallbackMessage: string) {
  return cause instanceof Error ? cause : new Error(fallbackMessage);
}

function getRetryDelayMs(delays: number[], attempt: number) {
  return attempt < delays.length ? delays[attempt] : null;
}

function isRetryableSymphonyError(error: Error) {
  const normalizedMessage = error.message.toLowerCase();
  return !/(401|403|auth|unauthor|forbidden|permission)/.test(normalizedMessage);
}

function applySharedThemeSafely(context: Record<string, unknown>) {
  try {
    applyWealthSymphonyTheme();
  } catch (cause) {
    debugWealthChat('Applying the shared Symphony theme failed.', {
      ...context,
      error: cause instanceof Error ? cause.message : cause,
    });
  }
}

async function applySharedThemeWithSettleSafely(context: Record<string, unknown>) {
  try {
    await applyWealthSymphonyThemeWithSettle();
  } catch (cause) {
    debugWealthChat('Reapplying the shared Symphony theme after a stream switch failed.', {
      ...context,
      error: cause instanceof Error ? cause.message : cause,
    });
  }
}

interface UseSharedWealthChatControllerOptions {
  ecpOrigin: string;
  partnerId?: string;
  requestedStreamId?: string;
}

export function useSharedWealthChatController({
  ecpOrigin,
  partnerId,
  requestedStreamId,
}: UseSharedWealthChatControllerOptions) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSwitchingStream, setIsSwitchingStream] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<Error | null>(null);
  const [streamError, setStreamError] = useState<Error | null>(null);
  const renderedSharedStreamIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let retryTimerId: number | null = null;

    renderedSharedStreamIdRef.current = undefined;
    setIsBootstrapping(true);
    setBootstrapError(null);
    setStreamError(null);

    const bootstrap = async (attempt: number) => {
      const startedAt = getNow();

      try {
        debugWealthChat('Bootstrapping shared Symphony chat.', {
          attempt: attempt + 1,
          ecpOrigin,
          partnerId,
        });
        await symphonySdk.init(ecpOrigin, partnerId);
        await symphonySdk.renderChat(
          WEALTH_SHARED_CHAT_SELECTOR,
          getWealthSymphonyRenderOptions(),
        );
        if (cancelled) {
          return;
        }

        renderedSharedStreamIdRef.current = undefined;
        applySharedThemeSafely({
          attempt: attempt + 1,
          ecpOrigin,
          phase: 'bootstrap',
        });
        symphonyNotifications.init(ecpOrigin);
        debugWealthChat('Shared Symphony chat bootstrapped.', {
          attempt: attempt + 1,
          ecpOrigin,
          elapsedMs: getElapsedMs(startedAt),
          renderedStreamId: renderedSharedStreamIdRef.current,
        });
        setBootstrapError(null);
        setStreamError(null);
        setIsBootstrapping(false);
      } catch (cause) {
        if (cancelled) {
          return;
        }

        const error = toError(cause, 'Unable to initialize Symphony chat.');
        const retryDelayMs = isRetryableSymphonyError(error)
          ? getRetryDelayMs(BOOTSTRAP_RETRY_DELAYS_MS, attempt)
          : null;

        debugWealthChat('Shared Symphony chat bootstrap failed.', {
          attempt: attempt + 1,
          ecpOrigin,
          elapsedMs: getElapsedMs(startedAt),
          error: error.message,
          retryDelayMs,
        });

        if (retryDelayMs !== null) {
          symphonySdk.resetIfError();
          retryTimerId = window.setTimeout(() => {
            if (!cancelled) {
              void bootstrap(attempt + 1);
            }
          }, retryDelayMs);
          return;
        }

        setBootstrapError(error);
        setIsBootstrapping(false);
      }
    };

    void bootstrap(0);

    return () => {
      cancelled = true;
      if (retryTimerId !== null) {
        window.clearTimeout(retryTimerId);
      }
    };
  }, [ecpOrigin, partnerId]);

  useEffect(() => {
    if (isBootstrapping || bootstrapError || !requestedStreamId) {
      if (!requestedStreamId) {
        setStreamError(null);
      }
      return;
    }

    if (renderedSharedStreamIdRef.current === requestedStreamId) {
      debugWealthChat('Skipped shared stream switch because requested stream is already active.', {
        requestedStreamId,
      });
      return;
    }

    let cancelled = false;
    let retryTimerId: number | null = null;
    setIsSwitchingStream(true);
    setStreamError(null);

    const openRequestedStream = async (attempt: number) => {
      const startedAt = getNow();

      try {
        await Promise.resolve(
          symphonySdk.openStream(
            requestedStreamId,
            WEALTH_SHARED_CHAT_SELECTOR,
            getWealthSymphonyRenderOptions(),
          ),
        );

        if (cancelled) {
          return;
        }

        debugWealthChat('Shared Symphony stream opened, waiting to reapply theme.', {
          attempt: attempt + 1,
          previousStreamId: renderedSharedStreamIdRef.current,
          requestedStreamId,
          elapsedMs: getElapsedMs(startedAt),
        });
        renderedSharedStreamIdRef.current = requestedStreamId;
        await applySharedThemeWithSettleSafely({
          attempt: attempt + 1,
          requestedStreamId,
          phase: 'stream-switch',
        });

        if (cancelled) {
          return;
        }

        debugWealthChat('Shared Symphony theme reapplied after stream switch settled.', {
          attempt: attempt + 1,
          requestedStreamId,
        });
        setStreamError(null);
        setIsSwitchingStream(false);
      } catch (cause) {
        if (cancelled) {
          return;
        }

        const error = toError(cause, 'Unable to open Symphony stream.');
        const retryDelayMs = isRetryableSymphonyError(error)
          ? getRetryDelayMs(STREAM_RETRY_DELAYS_MS, attempt)
          : null;

        debugWealthChat('Shared Symphony stream switch failed.', {
          attempt: attempt + 1,
          requestedStreamId,
          elapsedMs: getElapsedMs(startedAt),
          error: error.message,
          retryDelayMs,
        });

        if (retryDelayMs !== null) {
          symphonySdk.resetIfError();
          retryTimerId = window.setTimeout(() => {
            if (!cancelled) {
              void openRequestedStream(attempt + 1);
            }
          }, retryDelayMs);
          return;
        }

        setStreamError(error);
        setIsSwitchingStream(false);
      }
    };

    void openRequestedStream(0);

    return () => {
      cancelled = true;
      if (retryTimerId !== null) {
        window.clearTimeout(retryTimerId);
      }
    };
  }, [bootstrapError, isBootstrapping, requestedStreamId]);

  return {
    bootstrapError,
    streamError,
    isBootstrapping,
    isReady: !isBootstrapping && !bootstrapError,
    isSwitchingStream,
    slotClassName: WEALTH_SHARED_CHAT_SELECTOR.slice(1),
  };
}
