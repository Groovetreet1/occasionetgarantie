import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fr } from '../locales/fr';
import { ar } from '../locales/ar';

const LanguageContext = createContext();

function lookup(dict, key) {
  if (!key || !dict) return key;
  const parts = String(key).split('.');
  let node = dict;
  for (const p of parts) {
    if (node && typeof node === 'object' && p in node) node = node[p];
    else return key;
  }
  return typeof node === 'string' ? node : key;
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('lang');
    return saved === 'ar' ? 'ar' : 'fr';
  });

  const dict = useMemo(() => (lang === 'ar' ? ar : fr), [lang]);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
    localStorage.setItem('lang', lang);
  }, [lang, dir]);

  const t = useCallback(
    (key, params) => {
      let str = lookup(dict, key);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.split(`{{${k}}}`).join(String(v)).split(`{${k}}`).join(String(v));
        }
      }
      return str;
    },
    [dict]
  );

  const toggle = useCallback(() => setLang((l) => (l === 'fr' ? 'ar' : 'fr')), []);

  const value = useMemo(() => ({ lang, setLang, toggle, dir, t }), [lang, setLang, toggle, dir, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);