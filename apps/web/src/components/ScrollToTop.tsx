import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { readScroll, restoreScroll, saveScroll } from '../lib/scrollMemory';

/** Scroll to top on push/replace; restore saved position on browser/back navigation. */
export function ScrollToTop() {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (location.hash) return;

    if (navType === 'POP') {
      const y = readScroll(location.pathname, location.search);
      if (y != null) {
        restoreScroll(y);
        const t1 = window.setTimeout(() => restoreScroll(y), 120);
        const t2 = window.setTimeout(() => restoreScroll(y), 400);
        return () => {
          window.clearTimeout(t1);
          window.clearTimeout(t2);
        };
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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
