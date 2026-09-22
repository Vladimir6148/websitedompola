const PREFIX = 'dp-scroll:';
const PENDING_KEY = 'dp-pending-restore';

let suppressSaveUntil = 0;

export function scrollKey(pathname: string, search = '') {
  return `${pathname}${search}`;
}

export function parsePath(full: string): { pathname: string; search: string } {
  const q = full.indexOf('?');
  if (q === -1) return { pathname: full || '/', search: '' };
  return { pathname: full.slice(0, q) || '/', search: full.slice(q) };
}

export function saveScroll(pathname: string, search = '', y = window.scrollY) {
  if (Date.now() < suppressSaveUntil) return;
  try {
    sessionStorage.setItem(PREFIX + scrollKey(pathname, search), String(Math.max(0, Math.round(y))));
  } catch {
    /* private mode / quota */
  }
}

export function readScroll(pathname: string, search = ''): number | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + scrollKey(pathname, search));
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Remember that the next POP/load of this route should restore scroll. */
export function setPendingRestore(fullPath: string, y?: number) {
  const { pathname, search } = parsePath(fullPath);
  const scrollY = Math.max(0, Math.round(y ?? readScroll(pathname, search) ?? 0));
  try {
    sessionStorage.setItem(PREFIX + scrollKey(pathname, search), String(scrollY));
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ key: scrollKey(pathname, search), y: scrollY }));
  } catch {
    /* ignore */
  }
  suppressSaveUntil = Date.now() + 1200;
}

export function peekPendingRestore(pathname: string, search = ''): number | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { key: string; y: number };
    if (data.key !== scrollKey(pathname, search)) return null;
    return Number.isFinite(data.y) ? data.y : null;
  } catch {
    return null;
  }
}

export function clearPendingRestore() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function restoreScroll(y: number) {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  const apply = () => window.scrollTo({ top: y, left: 0, behavior: 'auto' });
  apply();
  requestAnimationFrame(() => {
    apply();
    html.style.scrollBehavior = prev;
  });
}

/**
 * Restore scroll a few times while layout settles.
 * Stops immediately on user scroll so we don't fight the feed.
 */
export function restoreScrollWithRetries(y: number, delays = [0, 80, 200, 450]) {
  let cancelled = false;
  const timers: number[] = [];

  const stop = () => {
    if (cancelled) return;
    cancelled = true;
    timers.forEach((t) => window.clearTimeout(t));
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchmove', stop);
    window.removeEventListener('pointerdown', stop);
    window.removeEventListener('keydown', stopOnKey);
  };

  const stopOnKey = (e: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) stop();
  };

  suppressSaveUntil = Date.now() + Math.max(...delays, 0) + 400;

  for (const ms of delays) {
    timers.push(
      window.setTimeout(() => {
        if (!cancelled) restoreScroll(y);
      }, ms),
    );
  }

  // After the last attempt, allow normal scroll saving again soon
  timers.push(
    window.setTimeout(() => {
      stop();
    }, Math.max(...delays) + 50),
  );

  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchmove', stop, { passive: true });
  window.addEventListener('pointerdown', stop, { passive: true });
  window.addEventListener('keydown', stopOnKey);

  return stop;
}
