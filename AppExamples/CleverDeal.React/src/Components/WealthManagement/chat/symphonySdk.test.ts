import { SymphonySdkService } from './symphonySdk';

describe('SymphonySdkService', () => {
  function createRenderMock({
    onRender,
  }: {
    onRender?: (iframe: HTMLIFrameElement, container: HTMLDivElement) => void;
  } = {}) {
    return jest.fn((containerId: string) => {
      const container = document.querySelector(`.${containerId}`) as HTMLDivElement | null;
      if (!container) {
        return Promise.reject(new Error('missing container'));
      }

      const iframe = document.createElement('iframe');
      iframe.src = 'https://corporate.symphony.com/apps/client2/default';
      container.appendChild(iframe);
      if (onRender) {
        onRender(iframe, container);
      } else {
        window.setTimeout(() => {
          iframe.dispatchEvent(new Event('load'));
        }, 0);
      }

      return Promise.resolve();
    });
  }

  function createOpenStreamMock({
    onOpen,
  }: {
    onOpen?: (iframe: HTMLIFrameElement, container: HTMLDivElement) => void;
  } = {}) {
    return jest.fn((streamId: string, containerSelector: string) => {
      const container = document.querySelector(containerSelector) as HTMLDivElement | null;
      if (!container) {
        return Promise.reject(new Error(`missing container for ${streamId}`));
      }

      let iframe = container.querySelector('iframe') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.src = `https://corporate.symphony.com/apps/client2/${streamId}`;
        container.appendChild(iframe);
      }

      if (onOpen) {
        onOpen(iframe, container);
      } else {
        window.setTimeout(() => {
          iframe?.dispatchEvent(new Event('load'));
        }, 0);
      }

      return Promise.resolve();
    });
  }

  beforeEach(() => {
    document.body.innerHTML = '<div class="slot-a"></div><div class="slot-b"></div>';
    delete (window as Window & { symphony?: unknown }).symphony;
    delete (window as Window & { __wealthManagementRenderEcp?: unknown }).__wealthManagementRenderEcp;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
    delete (window as Window & { symphony?: unknown }).symphony;
    delete (window as Window & { __wealthManagementRenderEcp?: unknown }).__wealthManagementRenderEcp;
  });

test('injects the SDK script once in default focus mode without performing a hidden bootstrap render', async () => {
    const service = new SymphonySdkService();
    const renderMock = createRenderMock();

    const firstInit = service.init('corporate.symphony.com');
    const secondInit = service.init('corporate.symphony.com');

    expect(document.querySelectorAll('#symphony-ecm-sdk')).toHaveLength(1);
    const script = document.getElementById('symphony-ecm-sdk') as HTMLScriptElement;
    expect(script.getAttribute('render')).toBe('explicit');
    expect(script.hasAttribute('data-mode')).toBe(false);

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: jest.fn(),
    } as any;

    script.onload?.(new Event('load') as any);

    await Promise.all([firstInit, secondInit]);

    expect(renderMock).not.toHaveBeenCalled();
    expect(service.status).toBe('ready');
  });

  test('renders the collaboration chat once into the real visible slot', async () => {
    const service = new SymphonySdkService();
    const renderMock = createRenderMock();

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: jest.fn(),
    } as any;

    await service.init('corporate.symphony.com');
    await service.renderChat('.slot-a', { mode: 'light' });

    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(renderMock).toHaveBeenCalledWith('slot-a', { mode: 'light' });
    expect(service.getRenderedStreamId('.slot-a')).toBeUndefined();
  });

  test('does not render the same collaboration container twice when the iframe is already mounted', async () => {
    const service = new SymphonySdkService();
    const renderMock = createRenderMock();

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: jest.fn(),
    } as any;

    await service.init('corporate.symphony.com');
    await service.renderChat('.slot-a', { mode: 'light' });

    await service.renderChat('.slot-a', { mode: 'light' });

    expect(renderMock).toHaveBeenCalledTimes(1);
  });

  test('waits for the rendered iframe to load before resolving the visible-slot render', async () => {
    const service = new SymphonySdkService();
    let releaseFrameLoad: (() => void) | undefined;
    const renderMock = createRenderMock({
      onRender: (iframe) => {
        releaseFrameLoad = () => iframe.dispatchEvent(new Event('load'));
      },
    });

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: jest.fn(),
    } as any;

    await service.init('corporate.symphony.com');

    let resolved = false;
    const renderPromise = service.renderChat('.slot-a', { mode: 'light' }).then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);

    releaseFrameLoad?.();
    await renderPromise;

    expect(resolved).toBe(true);
  });

  test('ignores the initial about:blank iframe load and waits for the real Symphony client navigation', async () => {
    const service = new SymphonySdkService();
    let iframeRef: HTMLIFrameElement | undefined;
    const renderMock = createRenderMock({
      onRender: (iframe) => {
        iframeRef = iframe;
        iframe.removeAttribute('src');
        window.setTimeout(() => {
          iframe.dispatchEvent(new Event('load'));
          iframe.src = 'https://corporate.symphony.com/apps/client2/default';
          iframe.dispatchEvent(new Event('load'));
        }, 0);
      },
    });

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: jest.fn(),
    } as any;

    await service.init('corporate.symphony.com');

    let resolved = false;
    const renderPromise = service.renderChat('.slot-a', { mode: 'light' }).then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(iframeRef?.dataset.wealthReady).toBeUndefined();
    expect(resolved).toBe(false);

    await renderPromise;

    expect(iframeRef?.dataset.wealthReady).toBe('true');
    expect(resolved).toBe(true);
  });

  test('opens a requested stream inside an existing collaboration iframe without re-rendering', async () => {
    const service = new SymphonySdkService();
    const renderMock = createRenderMock();
    const openStreamMock = createOpenStreamMock();
    const updateSettingsMock = jest.fn();
    const updateThemeMock = jest.fn();

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: openStreamMock,
      updateSettings: updateSettingsMock,
      updateTheme: updateThemeMock,
    } as any;

    await service.init('corporate.symphony.com');
    await service.renderChat('.slot-a', { mode: 'light' });

    await service.openStream('stream-1', '.slot-a', {
      mode: 'light',
      condensed: false,
      showMembers: false,
      theme: { primary: '#55b7ff' },
    });

    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(openStreamMock).toHaveBeenCalledWith('stream-1', '.slot-a');
    expect(updateSettingsMock).toHaveBeenCalledWith({
      mode: 'light',
      condensed: false,
      showMembers: false,
      theme: { primary: '#55b7ff' },
    });
    expect(updateThemeMock).toHaveBeenCalledWith({ primary: '#55b7ff' });
    expect(service.getRenderedStreamId('.slot-a')).toBe('stream-1');
  });

  test('adopts a preloaded rendered iframe into the mounted live slot', async () => {
    const service = new SymphonySdkService();
    const renderMock = createRenderMock();

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: jest.fn(),
    } as any;

    await service.init('corporate.symphony.com');
    await service.renderChat('.slot-a', { mode: 'light', streamId: 'stream-1' });

    expect(service.adoptRenderedContainer('.slot-a', '.slot-b')).toBe(true);
    expect(document.querySelector('.slot-a iframe')).toBeNull();
    expect(document.querySelector('.slot-b iframe')).not.toBeNull();
    expect(service.hasRendered('.slot-a')).toBe(false);
    expect(service.getRenderedStreamId('.slot-b')).toBe('stream-1');
  });

  test('opens a requested focus stream directly into an empty container without a bootstrap render', async () => {
    const service = new SymphonySdkService();
    const renderMock = createRenderMock();
    const openStreamMock = createOpenStreamMock();

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: openStreamMock,
      sendMessage: jest.fn(),
    } as any;

    await service.init('corporate.symphony.com');
    await service.openStream('stream-1', '.slot-a', { mode: 'light' });

    expect(renderMock).not.toHaveBeenCalled();
    expect(openStreamMock).toHaveBeenCalledWith('stream-1', '.slot-a');
    expect(service.getRenderedStreamId('.slot-a')).toBe('stream-1');
  });

  test('waits for the warmed collaboration iframe to reload before resolving an openStream call', async () => {
    const service = new SymphonySdkService();
    const renderMock = createRenderMock();
    let releaseFrameLoad: (() => void) | undefined;
    const openStreamMock = createOpenStreamMock({
      onOpen: (iframe) => {
        releaseFrameLoad = () => iframe.dispatchEvent(new Event('load'));
      },
    });

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: openStreamMock,
    } as any;

    await service.init('corporate.symphony.com');
    await service.renderChat('.slot-a', { mode: 'light' });

    let resolved = false;
    const openPromise = service.openStream('stream-1', '.slot-a', { mode: 'light' }).then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);

    releaseFrameLoad?.();
    await openPromise;

    expect(resolved).toBe(true);
    expect(service.getRenderedStreamId('.slot-a')).toBe('stream-1');
  });

  test('settles a warmed collaboration iframe even when Symphony keeps the switch inside the existing iframe', async () => {
    const service = new SymphonySdkService();
    const renderMock = createRenderMock();
    const openStreamMock = createOpenStreamMock({
      onOpen: () => {
        // The embed can complete a stream switch in-place without a new iframe load.
      },
    });

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: openStreamMock,
    } as any;

    await service.init('corporate.symphony.com');
    await service.renderChat('.slot-a', { mode: 'light' });
    jest.useFakeTimers();

    let resolved = false;
    const openPromise = service.openStream('stream-1', '.slot-a', { mode: 'light' }).then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    await openPromise;

    expect(openStreamMock).toHaveBeenCalledWith('stream-1', '.slot-a');
    expect(resolved).toBe(true);
    expect(service.getRenderedStreamId('.slot-a')).toBe('stream-1');
  });

  test('waits for a short cold settle before treating the first focus open as ready when no load event fires', async () => {
    const service = new SymphonySdkService();
    const openStreamMock = createOpenStreamMock({
      onOpen: () => {
        // The SDK injects the iframe immediately and finishes navigation later.
      },
    });

    (window as Window & { symphony?: unknown }).symphony = {
      render: createRenderMock(),
      openStream: openStreamMock,
      sendMessage: jest.fn(),
    } as any;

    await service.init('corporate.symphony.com');
    jest.useFakeTimers();

    let resolved = false;
    const openPromise = service.openStream('stream-1', '.slot-a', { mode: 'light' }).then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(800);
    await Promise.resolve();
    await openPromise;

    expect(openStreamMock).toHaveBeenCalledWith('stream-1', '.slot-a');
    expect(document.querySelector('.slot-a iframe')).not.toBeNull();
    expect(resolved).toBe(true);
    expect(service.getRenderedStreamId('.slot-a')).toBe('stream-1');
  });

  test('sends a message through the initialized SDK using the provided container selector', async () => {
    const service = new SymphonySdkService();
    const sendMessageMock = jest.fn(() => Promise.resolve());

    (window as Window & { symphony?: unknown }).symphony = {
      render: createRenderMock(),
      openStream: jest.fn(),
      sendMessage: sendMessageMock,
    } as any;

    await service.init('corporate.symphony.com');
    await service.sendMessage(
      {
        text: {
          'text/markdown': 'hello',
        },
      },
      {
        containerSelector: '.slot-a',
        mode: 'blast',
        streamIds: ['stream-1'],
      },
    );

    expect(sendMessageMock).toHaveBeenCalledWith(
      {
        text: {
          'text/markdown': 'hello',
        },
      },
      {
        container: '.slot-a',
        mode: 'blast',
        streamIds: ['stream-1'],
      },
    );
  });

  test('moves to error when visible-slot render fails', async () => {
    const service = new SymphonySdkService();
    const renderMock = jest.fn().mockRejectedValueOnce(new Error('render failed'));

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: jest.fn(),
    } as any;

    await service.init('corporate.symphony.com');

    await expect(service.renderChat('.slot-a', { mode: 'light' })).rejects.toThrow(
      'Unable to render Symphony chat. render failed',
    );
    expect(service.status).toBe('error');
  });

  test('does not move to error when switching an existing stream fails', async () => {
    const service = new SymphonySdkService();
    const renderMock = createRenderMock();
    const openStreamMock = jest.fn().mockRejectedValueOnce(new Error('stream failed'));

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: openStreamMock,
    } as any;

    await service.init('corporate.symphony.com');
    await service.renderChat('.slot-a', { mode: 'light' });

    await expect(service.openStream('stream-1', '.slot-a', { mode: 'light' })).rejects.toThrow(
      'Unable to open Symphony stream. stream failed',
    );

    expect(service.status).toBe('ready');
    expect(service.getRenderedStreamId('.slot-a')).toBeUndefined();
  });

  test('does not reset the SDK when no error state is active', async () => {
    const service = new SymphonySdkService();
    const renderMock = createRenderMock();

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: jest.fn(),
    } as any;

    await service.init('corporate.symphony.com');

    expect(service.resetIfError()).toBe(false);
    expect(service.status).toBe('ready');
  });

  test('can recover from a transient render failure after resetting the error state', async () => {
    const service = new SymphonySdkService();
    const renderMock = jest.fn()
      .mockRejectedValueOnce(new Error('render failed'))
      .mockImplementation(createRenderMock());

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: jest.fn(),
    } as any;

    await service.init('corporate.symphony.com');

    await expect(service.renderChat('.slot-a', { mode: 'light' })).rejects.toThrow(
      'Unable to render Symphony chat. render failed',
    );

    expect(service.status).toBe('error');
    expect(service.resetIfError()).toBe(true);
    expect(service.status).toBe('idle');
    expect((document.querySelector('.slot-a') as HTMLDivElement).children).toHaveLength(0);

    await service.init('corporate.symphony.com');
    await service.renderChat('.slot-a', { mode: 'light' });

    expect(renderMock).toHaveBeenCalledTimes(2);
    expect(service.status).toBe('ready');
  });
});
