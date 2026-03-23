const SDK_SCRIPT_ID = 'symphony-ecm-sdk';
const SDK_ONLOAD_CALLBACK = '__wealthManagementRenderEcp';
const DEFAULT_PARTNER_ID = 'symphony_internal_BYC-XXX';
const DEFAULT_SDK_PATH = '/embed/sdk.js';

export type SymphonySdkStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface SymphonyStatusSnapshot {
  status: SymphonySdkStatus;
  error: Error | null;
  isReady: boolean;
}

type StatusListener = (snapshot: SymphonyStatusSnapshot) => void;

type RenderedContainerState = {
  streamId?: string;
};

type InflightOperation = {
  key: string;
  promise: Promise<void>;
};

type FrameWaitHandle = {
  promise: Promise<void>;
  cancel: () => void;
};

const FRAME_READY_TIMEOUT_MS = 15000;

declare global {
  interface Window {
    symphony?: {
      render: (container: string, options: Record<string, unknown>) => Promise<unknown>;
      openStream: (streamId: string, containerSelector: string) => Promise<unknown> | unknown;
      listen?: (config: {
        type: string;
        params?: Record<string, unknown>;
        callback: (notification: Record<string, unknown>) => void;
      }) => void;
      updateSettings?: (settings: Record<string, unknown>) => void;
      updateTheme?: (theme: Record<string, unknown>) => void;
    };
    __wealthManagementRenderEcp?: () => void;
  }
}

export class SymphonySdkService {
  private _status: SymphonySdkStatus = 'idle';
  private _error: Error | null = null;
  private _listeners = new Set<StatusListener>();
  private _initPromise: Promise<void> | null = null;
  private _renderedContainers = new Map<string, RenderedContainerState>();
  private _inflightOperations = new Map<string, InflightOperation>();

  private _clearTrackedContainers() {
    const trackedSelectors = new Set<string>();

    this._renderedContainers.forEach((_, containerSelector) => {
      trackedSelectors.add(containerSelector);
    });

    this._inflightOperations.forEach((_, containerSelector) => {
      trackedSelectors.add(containerSelector);
    });

    trackedSelectors.forEach((containerSelector) => {
      const container = this._getContainer(containerSelector);
      if (container) {
        container.innerHTML = '';
      }
    });
  }

  private _resetState() {
    this._initPromise = null;
    this._clearTrackedContainers();
    this._renderedContainers.clear();
    this._inflightOperations.clear();

    if (!window.symphony) {
      const script = document.getElementById(SDK_SCRIPT_ID);
      script?.remove();
    }

    delete window[SDK_ONLOAD_CALLBACK];
    this._setStatus('idle');
  }

  private _emitStatus() {
    const snapshot = this.snapshot;
    this._listeners.forEach((listener) => listener(snapshot));
  }

  private _setStatus(status: SymphonySdkStatus, error: Error | null = null) {
    this._status = status;
    this._error = error;
    this._emitStatus();
  }

  private _createError(message: string, cause?: unknown) {
    const detail =
      cause instanceof Error
        ? cause.message
        : typeof cause === 'string'
          ? cause
          : undefined;

    return new Error(detail ? `${message} ${detail}` : message);
  }

  private _getContainer(containerSelector: string) {
    return document.querySelector(containerSelector) as HTMLElement | null;
  }

  private _getRenderTarget(containerSelector: string) {
    if (!containerSelector.startsWith('.')) {
      throw this._createError(`Symphony slot "${containerSelector}" must be a class selector.`);
    }

    return containerSelector.slice(1);
  }

  private _trackInflight(containerSelector: string, key: string, promise: Promise<void>) {
    const trackedPromise = promise.finally(() => {
      const inflight = this._inflightOperations.get(containerSelector);
      if (inflight?.promise === trackedPromise) {
        this._inflightOperations.delete(containerSelector);
      }
    });

    this._inflightOperations.set(containerSelector, { key, promise: trackedPromise });
    return trackedPromise;
  }

