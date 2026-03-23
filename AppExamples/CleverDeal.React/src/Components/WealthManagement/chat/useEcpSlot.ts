import { useEffect, useRef, useState } from 'react';
import { symphonySdk } from './symphonySdk';

interface UseEcpSlotOptions {
  slotName: string;
}

export function useEcpSlot({ slotName }: UseEcpSlotOptions) {
  const slotNameRef = useRef(slotName);
  const slotRef = useRef<HTMLDivElement>(null);
  const [ecpReady, setEcpReady] = useState(symphonySdk.isReady);
  const [ecpError, setEcpError] = useState<Error | null>(symphonySdk.error);

  useEffect(() => {
    const slotEl = slotRef.current;
    const unsubscribe = symphonySdk.onStatusChange(({ isReady, error }) => {
      setEcpReady(isReady);
      setEcpError(error);
    });

    return () => {
      unsubscribe();
      if (slotEl) {
        slotEl.innerHTML = '';
      }
    };
  }, []);

  return {
    slotClassName: slotNameRef.current,
    slotRef,
    ecpReady,
    ecpError,
    containerSelector: `.${slotNameRef.current}`,
  };
}
