import { useEffect } from 'react';

type SeoProps = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
};

const SITE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) ||
  (typeof window !== 'undefined' ? `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}` : 'https://dompola.ru');

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function absolutize(url: string) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const origin = typeof window !== 'undefined' ? window.location.origin : SITE;
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${origin}${base}${url.replace(/^\//, '')}`;
}

export function Seo({ title, description, path = '/', image }: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes('ДОМПОЛА') ? title : `${title} — ДОМПОЛА`;
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${basePath}${cleanPath === '/' ? '/' : cleanPath}`
        : `${SITE}${cleanPath}`;
    const desc =
      description ||
      'Напольные покрытия в Архангельске, Северодвинске и Вологде: кварцвинил, ламинат, линолеум, керамогранит и паркет.';

    document.title = fullTitle;
    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', 'website');
    if (image) upsertMeta('property', 'og:image', absolutize(image));
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    if (image) upsertMeta('name', 'twitter:image', absolutize(image));

    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }, [title, description, path, image]);

  return null;
}
