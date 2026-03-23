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

  beforeEach(() => {
    document.body.innerHTML = '<div class="slot-a"></div><div class="slot-b"></div>';
    delete (window as Window & { symphony?: unknown }).symphony;
    delete (window as Window & { __wealthManagementRenderEcp?: unknown }).__wealthManagementRenderEcp;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete (window as Window & { symphony?: unknown }).symphony;
    delete (window as Window & { __wealthManagementRenderEcp?: unknown }).__wealthManagementRenderEcp;
  });

  test('injects the SDK script once without performing a hidden bootstrap render', async () => {
    const service = new SymphonySdkService();
    const renderMock = createRenderMock();

    const firstInit = service.init('corporate.symphony.com');
    const secondInit = service.init('corporate.symphony.com');

    expect(document.querySelectorAll('#symphony-ecm-sdk')).toHaveLength(1);

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: jest.fn(),
    } as any;

    const script = document.getElementById('symphony-ecm-sdk') as HTMLScriptElement;
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
    const openStreamMock = jest.fn(() => Promise.resolve());

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: openStreamMock,
    } as any;

    await service.init('corporate.symphony.com');
    await service.renderChat('.slot-a', { mode: 'light' });

    await service.openStream('stream-1', '.slot-a', { mode: 'light' });

    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(openStreamMock).toHaveBeenCalledWith('stream-1', '.slot-a');
    expect(service.getRenderedStreamId('.slot-a')).toBe('stream-1');
  });

  test('falls back to a single render when a stream is requested before the slot has rendered', async () => {
    const service = new SymphonySdkService();
    const renderMock = createRenderMock();

    (window as Window & { symphony?: unknown }).symphony = {
      render: renderMock,
      openStream: jest.fn(),
    } as any;

    await service.init('corporate.symphony.com');
    await service.openStream('stream-1', '.slot-a', { mode: 'light' });

    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(renderMock).toHaveBeenCalledWith('slot-a', { mode: 'light', streamId: 'stream-1' });
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
