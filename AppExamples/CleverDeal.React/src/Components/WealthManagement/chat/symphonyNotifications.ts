import { debugWealth } from './wealthDebug';

type CountListener = (count: number) => void;
type DebugListener = (snapshot: SymphonyNotificationDebugSnapshot) => void;
type UnreadEventListener = (event: SymphonyUnreadNotificationEvent) => void;
type NotificationEventListener = (event: SymphonyNotificationEvent) => void;
type StreamUnreadListener = (counts: SymphonyStreamUnreadCounts) => void;

type NotificationOriginStatus = 'idle' | 'retrying' | 'listening' | 'error';
type NotificationSubscriptionStatus = 'pending' | 'listening' | 'ready' | 'error';

interface NotificationOriginDebugState {
  ecpOrigin: string;
  status: NotificationOriginStatus;
  attempts: number;
  lastError: string | null;
}

interface NotificationSubscriptionDebugState {
  id: string;
  type: string;
  label: string;
  status: NotificationSubscriptionStatus;
  updates: number;
  lastUpdatedAt: number | null;
  lastPayloadSummary: string | null;
  lastError: string | null;
}

interface NotificationRecord {
  id: string;
  type: string;
  summary: string;
  receivedAt: number;
}

export interface SymphonyNotificationDebugSnapshot {
  totalCount: number;
  globalUnreadCount: number;
  fallbackUnreadCount: number;
  origins: Array<NotificationOriginDebugState>;
  subscriptions: Array<NotificationSubscriptionDebugState>;
  recentNotifications: Array<NotificationRecord>;
  lastEventSummary: string | null;
  lastEventAt: number | null;
}

export interface SymphonyUnreadNotificationEvent {
  streamId: string;
  label: string;
  count: number;
  previousCount: number;
  delta: number;
  receivedAt: number;
}

export interface SymphonyNotificationEvent {
  type: 'GlobalUnreadCountNotifications' | 'MessageNotifications';
  summary: string;
  receivedAt: number;
  payload: Record<string, unknown>;
}

export type SymphonyStreamUnreadCounts = Record<string, number>;

export class SymphonyNotificationsService {
  private _count = 0;
  private _globalUnreadCount = 0;
  private _fallbackUnreadCount = 0;
  private _hasGlobalUnreadBaseline = false;
  private _listeners = new Set<CountListener>();
  private _debugListeners = new Set<DebugListener>();
  private _unreadEventListeners = new Set<UnreadEventListener>();
  private _notificationEventListeners = new Set<NotificationEventListener>();
  private _streamUnreadListeners = new Set<StreamUnreadListener>();
  private _initializedOrigins = new Set<string>();
  private _originDebug = new Map<string, NotificationOriginDebugState>();
  private _subscriptionDebug = new Map<string, NotificationSubscriptionDebugState>();
  private _retryCounts = new Map<string, number>();
  private _retryTimers = new Map<string, number>();
  private _streamUnreadCounts = new Map<string, number>();
  private _recentNotifications: NotificationRecord[] = [];
  private _lastEventSummary: string | null = null;
  private _lastEventAt: number | null = null;

  private _debug(message: string, context?: Record<string, unknown>) {
    debugWealth('WealthNotifications', message, context);
  }

  private _recomputeCount() {
    this._count = this._hasGlobalUnreadBaseline ? this._globalUnreadCount : this._fallbackUnreadCount;
  }

  private _emitCount() {
    this._listeners.forEach((listener) => listener(this._count));
  }

  private _emitDebug() {
    const snapshot = this.debugSnapshot;
    this._debugListeners.forEach((listener) => listener(snapshot));
  }

  private _emitUnreadEvent(event: SymphonyUnreadNotificationEvent) {
    this._unreadEventListeners.forEach((listener) => listener(event));
  }

  private _emitNotificationEvent(event: SymphonyNotificationEvent) {
    this._notificationEventListeners.forEach((listener) => listener(event));
  }

  private _emitStreamUnreadCounts() {
    const snapshot = this.streamUnreadSnapshot;
    this._streamUnreadListeners.forEach((listener) => listener(snapshot));
  }

  private _recomputeFallbackUnreadCount() {
    this._fallbackUnreadCount = Array.from(this._streamUnreadCounts.values()).reduce((total, count) => total + count, 0);
  }

  private _emitUnreadState() {
    this._recomputeFallbackUnreadCount();
    this._recomputeCount();
    this._emitCount();
    this._emitStreamUnreadCounts();
    this._emitDebug();
  }

  private _incrementStreamUnread(streamId: string) {
    const current = this._streamUnreadCounts.get(streamId) ?? 0;
    this._streamUnreadCounts.set(streamId, current + 1);
    this._emitUnreadState();
  }

