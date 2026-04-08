import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { wealthManagementShellData, type ShellContact } from '../data/wealthManagementShell';
import { symphonyNotifications } from './symphonyNotifications';
import { symphonySdk } from './symphonySdk';
import {
  applyWealthSymphonyTheme,
  applyWealthSymphonyThemeWithSettle,
  getWealthSymphonyRenderOptions,
  WEALTH_CLIENT_CHAT_SELECTOR,
} from './wealthSymphonyTheme';
import { debugWealth, isWealthDebugFlagEnabled } from './wealthDebug';

const STREAM_RETRY_DELAYS_MS = [500, 1000];

function debugClientChat(message: string, context?: Record<string, unknown>) {
  if (!isWealthDebugFlagEnabled()) {
    return;
  }

  debugWealth('WealthClientChat', message, context);
}

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

function applyClientThemeSafely(context: Record<string, unknown>) {
  try {
    applyWealthSymphonyTheme();
  } catch (cause) {
    debugClientChat('Applying the client Symphony theme failed.', {
      ...context,
      error: cause instanceof Error ? cause.message : cause,
    });
  }
}

async function applyClientThemeWithSettleSafely(context: Record<string, unknown>) {
  try {
    await applyWealthSymphonyThemeWithSettle();
  } catch (cause) {
    debugClientChat('Reapplying the client Symphony theme after the stream load failed.', {
      ...context,
      error: cause instanceof Error ? cause.message : cause,
    });
  }
}

interface UseClientChatSdkControllerOptions {
  contactId?: string | null;
  containerSelector?: string;
  ecpOrigin?: string;
  enabled?: boolean;
  partnerId?: string;
  preload?: boolean;
}

