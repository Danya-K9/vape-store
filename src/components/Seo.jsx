import { useEffect } from 'react';

const SITE = {
  name: 'Облако Пара',
  url: 'https://oblakopara.by',
  defaultImage: '/logo.png?v=6',
  locale: 'ru_BY',
};

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value, max = 160) {
  const s = stripHtml(value);
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

function toAbsUrl(pathOrUrl) {
  const v = String(pathOrUrl || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  const base = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : SITE.url;
  return `${base}${v.startsWith('/') ? v : `/${v}`}`;
}

function canonicalFromPath(pathname) {
  const base = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : SITE.url;
  const path = String(pathname || '').trim() || '/';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export default function Seo({
  title,
  description,
  canonicalPath,
  image,
  noindex = false,
  ogType = 'website',
}) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const safeTitle = title ? String(title).trim() : SITE.name;
    const safeDescription = truncate(description || '', 170);
    const canonicalUrl = canonicalFromPath(
      canonicalPath || (typeof window !== 'undefined' ? window.location?.pathname : '/')
    );
    const imageUrl = toAbsUrl(image || SITE.defaultImage);

    const upsertMeta = (attrName, attrValue, content) => {
      if (!content) return;
      let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const upsertLink = (rel, href) => {
      if (!href) return;
      let el = document.head.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    document.title = safeTitle;
    if (safeDescription) upsertMeta('name', 'description', safeDescription);
    upsertLink('canonical', canonicalUrl);

    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:site_name', SITE.name);
    upsertMeta('property', 'og:title', safeTitle);
    if (safeDescription) upsertMeta('property', 'og:description', safeDescription);
    upsertMeta('property', 'og:url', canonicalUrl);
    if (imageUrl) upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('property', 'og:locale', SITE.locale);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', safeTitle);
    if (safeDescription) upsertMeta('name', 'twitter:description', safeDescription);
    if (imageUrl) upsertMeta('name', 'twitter:image', imageUrl);

    if (noindex) upsertMeta('name', 'robots', 'noindex, nofollow');
  }, [title, description, canonicalPath, image, noindex, ogType]);

  return null;
}