  private _clearStreamUnread(streamId: string) {
    if (!this._streamUnreadCounts.has(streamId)) {
      return;
    }

    this._streamUnreadCounts.delete(streamId);
    this._emitUnreadState();
  }

  private _clearAllStreamUnread() {
    if (this._streamUnreadCounts.size === 0) {
      return;
    }

    this._streamUnreadCounts.clear();
    this._emitUnreadState();
  }

  private _updateOriginDebug(ecpOrigin: string, updates: Partial<NotificationOriginDebugState>) {
    const current = this._originDebug.get(ecpOrigin) ?? {
      ecpOrigin,
      status: 'idle',
      attempts: 0,
      lastError: null,
    };

    this._originDebug.set(ecpOrigin, { ...current, ...updates });
    this._emitDebug();
  }

  private _updateSubscriptionDebug(id: string, type: string, label: string, updates: Partial<NotificationSubscriptionDebugState>) {
    const current = this._subscriptionDebug.get(id) ?? {
      id,
      type,
      label,
      status: 'pending',
      updates: 0,
      lastUpdatedAt: null,
      lastPayloadSummary: null,
      lastError: null,
    };

    this._subscriptionDebug.set(id, { ...current, type, label, ...updates });
    this._emitDebug();
  }

  private _recordNotification(type: SymphonyNotificationEvent['type'], summary: string, receivedAt: number) {
    this._recentNotifications = [
      {
        id: `${type}-${receivedAt}`,
        type,
        summary,
        receivedAt,
      },
      ...this._recentNotifications,
    ].slice(0, 12);
    this._emitDebug();
  }

  private _applyCountUpdate(nextGlobalUnreadCount: number) {
    const hadGlobalBaseline = this._hasGlobalUnreadBaseline;
    this._hasGlobalUnreadBaseline = true;
    this._globalUnreadCount = nextGlobalUnreadCount;

    if (!hadGlobalBaseline || nextGlobalUnreadCount === 0) {
      this._streamUnreadCounts.clear();
    }

    this._emitUnreadState();
  }

  init(ecpOrigin: string) {
    if (this._initializedOrigins.has(ecpOrigin)) {
      this._emitDebug();
      return;
    }

    const symphony = window.symphony;
    const listen = symphony?.listen;
    if (!listen) {
      const attempts = (this._retryCounts.get(ecpOrigin) ?? 0) + 1;
      this._retryCounts.set(ecpOrigin, attempts);
      this._updateOriginDebug(ecpOrigin, {
        attempts,
        status: 'retrying',
        lastError: 'window.symphony.listen is not available yet.',
      });

      if (attempts <= 10) {
        const existingTimer = this._retryTimers.get(ecpOrigin);
        if (existingTimer) {
          window.clearTimeout(existingTimer);
        }

        this._debug('Unread listener not ready yet, retrying.', { ecpOrigin, attempts });
        const timer = window.setTimeout(() => {
          this._retryTimers.delete(ecpOrigin);
          this.init(ecpOrigin);
        }, 250);
        this._retryTimers.set(ecpOrigin, timer);
      }

      return;
    }

    const existingTimer = this._retryTimers.get(ecpOrigin);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
      this._retryTimers.delete(ecpOrigin);
    }
    this._retryCounts.delete(ecpOrigin);
    this._initializedOrigins.add(ecpOrigin);
    this._updateOriginDebug(ecpOrigin, {
      attempts: 0,
      status: 'listening',
      lastError: null,
    });

    this._debug('Initializing global notification listeners.', { ecpOrigin });

    const subscriptions = [
      {
        id: 'global-unread-count',
        type: 'GlobalUnreadCountNotifications' as const,
        label: 'All unread counts',
      },
      {
        id: 'global-message-notifications',
        type: 'MessageNotifications' as const,
        label: 'All message notifications',
      },
    ];

