import {
  createContext,
  forwardRef,
  useContext,
  useLayoutEffect,
  useState,
  type HTMLAttributes,
  type ImgHTMLAttributes,
} from 'react';
import { cn } from './utils';

type AvatarImageStatus = 'idle' | 'loaded' | 'error';

const AvatarImageContext = createContext<{
  status: AvatarImageStatus;
  setStatus: (status: AvatarImageStatus) => void;
} | null>(null);

export const Avatar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Avatar(
  { className, ...props },
  ref,
) {
  const [status, setStatus] = useState<AvatarImageStatus>('idle');

  return (
    <AvatarImageContext.Provider value={{ status, setStatus }}>
      <div ref={ref} className={cn('relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full', className)} {...props} />
    </AvatarImageContext.Provider>
  );
});

export const AvatarFallback = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function AvatarFallback(
  { className, ...props },
  ref,
) {
  const imageContext = useContext(AvatarImageContext);

  if (imageContext?.status === 'loaded') {
    return null;
  }

  return <div ref={ref} className={cn('flex h-full w-full items-center justify-center rounded-full bg-slate-100', className)} {...props} />;
});

export const AvatarImage = forwardRef<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>>(function AvatarImage(
  { className, alt = '', onError, onLoad, src, ...props },
  ref,
) {
  const imageContext = useContext(AvatarImageContext);
  const setImageStatus = imageContext?.setStatus;

  useLayoutEffect(() => {
    setImageStatus?.('idle');
  }, [setImageStatus, src]);

  return (
    <img
      ref={ref}
      alt={alt}
      src={src}
      className={cn('h-full w-full object-cover', className)}
      onLoad={(event) => {
        setImageStatus?.('loaded');
        onLoad?.(event);
      }}
      onError={(event) => {
        setImageStatus?.('error');
        onError?.(event);
      }}
      {...props}
    />
  );
});