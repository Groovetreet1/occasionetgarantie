import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { lang, toggle } = useLanguage();
  return (
    <button
      className="language-toggle"
      onClick={toggle}
      title={lang === 'fr' ? 'Switch to Arabic' : 'Passer en français'}
      aria-label="Changer de langue"
    >
      {lang === 'fr' ? <span>العربية</span> : <span>FR</span>}
    </button>
  );
}