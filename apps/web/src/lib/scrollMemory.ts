const PREFIX = 'dp-scroll:';

export function scrollKey(pathname: string, search = '') {
  return `${pathname}${search}`;
}

export function saveScroll(pathname: string, search = '', y = window.scrollY) {
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

export function restoreScroll(y: number) {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  const apply = () => window.scrollTo({ top: y, left: 0, behavior: 'auto' });
  apply();
  requestAnimationFrame(() => {
    apply();
    requestAnimationFrame(() => {
      apply();
      html.style.scrollBehavior = prev;
    });
  });
}
