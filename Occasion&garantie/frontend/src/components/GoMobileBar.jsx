import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function GoMobileBar() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const hidden = user?.premium
    || location.pathname.startsWith('/admin')
    || location.pathname.startsWith('/messenger')
    || location.pathname === '/login'
    || location.pathname === '/signup';

  useEffect(() => {
    document.body.classList.toggle('has-adbar', !hidden);
    return () => document.body.classList.remove('has-adbar');
  }, [hidden]);

  if (hidden) return null;

  return (
    <div className="gomobile-bar">
      <a href="https://www.gomobile.ma" target="_blank" rel="noopener noreferrer" className="gomobile-bar-logo">
        <strong>GoMobile</strong>
      </a>
      <div className="gomobile-bar-msg">
        🚀 {t('ad.growSales')}
      </div>
    </div>
  );
}