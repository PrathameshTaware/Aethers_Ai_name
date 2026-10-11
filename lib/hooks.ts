import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/** False while prerendering and hydrating, true in the browser. For values like "today in IST". */
export function useMounted(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
