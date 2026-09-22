import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import {
  clearPendingRestore,
  peekPendingRestore,
  readScroll,
  restoreScroll,
  restoreScrollWithRetries,
  saveScroll,
} from '../lib/scrollMemory';

/** Scroll to top on push/replace; restore saved position on back navigation. */
export function ScrollToTop() {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (location.hash) return;

    const pending = peekPendingRestore(location.pathname, location.search);
    const saved = readScroll(location.pathname, location.search);
    const isCatalog = location.pathname === '/catalog' || location.pathname.startsWith('/catalog/');

    // Catalog restores after its own data load — only a light first pass here
    if (navType === 'POP' || pending != null) {
      const y = pending ?? saved;
      if (y != null && y > 0) {
        if (isCatalog) {
          restoreScroll(y);
          return;
        }
        const cancel = restoreScrollWithRetries(y);
        return () => cancel();
      }
    }

    if (navType !== 'POP') {
      clearPendingRestore();
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [location.pathname, location.search, location.hash, location.key, navType]);

  useEffect(() => {
    const { pathname, search } = location;
    let ticking = false;

    const persist = () => {
      saveScroll(pathname, search, window.scrollY);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(persist);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      saveScroll(pathname, search, window.scrollY);
    };
  }, [location.pathname, location.search]);

  return null;
}
