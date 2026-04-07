import { useLayoutEffect, useState } from 'react';
import CleverWealth from './Components/CleverWealth';
import { symphonySdk } from './Components/WealthManagement/chat/symphonySdk';

type LegacyWealthWindow = Window & {
  renderRoom?: unknown;
  renderEcp?: unknown;
  symphony?: unknown;
};

function clearWindowProperty(key: 'renderRoom' | 'renderEcp' | 'symphony') {
  const legacyWindow = window as LegacyWealthWindow;

  try {
    delete legacyWindow[key];
  } catch {
    legacyWindow[key] = undefined;
  }
}

export function LegacyWealthRoute() {
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    clearWindowProperty('renderRoom');
    clearWindowProperty('renderEcp');
    clearWindowProperty('symphony');
    symphonySdk.reset();
    setIsReady(true);
  }, []);

  return isReady ? <CleverWealth /> : null;
}

export default LegacyWealthRoute;