    subscriptions.forEach((subscription) => {
      this._updateSubscriptionDebug(subscription.id, subscription.type, subscription.label, {
        status: 'listening',
        lastError: null,
      });

      try {
        listen({
          type: subscription.type,
          callback: (payload) => {
            const receivedAt = Date.now();
            const current = this._subscriptionDebug.get(subscription.id);
            const updates = (current?.updates ?? 0) + 1;

            if (subscription.type === 'GlobalUnreadCountNotifications') {
              const previousCount = this._count;
              const nextCount = Number(payload.count ?? 0);
              this._lastEventSummary = `All conversations: ${nextCount} unread`;
              this._lastEventAt = receivedAt;
              this._debug('Received global unread count update.', {
                count: nextCount,
                previousCount,
              });
              this._recordNotification(subscription.type, this._lastEventSummary, receivedAt);
              this._updateSubscriptionDebug(subscription.id, subscription.type, subscription.label, {
                status: 'ready',
                updates,
                lastUpdatedAt: receivedAt,
                lastPayloadSummary: `count=${nextCount}`,
                lastError: null,
              });
              this._applyCountUpdate(nextCount);
              this._emitNotificationEvent({
                type: subscription.type,
                summary: this._lastEventSummary,
                receivedAt,
                payload,
              });

              if ((current?.updates ?? 0) > 0 && nextCount > previousCount) {
                this._emitUnreadEvent({
                  streamId: 'global',
                  label: 'All conversations',
                  count: nextCount,
                  previousCount,
                  delta: nextCount - previousCount,
                  receivedAt,
                });
              }

              return;
            }

            const streamName = typeof payload.streamName === 'string' ? payload.streamName : 'Unknown conversation';
            const fromWhomName = typeof payload.fromWhomName === 'string' ? payload.fromWhomName : 'Unknown sender';
            const summary = `${streamName}: ${fromWhomName}`;
            const previousCount = this._count;
            const streamId = typeof payload.streamId === 'string' ? payload.streamId : undefined;
            this._lastEventSummary = summary;
            this._lastEventAt = receivedAt;
            this._debug('Received message notification.', payload);
            this._recordNotification(subscription.type, summary, receivedAt);
            this._updateSubscriptionDebug(subscription.id, subscription.type, subscription.label, {
              status: 'ready',
              updates,
              lastUpdatedAt: receivedAt,
              lastPayloadSummary: summary,
              lastError: null,
            });
            if (streamId) {
              this._incrementStreamUnread(streamId);
            }
            this._emitNotificationEvent({
              type: subscription.type,
              summary,
              receivedAt,
              payload,
            });
            if (this._count > previousCount) {
              this._emitUnreadEvent({
                streamId: streamId ?? 'global-fallback',
                label: streamName,
                count: this._count,
                previousCount,
                delta: this._count - previousCount,
                receivedAt,
              });
            }
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown notification listener error.';
        this._updateOriginDebug(ecpOrigin, {
          status: 'error',
          lastError: message,
        });
        this._updateSubscriptionDebug(subscription.id, subscription.type, subscription.label, {
          status: 'error',
          lastError: message,
        });
      }
    });
  }

  onCountChange(listener: CountListener) {
    this._listeners.add(listener);
    listener(this._count);
    return () => {
      this._listeners.delete(listener);
    };
  }

  onDebugChange(listener: DebugListener) {
    this._debugListeners.add(listener);
    listener(this.debugSnapshot);
    return () => {
      this._debugListeners.delete(listener);
    };
  }

  onUnreadEvent(listener: UnreadEventListener) {
    this._unreadEventListeners.add(listener);
    return () => {
      this._unreadEventListeners.delete(listener);
    };
  }

  onNotificationEvent(listener: NotificationEventListener) {
    this._notificationEventListeners.add(listener);
    return () => {
      this._notificationEventListeners.delete(listener);
    };
  }

  onStreamUnreadChange(listener: StreamUnreadListener) {
    this._streamUnreadListeners.add(listener);
    listener(this.streamUnreadSnapshot);
    return () => {
      this._streamUnreadListeners.delete(listener);
    };
  }

  markMessagesViewed(streamId?: string) {
    if (streamId) {
      if (!this._streamUnreadCounts.has(streamId)) {
        return;
      }

      this._debug('Clearing unread count for viewed chat stream.', {
        streamId,
        unreadCount: this._streamUnreadCounts.get(streamId),
      });
      this._clearStreamUnread(streamId);
      return;
    }

    if (this._streamUnreadCounts.size === 0) {
      return;
    }

    this._debug('Clearing unread counts after chat review.', {
      fallbackUnreadCount: this._fallbackUnreadCount,
    });
    this._clearAllStreamUnread();
  }

  get count() {
    return this._count;
  }

  get streamUnreadSnapshot(): SymphonyStreamUnreadCounts {
    return Object.fromEntries(Array.from(this._streamUnreadCounts.entries()).sort(([left], [right]) => left.localeCompare(right)));
  }

  get debugSnapshot(): SymphonyNotificationDebugSnapshot {
    return {
      totalCount: this._count,
      globalUnreadCount: this._globalUnreadCount,
      fallbackUnreadCount: this._fallbackUnreadCount,
      origins: Array.from(this._originDebug.values()),
      subscriptions: Array.from(this._subscriptionDebug.values()).sort((left, right) => left.label.localeCompare(right.label)),
      recentNotifications: this._recentNotifications,
      lastEventSummary: this._lastEventSummary,
      lastEventAt: this._lastEventAt,
    };
  }
}

export const symphonyNotifications = new SymphonyNotificationsService();