export function useClientChatSdkController({
  contactId,
  containerSelector = WEALTH_CLIENT_CHAT_SELECTOR,
  ecpOrigin = 'corporate.symphony.com',
  enabled = true,
  partnerId,
  preload = false,
}: UseClientChatSdkControllerOptions) {
  const [isChatReady, setIsChatReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const preloadPromiseRef = useRef<Promise<void> | null>(null);

  const roomMap = wealthManagementShellData.wealthRoom as Record<string, string>;
  const contact = useMemo<ShellContact | undefined>(
    () => (wealthManagementShellData.contacts ?? []).find((item) => item.id === contactId),
    [contactId],
  );
  const defaultStreamId = roomMap[ecpOrigin] ?? roomMap['corporate.symphony.com'];
  const streamId = contactId ? contact?.streamId : defaultStreamId;

  useEffect(() => {
    if (!preload || enabled || preloadPromiseRef.current || symphonySdk.hasRendered(containerSelector)) {
      debugClientChat('Preload effect skipped.', {
        preload,
        enabled,
        hasInflightPreload: Boolean(preloadPromiseRef.current),
        hasRendered: symphonySdk.hasRendered(containerSelector),
        containerSelector,
      });
      return;
    }

    let cancelled = false;
    let retryTimerId: number | null = null;

    const bootstrapClientWorkspace = async (attempt: number): Promise<void> => {
      const startedAt = getNow();

      try {
        debugClientChat('Bootstrapping client Symphony SDK.', {
          attempt: attempt + 1,
          contactId,
          containerSelector,
          ecpOrigin,
        });
        const preloadPromise = (async () => {
          await symphonySdk.init(ecpOrigin, partnerId);
          debugClientChat('SDK initialised during preload (no stream rendered).', {
            attempt: attempt + 1,
            containerSelector,
            ecpOrigin,
            elapsedMs: getElapsedMs(startedAt),
          });
        })();
        preloadPromiseRef.current = preloadPromise;
        await preloadPromise;
        if (preloadPromiseRef.current === preloadPromise) {
          preloadPromiseRef.current = null;
        }

        if (cancelled) {
          return;
        }

        setChatError(null);
        debugClientChat('Client Symphony SDK bootstrapped.', {
          attempt: attempt + 1,
          contactId,
          containerSelector,
          elapsedMs: getElapsedMs(startedAt),
        });
      } catch (cause) {
        if (preloadPromiseRef.current) {
          preloadPromiseRef.current = null;
        }

        if (cancelled) {
          return;
        }

        const error = toError(cause, 'Unable to bootstrap Symphony client chat.');
        const retryDelayMs = isRetryableSymphonyError(error)
          ? getRetryDelayMs(STREAM_RETRY_DELAYS_MS, attempt)
          : null;

        debugClientChat('Client Symphony SDK failed to bootstrap.', {
          attempt: attempt + 1,
          contactId,
          containerSelector,
          elapsedMs: getElapsedMs(startedAt),
          error: error.message,
          retryDelayMs,
        });

        if (retryDelayMs !== null) {
          symphonySdk.resetIfError();
          retryTimerId = window.setTimeout(() => {
            if (!cancelled) {
              void bootstrapClientWorkspace(attempt + 1);
            }
          }, retryDelayMs);
          return;
        }

        setChatError(error.message);
      }
    };

    void bootstrapClientWorkspace(0);

    return () => {
      cancelled = true;
      if (retryTimerId !== null) {
        window.clearTimeout(retryTimerId);
      }
    };
  }, [contactId, containerSelector, ecpOrigin, enabled, partnerId, preload]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    if (!streamId) {
      debugClientChat('No streamId — setting error.', { contactId, containerSelector });
      setChatError('Client chat is not available right now.');
      setIsChatReady(false);
      setIsLoading(false);
      return;
    }

    const renderedStreamId = symphonySdk.getRenderedStreamId(containerSelector);
    if (renderedStreamId === streamId) {
      debugClientChat('Already showing requested stream — marking ready.', {
        streamId,
        renderedStreamId,
        containerSelector,
      });
      setChatError(null);
      setIsChatReady(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let retryTimerId: number | null = null;

    setChatError(null);
    setIsChatReady(false);
    setIsLoading(true);
    debugClientChat('Stream open effect starting.', { streamId, contactId, containerSelector, enabled });

    const openRequestedStream = async (attempt: number) => {
      const startedAt = getNow();

      try {
        const currentRenderedStreamId = symphonySdk.getRenderedStreamId(containerSelector);
        const hasWarmRenderedContainer = symphonySdk.hasRendered(containerSelector);
        debugClientChat('Opening client Symphony chat stream.', {
          attempt: attempt + 1,
          contactId,
          containerSelector,
          ecpOrigin,
          currentRenderedStreamId: currentRenderedStreamId ?? null,
          hasWarmRenderedContainer,
          streamId,
        });

        if (!hasWarmRenderedContainer && preloadPromiseRef.current) {
          debugClientChat('Waiting for inflight preload before opening stream.', { streamId });
          await preloadPromiseRef.current.catch(() => {});
        }

        if (hasWarmRenderedContainer) {
          debugClientChat('Warm container already rendered — skipping preload waits.', {
            containerSelector,
            streamId,
          });
        }

        await symphonySdk.init(ecpOrigin, partnerId);

        applyClientThemeSafely({
          attempt: attempt + 1,
          contactId,
          phase: 'pre-open-stream',
          streamId,
        });

        debugClientChat(
          symphonySdk.hasRendered(containerSelector)
            ? 'Existing render found — calling openStream().'
            : 'No existing render found — opening requested stream directly.',
          { streamId, containerSelector },
        );
        await symphonySdk.openStream(
          streamId,
          containerSelector,
          getWealthSymphonyRenderOptions(),
        );

        if (cancelled) {
          return;
        }

        applyClientThemeSafely({
          attempt: attempt + 1,
          contactId,
          phase: 'open-stream',
          streamId,
        });
        if (cancelled) {
          return;
        }
        debugClientChat('Client Symphony chat stream opened.', {
          attempt: attempt + 1,
          contactId,
          containerSelector,
          elapsedMs: getElapsedMs(startedAt),
          streamId,
        });
        setChatError(null);
        setIsChatReady(true);
        setIsLoading(false);

        void applyClientThemeWithSettleSafely({
          attempt: attempt + 1,
          contactId,
          phase: 'post-open-background-settle',
          streamId,
        });
      } catch (cause) {
        if (cancelled) {
          return;
        }

        const error = toError(cause, 'Unable to open Symphony stream.');
        const retryDelayMs = isRetryableSymphonyError(error)
          ? getRetryDelayMs(STREAM_RETRY_DELAYS_MS, attempt)
          : null;

        debugClientChat('Client Symphony chat stream failed to open.', {
          attempt: attempt + 1,
          contactId,
          containerSelector,
          elapsedMs: getElapsedMs(startedAt),
          error: error.message,
          retryDelayMs,
          streamId,
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

        setChatError(error.message);
        setIsChatReady(false);
        setIsLoading(false);
      }
    };

    void openRequestedStream(0);

    return () => {
      cancelled = true;
      if (retryTimerId !== null) {
        window.clearTimeout(retryTimerId);
      }
    };
  }, [contactId, containerSelector, ecpOrigin, enabled, partnerId, streamId]);

  useEffect(() => {
    if (!enabled || !isChatReady || !streamId) {
      return;
    }

    symphonyNotifications.markMessagesViewed?.(streamId);
  }, [enabled, isChatReady, streamId]);

  const sendMessageToChat = useCallback(async (message: Record<string, unknown>) => {
    if (!enabled || !streamId) {
      throw new Error('Client chat is not available right now.');
    }

    if (!isChatReady || isLoading || symphonySdk.getRenderedStreamId(containerSelector) !== streamId) {
      throw new Error('Client chat is still connecting. Please try again in a moment.');
    }

    await symphonySdk.sendMessage(message, {
      containerSelector,
      mode: 'blast',
      streamIds: [streamId],
      users: [],
    });
  }, [containerSelector, enabled, isChatReady, isLoading, streamId]);

  return {
    chatError,
    contact,
    isChatReady,
    isLoading,
    sendMessageToChat,
    slotClassName: containerSelector.startsWith('.') ? containerSelector.slice(1) : containerSelector,
    streamId,
  };
}
