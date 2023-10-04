interface UserIdMap extends Record<string, number> {}

export const botUserId : UserIdMap = {
  "corporate.symphony.com": 70368744179899,
  "st3.symphony.com": 9139691185433,
  "preview.symphony.com": 70368744179899,
};

export const helpMessages : Record<string, string> = {
  '/': 'trading',
  '/investments': 'trading',
  '/operations': 'ops',
  '/research': 'research',
  '/wealth': 'wealth',
};
