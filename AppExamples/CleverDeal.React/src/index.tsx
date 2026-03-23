import { App } from './Components/App';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from './Theme/ThemeProvider';
import CleverWealth from './Components/CleverWealth';
import ContentDistribution from './Components/ContentDistribution';
import Loading from './Components/Loading';
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom';

const WealthManagement = lazy(() => import('./Components/WealthManagement'));

const WealthManagementModuleLoading = () => (
  <div className="large-loading">
    <Loading animate={true} className="logo" />
  </div>
);

declare global {
  interface Window {
    __react_refresh_error_overlay__?: {
      handleRuntimeError?: (error: unknown) => void;
    };
  }
}

const isIgnorableResizeObserverError = (value: unknown) => {
  const message =
    typeof value === 'string'
      ? value
      : value instanceof Error
        ? value.message
        : typeof value === 'object' && value !== null && 'message' in value
          ? String((value as { message?: unknown }).message ?? '')
          : '';

  return message.startsWith('ResizeObserver loop');
};

if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  const originalOnError = window.onerror;

  window.onerror = (message, source, lineno, colno, error) => {
    if (isIgnorableResizeObserverError(error ?? message)) {
      return true;
    }

    if (typeof originalOnError === 'function') {
      return originalOnError(message, source, lineno, colno, error);
    }

    return false;
  };

  const refreshOverlay = window.__react_refresh_error_overlay__;
  if (refreshOverlay?.handleRuntimeError) {
    const originalHandleRuntimeError = refreshOverlay.handleRuntimeError.bind(refreshOverlay);
    refreshOverlay.handleRuntimeError = (error: unknown) => {
      if (isIgnorableResizeObserverError(error)) {
        return;
      }

      originalHandleRuntimeError(error);
    };
  }
}

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="wealth" element={<CleverWealth />} />
          <Route
            path="wealth-management/*"
            element={(
              <Suspense fallback={<WealthManagementModuleLoading />}>
                <WealthManagement />
              </Suspense>
            )}
          />
          <Route path="*" element={<App />} />
          <Route path="content/*" element={<ContentDistribution />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
