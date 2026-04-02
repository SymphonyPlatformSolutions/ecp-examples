import { debugWealth } from './wealthDebug';

const SDK_SCRIPT_ID = 'symphony-ecm-sdk';
const SDK_ONLOAD_CALLBACK = '__wealthManagementRenderEcp';
const DEFAULT_PARTNER_ID = 'symphony_internal_BYC-XXX';
const DEFAULT_SDK_PATH = '/embed/sdk.js';

function debugSdk(message: string, context?: Record<string, unknown>) {
  debugWealth('SymphonySdk', message, context);
}

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
  hadExistingFrame?: boolean;
};

const FRAME_READY_TIMEOUT_MS = 15000;
const COLD_STREAM_SETTLE_MS = 800;
const WARM_STREAM_SETTLE_MS = 300;

declare global {
  interface Window {
    symphony?: {
      render: (container: string, options: Record<string, unknown>) => Promise<unknown>;
      openStream: (streamId: string, containerSelector: string) => Promise<unknown> | unknown;
      sendMessage: (
        message: Record<string, unknown>,
        options: Record<string, unknown>,
      ) => Promise<unknown> | unknown;
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

  private _waitForDuration(durationMs: number) {
    return new Promise<void>((resolve) => {
      window.setTimeout(resolve, durationMs);
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
      hadExistingFrame: false,
    };
  }

  private _observeOpenedStream(containerSelector: string): FrameWaitHandle {
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
    let handleFrameLoad = () => {};

    const baselineFrame = container.querySelector('iframe') as HTMLIFrameElement | null;
    const baselineSrc = baselineFrame ? this._getFrameSrc(baselineFrame) : '';

    const cleanup = () => {
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

    const promise = new Promise<void>((resolve, reject) => {
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
        const frame = currentFrame;
        if (!frame || !this._hasMeaningfulFrameSrc(frame)) {
          return;
        }

        frame.dataset.wealthReady = 'true';
        settle();
      };

      const watchFrame = (frame: HTMLIFrameElement) => {
        if (currentFrame !== frame) {
          if (currentFrame) {
            currentFrame.removeEventListener('load', handleFrameLoad);
          }
          currentFrame = frame;
          currentFrame.addEventListener('load', handleFrameLoad);
        }

        if (!baselineFrame) {
          if (this._isFrameReady(frame)) {
            settle();
          }
          return;
        }

        delete frame.dataset.wealthReady;

        const didFrameChange = frame !== baselineFrame || this._getFrameSrc(frame) !== baselineSrc;
        if (didFrameChange && this._isFrameReady(frame)) {
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
      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src'],
      });
      syncFrame();

      timeoutId = window.setTimeout(() => {
        fail(`Timed out waiting for Symphony stream to open in "${containerSelector}".`);
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
      hadExistingFrame: Boolean(baselineFrame),
    };
  }

  init(ecpOrigin: string, partnerId?: string): Promise<void> {
    if (this._status === 'ready') {
      debugSdk('init() skipped — already ready.');
      return Promise.resolve();
    }

    if (this._initPromise) {
      debugSdk('init() skipped — already in progress.');
      return this._initPromise;
    }

    const initStart = performance.now();
    debugSdk('init() starting.', {
      ecpOrigin,
      partnerId,
      hasSymphonyOnWindow: Boolean(window.symphony),
      hasExistingScript: Boolean(document.getElementById(SDK_SCRIPT_ID)),
      currentStatus: this._status,
    });

    this._setStatus('loading');

    this._initPromise = new Promise<void>((resolve, reject) => {
      let completed = false;

      const complete = () => {
        if (completed) {
          return;
        }

        completed = true;
        debugSdk('init() ready.', { elapsedMs: Math.round(performance.now() - initStart) });
        this._setStatus('ready');
        resolve();
      };

      const fail = (cause: unknown) => {
        if (completed) {
          return;
        }

        completed = true;
        debugSdk('init() failed.', { elapsedMs: Math.round(performance.now() - initStart), cause: String(cause) });
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
      const renderStart = performance.now();
      const container = this._getContainer(containerSelector);
      if (!container) {
        throw this._createError(`Missing Symphony slot "${containerSelector}".`);
      }

      if (!window.symphony) {
        throw this._createError('Symphony SDK is not available on window.');
      }

      const existingRender = this._renderedContainers.get(containerSelector);
      const hasIframe = Boolean(container.querySelector('iframe'));

      debugSdk('renderChat() starting.', {
        containerSelector,
        streamId: requestedStreamId,
        hasExistingIframe: hasIframe,
      });

      if (hasIframe && existingRender?.streamId === requestedStreamId) {
        debugSdk('renderChat() skipped — already rendered with same stream.');
        return;
      }

      container.innerHTML = '';
      const frameWaitHandle = this._observeRenderedFrame(containerSelector);

      try {
        await window.symphony.render(this._getRenderTarget(containerSelector), options);
        await frameWaitHandle.promise;
        this._renderedContainers.set(containerSelector, { streamId: requestedStreamId });
        debugSdk('renderChat() completed.', {
          containerSelector,
          streamId: requestedStreamId,
          elapsedMs: Math.round(performance.now() - renderStart),
        });
      } catch (cause) {
        frameWaitHandle.cancel();
        debugSdk('renderChat() failed.', {
          containerSelector,
          elapsedMs: Math.round(performance.now() - renderStart),
          cause: String(cause),
        });
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
      const openStart = performance.now();
      const container = this._getContainer(containerSelector);
      if (!container) {
        throw this._createError(`Missing Symphony slot "${containerSelector}".`);
      }

      if (!window.symphony) {
        throw this._createError('Symphony SDK is not available on window.');
      }

      if (renderOptions && typeof window.symphony.updateSettings === 'function') {
        const { streamId: _ignoredStreamId, ...settings } = renderOptions;
        window.symphony.updateSettings(settings);
      }

      if (
        renderOptions &&
        typeof renderOptions.theme === 'object' &&
        renderOptions.theme !== null &&
        typeof window.symphony.updateTheme === 'function'
      ) {
        window.symphony.updateTheme(renderOptions.theme as Record<string, unknown>);
      }

      const existingRender = this._renderedContainers.get(containerSelector);
      if (existingRender?.streamId === streamId) {
        debugSdk('openStream() skipped — already showing this stream.', { streamId });
        return;
      }

      debugSdk('openStream() starting.', {
        streamId,
        containerSelector,
        hadExistingFrame: Boolean(container.querySelector('iframe')),
      });

      const frameWaitHandle = this._observeOpenedStream(containerSelector);
      const sdkOpenPromise = Promise.resolve(window.symphony.openStream(streamId, containerSelector));
      const waitForObservedOpen = frameWaitHandle.promise.then(() => sdkOpenPromise);

      let resolvedPath: 'frame-observed' | 'cold-settle-timer' | 'settle-timer' = 'frame-observed';

      try {
        if (frameWaitHandle.hadExistingFrame) {
          // Stream switches inside an existing iframe often complete without a
          // new iframe load event, so allow a short settle once the SDK call returns.
          await Promise.race([
            waitForObservedOpen,
            sdkOpenPromise.then(async () => {
              await this._waitForDuration(WARM_STREAM_SETTLE_MS);
              resolvedPath = 'settle-timer';
            }),
          ]);
        } else {
          await Promise.race([
            waitForObservedOpen,
            sdkOpenPromise.then(async () => {
              await this._waitForDuration(COLD_STREAM_SETTLE_MS);
              resolvedPath = 'cold-settle-timer';
            }),
          ]);
        }
      } catch (cause) {
        frameWaitHandle.cancel();
        debugSdk('openStream() failed.', {
          streamId,
          containerSelector,
          elapsedMs: Math.round(performance.now() - openStart),
          cause: String(cause),
        });
        throw cause;
      } finally {
        frameWaitHandle.cancel();
      }

      debugSdk('openStream() completed.', {
        streamId,
        containerSelector,
        resolvedPath,
        elapsedMs: Math.round(performance.now() - openStart),
      });

      this._renderedContainers.set(containerSelector, { streamId });
    };

    const runWithErrorHandling = () =>
      run().catch((cause) => {
        const error = this._createError('Unable to open Symphony stream.', cause);
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

  sendMessage(
    message: Record<string, unknown>,
    options: Record<string, unknown> & { containerSelector?: string },
  ): Promise<void> {
    if (this._status === 'error') {
      return Promise.reject(this._error ?? this._createError('Symphony is in an error state.'));
    }

    const run = async () => {
      if (!window.symphony?.sendMessage) {
        throw this._createError('Symphony sendMessage is not available on window.');
      }

      const { containerSelector, ...messageOptions } = options;
      await Promise.resolve(
        window.symphony.sendMessage(message, {
          ...messageOptions,
          ...(containerSelector ? { container: containerSelector } : {}),
        }),
      );
    };

    const runWithReadyCheck = () => run().catch((cause) => {
      throw this._createError('Unable to send Symphony message.', cause);
    });

    return this._status === 'ready'
      ? runWithReadyCheck()
      : !this._initPromise
        ? Promise.reject(this._createError('Symphony has not been initialized yet.'))
        : this._initPromise.then(runWithReadyCheck);
  }

  hasRendered(containerSelector: string) {
    if (!this._getContainer(containerSelector)) {
      return false;
    }

    return this._renderedContainers.has(containerSelector);
  }

  getRenderedStreamId(containerSelector: string) {
    if (!this._getContainer(containerSelector)) {
      return undefined;
    }

    return this._renderedContainers.get(containerSelector)?.streamId;
  }

  adoptRenderedContainer(sourceSelector: string, targetSelector: string) {
    if (!sourceSelector || !targetSelector || sourceSelector === targetSelector) {
      return false;
    }

    if (this._inflightOperations.has(sourceSelector) || this._inflightOperations.has(targetSelector)) {
      return false;
    }

    const sourceContainer = this._getContainer(sourceSelector);
    const targetContainer = this._getContainer(targetSelector);
    const sourceState = this._renderedContainers.get(sourceSelector);

    if (!sourceContainer || !targetContainer || !sourceState) {
      return false;
    }

    if (!sourceContainer.querySelector('iframe')) {
      return false;
    }

    targetContainer.innerHTML = '';
    while (sourceContainer.firstChild) {
      targetContainer.appendChild(sourceContainer.firstChild);
    }

    this._renderedContainers.set(targetSelector, sourceState);
    this._renderedContainers.delete(sourceSelector);
    return true;
  }

  markWorkspace(containerSelector: string) {
    this._renderedContainers.set(containerSelector, { streamId: undefined });
  }

  reset() {
    this._resetState();
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
