import { useLocation } from 'react-router-dom';
import type { ReturnNavState } from '../components/BackButton';
import { saveScroll } from '../lib/scrollMemory';

/** Location state so «Назад» can return to the previous in-app page. */
export function useReturnLinkState(): ReturnNavState {
  const location = useLocation();
  return { from: `${location.pathname}${location.search}` };
}

/** Call before navigating to a product so scroll can be restored on return. */
export function rememberCurrentScroll(pathname: string, search: string) {
  saveScroll(pathname, search, window.scrollY);
}
