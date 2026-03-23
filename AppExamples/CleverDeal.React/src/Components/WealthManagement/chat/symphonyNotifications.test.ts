import { SymphonyNotificationsService } from './symphonyNotifications';

type NotificationCallback = (notification: Record<string, unknown>) => void;

describe('SymphonyNotificationsService', () => {
  beforeEach(() => {
    delete (window as any).symphony;
  });

  afterEach(() => {
    delete (window as any).symphony;
  });

  test('subscribes once to the global unread and message notification channels', () => {
    const listenMock = jest.fn();
    const service = new SymphonyNotificationsService();

    (window as any).symphony = {
      listen: listenMock,
    };

    service.init('corporate.symphony.com');
    service.init('corporate.symphony.com');

    expect(listenMock).toHaveBeenCalledTimes(2);
    expect(listenMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: 'GlobalUnreadCountNotifications',
      }),
    );
    expect(listenMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'MessageNotifications',
      }),
    );
  });

  test('uses the global unread count subscription for the total unread metric', () => {
    const callbacks = new Map<string, NotificationCallback>();
    const service = new SymphonyNotificationsService();
    const listener = jest.fn();

    (window as any).symphony = {
      listen: jest.fn(({ type, callback }: { type: string; callback: NotificationCallback }) => {
        callbacks.set(type, callback);
      }),
    };

    service.onCountChange(listener);
    service.init('corporate.symphony.com');

    callbacks.get('GlobalUnreadCountNotifications')?.({ count: 3 });
    callbacks.get('GlobalUnreadCountNotifications')?.({ count: 5 });

    expect(listener).toHaveBeenNthCalledWith(1, 0);
    expect(listener).toHaveBeenNthCalledWith(2, 3);
    expect(listener).toHaveBeenNthCalledWith(3, 5);
    expect(service.count).toBe(5);
  });

  test('falls back to message notifications before the first global unread baseline arrives', () => {
    const callbacks = new Map<string, NotificationCallback>();
    const service = new SymphonyNotificationsService();
    const listener = jest.fn();

    (window as any).symphony = {
      listen: jest.fn(({ type, callback }: { type: string; callback: NotificationCallback }) => {
        callbacks.set(type, callback);
      }),
    };

    service.onCountChange(listener);
    service.init('corporate.symphony.com');

    callbacks.get('MessageNotifications')?.({ streamId: 'stream-1' });
    callbacks.get('MessageNotifications')?.({ streamId: 'stream-2' });

    expect(service.count).toBe(2);
    expect(service.debugSnapshot.globalUnreadCount).toBe(0);
    expect(service.debugSnapshot.fallbackUnreadCount).toBe(2);
    expect(listener).toHaveBeenLastCalledWith(2);
  });

  test('treats the global unread count as authoritative once the baseline arrives', () => {
    const callbacks = new Map<string, NotificationCallback>();
    const service = new SymphonyNotificationsService();

    (window as any).symphony = {
      listen: jest.fn(({ type, callback }: { type: string; callback: NotificationCallback }) => {
        callbacks.set(type, callback);
      }),
    };

    service.init('corporate.symphony.com');
    callbacks.get('MessageNotifications')?.({ streamId: 'stream-1' });
    callbacks.get('MessageNotifications')?.({ streamId: 'stream-2' });

    expect(service.count).toBe(2);

    callbacks.get('GlobalUnreadCountNotifications')?.({ count: 0 });
    callbacks.get('MessageNotifications')?.({ streamId: 'stream-3' });

    expect(service.count).toBe(0);
    expect(service.debugSnapshot.globalUnreadCount).toBe(0);
    expect(service.debugSnapshot.fallbackUnreadCount).toBe(1);
    expect(service.streamUnreadSnapshot).toEqual({ 'stream-3': 1 });
  });

  test('emits unread events only after the initial global unread baseline callback', () => {
    const callbacks = new Map<string, NotificationCallback>();
    const service = new SymphonyNotificationsService();
    const unreadListener = jest.fn();

    (window as any).symphony = {
      listen: jest.fn(({ type, callback }: { type: string; callback: NotificationCallback }) => {
        callbacks.set(type, callback);
      }),
    };

    service.onUnreadEvent(unreadListener);
    service.init('corporate.symphony.com');

    callbacks.get('GlobalUnreadCountNotifications')?.({ count: 2 });
    callbacks.get('GlobalUnreadCountNotifications')?.({ count: 5 });

    expect(unreadListener).toHaveBeenCalledTimes(1);
    expect(unreadListener).toHaveBeenCalledWith(
      expect.objectContaining({
        streamId: 'global',
        previousCount: 2,
        count: 5,
        delta: 3,
      }),
    );
  });

  test('publishes debug snapshots for listener registration and unread updates', () => {
    const callbacks = new Map<string, NotificationCallback>();
    const service = new SymphonyNotificationsService();
    const debugListener = jest.fn();

    (window as any).symphony = {
      listen: jest.fn(({ type, callback }: { type: string; callback: NotificationCallback }) => {
        callbacks.set(type, callback);
      }),
    };

    service.onDebugChange(debugListener);
    service.init('corporate.symphony.com');
    callbacks.get('GlobalUnreadCountNotifications')?.({ count: 4 });
    callbacks.get('MessageNotifications')?.({ streamName: 'Platform Room', fromWhomName: 'System Bot' });

    expect(debugListener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        totalCount: 4,
        globalUnreadCount: 4,
        fallbackUnreadCount: 0,
        lastEventSummary: expect.stringContaining('Platform Room'),
        origins: expect.arrayContaining([
          expect.objectContaining({
            ecpOrigin: 'corporate.symphony.com',
            status: 'listening',
          }),
        ]),
        subscriptions: expect.arrayContaining([
          expect.objectContaining({
            id: 'global-unread-count',
            lastPayloadSummary: 'count=4',
          }),
          expect.objectContaining({
            id: 'global-message-notifications',
            lastPayloadSummary: expect.stringContaining('Platform Room'),
          }),
        ]),
        recentNotifications: expect.arrayContaining([
          expect.objectContaining({
            type: 'GlobalUnreadCountNotifications',
          }),
          expect.objectContaining({
            type: 'MessageNotifications',
          }),
        ]),
      }),
    );
  });

  test('retries initialization until the Symphony unread listener becomes available', () => {
    jest.useFakeTimers();
    const listenMock = jest.fn();
    const service = new SymphonyNotificationsService();

    (window as any).symphony = {};
    service.init('corporate.symphony.com');

    expect(listenMock).not.toHaveBeenCalled();

    (window as any).symphony = {
      listen: listenMock,
    };

    jest.runOnlyPendingTimers();

    expect(listenMock).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  test('clears the fallback unread count after the user reviews chat', () => {
    const callbacks = new Map<string, NotificationCallback>();
    const service = new SymphonyNotificationsService();

    (window as any).symphony = {
      listen: jest.fn(({ type, callback }: { type: string; callback: NotificationCallback }) => {
        callbacks.set(type, callback);
      }),
    };

    service.init('corporate.symphony.com');
    callbacks.get('MessageNotifications')?.({ streamId: 'stream-1' });

    expect(service.count).toBe(1);

    service.markMessagesViewed();

    expect(service.count).toBe(0);
    expect(service.debugSnapshot.fallbackUnreadCount).toBe(0);
  });

  test('tracks unread counts per stream and clears a viewed stream independently', () => {
    const callbacks = new Map<string, NotificationCallback>();
    const service = new SymphonyNotificationsService();
    const streamListener = jest.fn();

    (window as any).symphony = {
      listen: jest.fn(({ type, callback }: { type: string; callback: NotificationCallback }) => {
        callbacks.set(type, callback);
      }),
    };

    service.onStreamUnreadChange(streamListener);
    service.init('corporate.symphony.com');
    callbacks.get('MessageNotifications')?.({ streamId: 'stream-1' });
    callbacks.get('MessageNotifications')?.({ streamId: 'stream-1' });
    callbacks.get('MessageNotifications')?.({ streamId: 'stream-2' });

    expect(service.streamUnreadSnapshot).toEqual({ 'stream-1': 2, 'stream-2': 1 });

    service.markMessagesViewed('stream-1');

    expect(service.streamUnreadSnapshot).toEqual({ 'stream-2': 1 });
    expect(streamListener).toHaveBeenLastCalledWith({ 'stream-2': 1 });
  });
});
