const DEFAULT_ORIGIN = 'corporate.symphony.com';

export const ALLOWED_ORIGINS: readonly string[] = [
  'corporate.symphony.com',
  'preview.symphony.com',
  'st3.dev.symphony.com',
  'develop2.symphony.com',
];

export const validateEcpOrigin = (origin: string | null): string => {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return DEFAULT_ORIGIN;
};
