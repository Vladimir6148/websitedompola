import { useEffect } from 'react';

type SeoProps = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
};

const SITE = 'https://dompola.ru';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function Seo({ title, description, path = '/', image }: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes('ДОМПОЛА') ? title : `${title} — ДОМПОЛА`;
    const url = `${SITE}${path}`;
    const desc =
      description ||
      'Напольные покрытия в Архангельске, Северодвинске и Вологде: кварцвинил, ламинат, линолеум, керамогранит и паркет.';

    document.title = fullTitle;
    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', 'website');
    if (image) upsertMeta('property', 'og:image', image);

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