  private _waitForNextPaint() {
    return new Promise<void>((resolve) => {
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => resolve());
        return;
      }

      window.setTimeout(resolve, 0);
    });
  }

  private _getFrameSrc(frame: HTMLIFrameElement) {
    return frame.getAttribute('src') ?? frame.src ?? '';
  }

  private _hasMeaningfulFrameSrc(frame: HTMLIFrameElement) {
    const frameSrc = this._getFrameSrc(frame).trim().toLowerCase();
    return Boolean(frameSrc) && frameSrc !== 'about:blank' && frameSrc !== 'about:srcdoc';
  }

  private _isFrameReady(frame: HTMLIFrameElement) {
    if (!this._hasMeaningfulFrameSrc(frame)) {
      return false;
    }

    if (frame.dataset.wealthReady === 'true') {
      return true;
    }

    try {
      return frame.contentDocument?.readyState === 'complete';
    } catch {
      return false;
    }
  }

  private _observeRenderedFrame(containerSelector: string): FrameWaitHandle {
    const container = this._getContainer(containerSelector);
    if (!container) {
      return {
        promise: Promise.reject(this._createError(`Missing Symphony slot "${containerSelector}".`)),
        cancel: () => {},
      };
    }

    let settled = false;
    let timeoutId: number | null = null;
    let observer: MutationObserver | null = null;
    let currentFrame: HTMLIFrameElement | null = null;
    let cleanup = () => {};
    let handleFrameLoad = () => {};

    const promise = new Promise<void>((resolve, reject) => {
      cleanup = () => {
        observer?.disconnect();
        observer = null;
        if (currentFrame) {
          currentFrame.removeEventListener('load', handleFrameLoad);
        }
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const settle = () => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        void this._waitForNextPaint().then(resolve);
      };

      const fail = (message: string) => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        reject(this._createError(message));
      };

      handleFrameLoad = () => {
        if (currentFrame && this._hasMeaningfulFrameSrc(currentFrame)) {
          currentFrame.dataset.wealthReady = 'true';
          settle();
        }
      };

      const watchFrame = (frame: HTMLIFrameElement) => {
        if (currentFrame !== frame) {
          if (currentFrame) {
            currentFrame.removeEventListener('load', handleFrameLoad);
          }
          currentFrame = frame;
          currentFrame.addEventListener('load', handleFrameLoad);
        }

        if (this._isFrameReady(frame)) {
          settle();
        }
      };

      const syncFrame = () => {
        const frame = container.querySelector('iframe') as HTMLIFrameElement | null;
        if (!frame) {
          return;
        }

        watchFrame(frame);
      };

      observer = new MutationObserver(syncFrame);
      observer.observe(container, { childList: true, subtree: true });
      syncFrame();

      timeoutId = window.setTimeout(() => {
        fail(`Timed out waiting for Symphony chat to render in "${containerSelector}".`);
      }, FRAME_READY_TIMEOUT_MS);
    });

    return {
      promise,
      cancel: () => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
      },
    };
  }

  init(ecpOrigin: string, partnerId?: string): Promise<void> {
    if (this._status === 'ready') {
      return Promise.resolve();
    }

    if (this._initPromise) {
      return this._initPromise;
    }

    this._setStatus('loading');

    this._initPromise = new Promise<void>((resolve, reject) => {
      let completed = false;

      const complete = () => {
        if (completed) {
          return;
        }

        completed = true;
        this._setStatus('ready');
        resolve();
      };

      const fail = (cause: unknown) => {
        if (completed) {
          return;
        }

        completed = true;
        const error = this._createError('Unable to initialize Symphony chat.', cause);
        this._setStatus('error', error);
        reject(error);
      };

      window[SDK_ONLOAD_CALLBACK] = complete;

      if (window.symphony) {
        complete();
        return;
      }

      const existingScript = document.getElementById(SDK_SCRIPT_ID) as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', complete, { once: true });
        existingScript.addEventListener('error', fail, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = `https://${ecpOrigin}${DEFAULT_SDK_PATH}`;
      script.id = SDK_SCRIPT_ID;
      script.setAttribute('render', 'explicit');
      script.setAttribute('data-mode', 'full');
      script.setAttribute('data-onload', SDK_ONLOAD_CALLBACK);
      script.onload = complete;
      script.onerror = (event) => fail(event);

      if (partnerId) {
        script.setAttribute('data-partner-id', partnerId);
      } else if (ecpOrigin !== 'st3.dev.symphony.com') {
        script.setAttribute('data-partner-id', DEFAULT_PARTNER_ID);
      }

      document.body.appendChild(script);
    });

    return this._initPromise;
  }

  renderChat(containerSelector: string, options: Record<string, unknown>): Promise<void> {
    if (!containerSelector) {
      return Promise.resolve();
    }

    if (this._status === 'error') {
      return Promise.reject(this._error ?? this._createError('Symphony is in an error state.'));
    }

    const requestedStreamId = typeof options.streamId === 'string' ? options.streamId : undefined;
    const requestKey = `render:${requestedStreamId ?? 'workspace'}`;
    const inflight = this._inflightOperations.get(containerSelector);
    if (inflight?.key === requestKey) {
      return inflight.promise;
    }

    const run = async () => {
      const container = this._getContainer(containerSelector);
      if (!container) {
        throw this._createError(`Missing Symphony slot "${containerSelector}".`);
      }

      if (!window.symphony) {
        throw this._createError('Symphony SDK is not available on window.');
      }

      const existingRender = this._renderedContainers.get(containerSelector);
      const hasIframe = Boolean(container.querySelector('iframe'));

      if (hasIframe && existingRender?.streamId === requestedStreamId) {
        return;
      }

      container.innerHTML = '';
      const frameWaitHandle = this._observeRenderedFrame(containerSelector);

      try {
        await window.symphony.render(this._getRenderTarget(containerSelector), options);
        await frameWaitHandle.promise;
        this._renderedContainers.set(containerSelector, { streamId: requestedStreamId });
      } catch (cause) {
        frameWaitHandle.cancel();
        throw cause;
      }
    };

    const runWithErrorHandling = () =>
      run().catch((cause) => {
        const error = this._createError('Unable to render Symphony chat.', cause);
        this._setStatus('error', error);
        throw error;
      });

    const promise =
      this._status === 'ready'
        ? runWithErrorHandling()
        : !this._initPromise
          ? Promise.reject(this._createError('Symphony has not been initialized yet.'))
          : this._initPromise.then(runWithErrorHandling);

    return this._trackInflight(containerSelector, requestKey, promise);
  }

  openStream(streamId: string, containerSelector: string, renderOptions?: Record<string, unknown>): Promise<void> {
    if (!streamId || !containerSelector) {
      return Promise.resolve();
    }

    if (this._status === 'error') {
      return Promise.reject(this._error ?? this._createError('Symphony is in an error state.'));
    }

    const requestKey = `open:${streamId}`;
    const inflight = this._inflightOperations.get(containerSelector);
    if (inflight?.key === requestKey) {
      return inflight.promise;
    }

    const run = async () => {
      const container = this._getContainer(containerSelector);
      if (!container) {
        throw this._createError(`Missing Symphony slot "${containerSelector}".`);
      }

      if (!window.symphony) {
        throw this._createError('Symphony SDK is not available on window.');
      }

      const existingRender = this._renderedContainers.get(containerSelector);
      const hasIframe = Boolean(container.querySelector('iframe'));

      if (!hasIframe) {
        await this.renderChat(containerSelector, { ...(renderOptions ?? {}), streamId });
        return;
      }

      if (existingRender?.streamId === streamId) {
        return;
      }

      await Promise.resolve(window.symphony.openStream(streamId, containerSelector));
      this._renderedContainers.set(containerSelector, { streamId });
    };

    const runWithErrorHandling = () =>
      run().catch((cause) => {
        const error = this._createError('Unable to open Symphony stream.', cause);
        this._setStatus('error', error);
        throw error;
      });

    const promise =
      this._status === 'ready'
        ? runWithErrorHandling()
        : !this._initPromise
          ? Promise.reject(this._createError('Symphony has not been initialized yet.'))
          : this._initPromise.then(runWithErrorHandling);

    return this._trackInflight(containerSelector, requestKey, promise);
  }

  hasRendered(containerSelector: string) {
    return this._renderedContainers.has(containerSelector);
  }

  getRenderedStreamId(containerSelector: string) {
    return this._renderedContainers.get(containerSelector)?.streamId;
  }

  markWorkspace(containerSelector: string) {
    this._renderedContainers.set(containerSelector, { streamId: undefined });
  }

  resetIfError() {
    if (this._status !== 'error') {
      return false;
    }

    this._resetState();
    return true;
  }

  onStatusChange(listener: StatusListener): () => void {
    this._listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this._listeners.delete(listener);
    };
  }

  get snapshot(): SymphonyStatusSnapshot {
    return {
      status: this._status,
      error: this._error,
      isReady: this._status === 'ready',
    };
  }

  get status(): SymphonySdkStatus {
    return this._status;
  }

  get error(): Error | null {
    return this._error;
  }

  get isReady(): boolean {
    return this._status === 'ready';
  }
}

export const symphonySdk = new SymphonySdkService();
