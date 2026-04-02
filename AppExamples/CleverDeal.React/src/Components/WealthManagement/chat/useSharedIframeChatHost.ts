import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getWealthSymphonySharedIframeOptions,
  getWealthSymphonyThemeUrlParams,
  type WealthSymphonySharedIframeLayout,
} from './wealthSymphonyTheme';
import { debugWealth } from './wealthDebug';

function debugSharedHost(message: string, context?: Record<string, unknown>) {
  debugWealth('SharedIframeChatHost', message, context);
}

const SHARED_CHAT_IFRAME_PATH = '/client-bff/index.html';

function toSearchParamValue(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
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
  const [isChatReady, setIsChatReady] = useState(false);
  const hostConfigKey = `${ecpOrigin}::${partnerId ?? ''}`;
  const lockedHostConfigKeyRef = useRef<string | null>(null);
  const lockedLayoutModeRef = useRef<WealthSymphonySharedIframeLayout>(layoutMode);

  if (lockedHostConfigKeyRef.current !== hostConfigKey) {
    lockedHostConfigKeyRef.current = hostConfigKey;
    lockedLayoutModeRef.current = layoutMode;
  }

  const lockedLayoutMode = lockedLayoutModeRef.current;

  const chatUrl = useMemo(() => {
    const url = new URL(`https://${ecpOrigin}${SHARED_CHAT_IFRAME_PATH}`);
    const renderOptions = getWealthSymphonySharedIframeOptions(lockedLayoutMode);
    const themeParams = getWealthSymphonyThemeUrlParams();

    Object.entries({ ...renderOptions, ...themeParams }).forEach(([key, value]) => {
      const paramValue = toSearchParamValue(value);
      if (paramValue !== null) {
        url.searchParams.set(key, paramValue);
      }
    });

    if (partnerId) {
      url.searchParams.set('partnerId', partnerId);
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
      setIsChatReady(false);
      return;
    }

    debugSharedHost('chatUrl changed — resetting ready state.', { chatUrl });
    setChatError(null);
    setIsChatReady(false);
  }, [chatUrl]);

  const handleLoad = useCallback(() => {
    debugSharedHost('Shared iframe loaded — isChatReady=true.');
    setChatError(null);
    setIsChatReady(true);
  }, []);

  const handleError = useCallback(() => {
    debugSharedHost('Shared iframe error — isChatReady=false.');
    setChatError('Unable to load Symphony chat.');
    setIsChatReady(false);
  }, []);

  return {
    chatError,
    chatUrl,
    handleError,
    handleLoad,
    isChatReady,
  };
}
