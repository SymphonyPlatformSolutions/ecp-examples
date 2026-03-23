import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { refreshWealthSymphonyThemeAfterLayoutChange } from './wealthSymphonyTheme';

interface UseSharedChatPresentationTransitionOptions {
  mode: 'page' | 'drawer';
  isReady: boolean;
  isVisible: boolean;
}

interface LayoutWaitHandle {
  promise: Promise<void>;
  cancel: () => void;
}

function requestFrame(callback: FrameRequestCallback) {
  if (typeof window.requestAnimationFrame === 'function') {
    return window.requestAnimationFrame(callback);
  }

  return window.setTimeout(() => callback(Date.now()), 0);
}

function cancelFrame(frameId: number) {
  if (typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(frameId);
    return;
  }

  window.clearTimeout(frameId);
}

function waitForElementLayoutToSettle(element: HTMLElement): LayoutWaitHandle {
  let frameId: number | null = null;
  let observer: ResizeObserver | null = null;
  let cancelled = false;
  let lastMeasurement = '';

  const cleanup = () => {
    if (frameId !== null) {
      cancelFrame(frameId);
      frameId = null;
    }

    observer?.disconnect();
    observer = null;
  };

  const measure = () => {
    const { width, height } = element.getBoundingClientRect();
    return `${Math.round(width)}x${Math.round(height)}`;
  };

  const promise = new Promise<void>((resolve) => {
    const tick = () => {
      if (cancelled) {
        return;
      }

      const currentMeasurement = measure();
      if (currentMeasurement === lastMeasurement) {
        cleanup();
        resolve();
        return;
      }

      lastMeasurement = currentMeasurement;
      frameId = requestFrame(tick);
    };

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        lastMeasurement = '';
        if (frameId !== null) {
          cancelFrame(frameId);
        }
        frameId = requestFrame(tick);
      });
      observer.observe(element);
    }

    frameId = requestFrame(tick);
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      cleanup();
    },
  };
}

export function useSharedChatPresentationTransition({
  mode,
  isReady,
  isVisible,
}: UseSharedChatPresentationTransitionOptions) {
  const shellRef = useRef<HTMLDivElement>(null);
  const previousModeRef = useRef(mode);
  const previousVisibleRef = useRef(isVisible);
  const hasReadyRef = useRef(false);
  const [maskFrame, setMaskFrame] = useState(false);

  useLayoutEffect(() => {
    if (!isReady) {
      return;
    }

    if (!hasReadyRef.current) {
      hasReadyRef.current = true;
      previousModeRef.current = mode;
      previousVisibleRef.current = isVisible;
      setMaskFrame(false);
      return;
    }

    if (previousModeRef.current === mode) {
      return;
    }

    previousModeRef.current = mode;
    setMaskFrame(true);
  }, [isReady, isVisible, mode]);

  useLayoutEffect(() => {
    if (!isReady || !hasReadyRef.current) {
      return;
    }

    if (previousVisibleRef.current === isVisible) {
      return;
    }

    previousVisibleRef.current = isVisible;
    if (isVisible && mode === 'page') {
      setMaskFrame(true);
    }
  }, [isReady, isVisible, mode]);

  useEffect(() => {
    if (!isReady || !isVisible) {
      return;
    }

    let frameId: number | null = null;

    const requestMaskedRefresh = () => {
      if (frameId !== null) {
        cancelFrame(frameId);
      }

      frameId = requestFrame(() => {
        setMaskFrame((current) => (current ? current : true));
      });
    };

    const viewport = window.visualViewport;
    window.addEventListener('resize', requestMaskedRefresh);
    window.addEventListener('orientationchange', requestMaskedRefresh);
    viewport?.addEventListener('resize', requestMaskedRefresh);

    return () => {
      if (frameId !== null) {
        cancelFrame(frameId);
      }
      window.removeEventListener('resize', requestMaskedRefresh);
      window.removeEventListener('orientationchange', requestMaskedRefresh);
      viewport?.removeEventListener('resize', requestMaskedRefresh);
    };
  }, [isReady, isVisible]);

  useEffect(() => {
    if (!isReady || !isVisible || !maskFrame) {
      return;
    }

    const shell = shellRef.current;
    if (!shell) {
      setMaskFrame(false);
      return;
    }

    let cancelled = false;
    const waitHandle = waitForElementLayoutToSettle(shell);

    void waitHandle.promise
      .then(() => refreshWealthSymphonyThemeAfterLayoutChange())
      .finally(() => {
        if (!cancelled) {
          setMaskFrame(false);
        }
      });

    return () => {
      cancelled = true;
      waitHandle.cancel();
    };
  }, [isReady, isVisible, maskFrame, mode]);

  return {
    shellRef,
    maskFrame,
  };
}
