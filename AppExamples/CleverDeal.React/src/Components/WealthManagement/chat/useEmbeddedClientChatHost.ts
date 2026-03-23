import { useEffect, useMemo, useRef, useState } from 'react';
import { wealthManagementShellData, type ShellContact } from '../data/wealthManagementShell';
import { symphonyNotifications } from './symphonyNotifications';
import { getWealthSymphonyThemeUrlParams } from './wealthSymphonyTheme';

const CLIENT_CHAT_HOST_PATH = '/wealth-client-chat-host.html';

export interface ClientChatHostMessage {
  source?: string;
  type?: string;
  payload?: {
    requestId?: string;
    documentName?: string;
    message?: string;
    streamId?: string;
  };
}

interface UseEmbeddedClientChatHostOptions {
  contactId?: string | null;
  ecpOrigin?: string;
  partnerId?: string;
  onHostMessage?: (message: ClientChatHostMessage) => void;
}

export function useEmbeddedClientChatHost({
  contactId,
  ecpOrigin = 'corporate.symphony.com',
  partnerId,
  onHostMessage,
}: UseEmbeddedClientChatHostOptions) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isChatReady, setIsChatReady] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const roomMap = wealthManagementShellData.wealthRoom as Record<string, string>;
  const contact = useMemo<ShellContact | undefined>(
    () => (wealthManagementShellData.contacts ?? []).find((item) => item.id === contactId),
    [contactId],
  );
  const defaultStreamId = roomMap[ecpOrigin] ?? roomMap['corporate.symphony.com'];
  const streamId = contact?.streamId ?? defaultStreamId;
  const themeUrlParams = useMemo(() => getWealthSymphonyThemeUrlParams(), []);
  const chatHostUrl = useMemo(() => {
    if (!streamId) {
      return '';
    }

    const url = new URL(CLIENT_CHAT_HOST_PATH, window.location.origin);
    url.searchParams.set('ecpOrigin', ecpOrigin);
    url.searchParams.set('streamId', streamId);
    url.searchParams.set('mode', themeUrlParams.mode);
    url.searchParams.set('theme', themeUrlParams.theme);
    if (partnerId) {
      url.searchParams.set('partnerId', partnerId);
    }
    return url.toString();
  }, [ecpOrigin, partnerId, streamId, themeUrlParams]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const data = event.data as ClientChatHostMessage | undefined;
      if (data?.source !== 'wealth-client-chat-host') {
        return;
      }

      onHostMessage?.(data);

      if (data.type === 'ready') {
        if (data.payload?.streamId !== streamId) {
          return;
        }

        setChatError(null);
        setIsChatReady(true);
        return;
      }

      if (data.type === 'error') {
        if (data.payload?.streamId && data.payload.streamId !== streamId) {
          return;
        }

        setChatError(data.payload?.message ?? 'Unable to load client chat.');
        setIsChatReady(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onHostMessage, streamId]);

  useEffect(() => {
    setChatError(null);
    setIsChatReady(false);
  }, [chatHostUrl]);

  useEffect(() => {
    if (!isChatReady || !streamId) {
      return;
    }

    symphonyNotifications.markMessagesViewed?.(streamId);
  }, [isChatReady, streamId]);

  return {
    chatError,
    chatHostUrl,
    contact,
    iframeRef,
    isChatReady,
    streamId,
  };
}