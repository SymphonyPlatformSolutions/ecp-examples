import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getWealthSymphonySharedIframeOptions,
  type WealthSymphonySharedIframeLayout,
} from './wealthSymphonyTheme';
import { debugWealth } from './wealthDebug';

function debugSharedHost(message: string, context?: Record<string, unknown>) {
  debugWealth('SharedIframeChatHost', message, context);
}

const SHARED_CHAT_IFRAME_PATH = '/client-bff/index.html';
const SHARED_CHAT_READY_EVENT = 'clientReady';

function toSearchParamValue(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function getMessageEventType(data: unknown) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const eventType = (data as { eventType?: unknown }).eventType;
  return typeof eventType === 'string' ? eventType : null;
}

interface UseSharedIframeChatHostOptions {
  ecpOrigin?: string;
  layoutMode?: WealthSymphonySharedIframeLayout;
  partnerId?: string;
}

export function useSharedIframeChatHost({
  ecpOrigin = 'corporate.symphony.com',
  layoutMode = 'drawer',
  partnerId,
}: UseSharedIframeChatHostOptions) {
  const [chatError, setChatError] = useState<string | null>(null);
  const [isChatPrimed, setIsChatPrimed] = useState(false);
  const [isChatReady, setIsChatReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const hostConfigKey = `${ecpOrigin}::${partnerId ?? ''}`;
  const lockedHostConfigKeyRef = useRef<string | null>(null);
  const lockedLayoutModeRef = useRef<WealthSymphonySharedIframeLayout>(layoutMode);

  const trustedOrigin = `https://${ecpOrigin}`;

  if (lockedHostConfigKeyRef.current !== hostConfigKey) {
    lockedHostConfigKeyRef.current = hostConfigKey;
    lockedLayoutModeRef.current = layoutMode;
  }

  const lockedLayoutMode = lockedLayoutModeRef.current;

  const chatUrl = useMemo(() => {
    const url = new URL(`https://${ecpOrigin}${SHARED_CHAT_IFRAME_PATH}`);
    const renderOptions = getWealthSymphonySharedIframeOptions(lockedLayoutMode);

    // Collaboration mode keeps the built-in light palette; custom theme overrides
    // are supported by focus-mode SDK rendering, not this shared iframe path.
    Object.entries(renderOptions).forEach(([key, value]) => {
      const paramValue = toSearchParamValue(value);
      if (paramValue !== null) {
        url.searchParams.set(key, paramValue);
      }
    });

    if (partnerId) {
      url.searchParams.set('partnerId', partnerId);
    }

    if (typeof window !== 'undefined') {
      url.searchParams.set('sdkOrigin', window.location.origin);
    }

    const built = url.toString();
    debugSharedHost('Chat URL constructed.', {
      requestedLayoutMode: layoutMode,
      lockedLayoutMode,
      url: built,
    });
    return built;
  }, [ecpOrigin, layoutMode, lockedLayoutMode, partnerId]);

  useEffect(() => {
    if (!chatUrl) {
      debugSharedHost('chatUrl is empty — setting error state.');
      setChatError('Unable to load Symphony chat.');
      setIsChatPrimed(false);
      setIsChatReady(false);
      return;
    }

    debugSharedHost('chatUrl changed — resetting ready state.', { chatUrl });
    setChatError(null);
    setIsChatPrimed(false);
    setIsChatReady(false);
  }, [chatUrl]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== trustedOrigin) {
        return;
      }

      const iframeWindow = iframeRef.current?.contentWindow;
      if (iframeWindow && event.source !== iframeWindow) {
        return;
      }

      if (getMessageEventType(event.data) !== SHARED_CHAT_READY_EVENT) {
        return;
      }

      debugSharedHost('Received shared iframe clientReady message.', {
        origin: event.origin,
      });
      setChatError(null);
      setIsChatPrimed(true);
      setIsChatReady((current) => {
        if (!current) {
          debugSharedHost('Shared iframe ready confirmed from clientReady message.');
        }
        return true;
      });
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [trustedOrigin]);

  const handleLoad = useCallback(() => {
    debugSharedHost('Shared iframe loaded — primed, waiting for clientReady.', {
      trustedOrigin,
    });
    setChatError(null);
    setIsChatPrimed(true);
  }, [trustedOrigin]);

  const handleError = useCallback(() => {
    debugSharedHost('Shared iframe error — isChatReady=false.');
    setChatError('Unable to load Symphony chat.');
    setIsChatPrimed(false);
    setIsChatReady(false);
  }, []);

  return {
    chatError,
    chatUrl,
    handleError,
    handleLoad,
    iframeRef,
    isChatPrimed,
    isChatReady,
  };
}
