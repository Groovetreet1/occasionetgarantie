import { useEffect } from 'react';

const SITE_URL = 'https://www.occasionetgarantie.store';

const absUrl = (u) => {
  if (!u) return SITE_URL;
  return /^https?:\/\//i.test(u) ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
};

export default function usePageMeta({ title, description, keywords, image, canonical, noindex, jsonLd }) {
  const ldKey = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const setMeta = (attr, key, value) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!value) {
        if (el) el.remove();
        return;
      }
      if (!el) {
        const node = document.createElement('meta');
        node.setAttribute(attr, key);
        document.head.appendChild(node);
        el = node;
      }
      el.setAttribute('content', value);
    };

    const url = canonical || `${SITE_URL}${window.location.pathname}${window.location.search}`;

    if (title) document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'keywords', keywords);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setMeta('property', 'og:site_name', 'Occasion & Garantie');
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image ? absUrl(image) : undefined);
    setMeta('property', 'og:locale', 'fr_MA');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image ? absUrl(image) : undefined);

    let canonicalEl = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = url;

    const ldId = 'seo-jsonld';
    let ldEl = document.getElementById(ldId);
    if (ldKey) {
      if (!ldEl) {
        ldEl = document.createElement('script');
        ldEl.type = 'application/ld+json';
        ldEl.id = ldId;
        document.head.appendChild(ldEl);
      }
      ldEl.textContent = ldKey;
    } else if (ldEl) {
      ldEl.remove();
    }
  }, [title, description, keywords, image, canonical, noindex, ldKey]);
}

export const formatDh = (n) => `${new Intl.NumberFormat('fr-FR').format(Number(n) || 0)} DH`;
