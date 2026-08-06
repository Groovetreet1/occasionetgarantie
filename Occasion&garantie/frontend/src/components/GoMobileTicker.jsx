import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function TickerItems() {
  const { t } = useLanguage();
  return (
    <>
      <div className="gomobile-ticker__item">
        🚀 {t('ad.boostSales')} <strong>GoMobile</strong>! {t('ad.solutionsList')}{' '}
        <a href="https://www.gomobile.ma" target="_blank" rel="noopener noreferrer">www.gomobile.ma</a>
      </div>
      <div className="gomobile-ticker__item">
        📱 {t('ad.darijaBoost')}
      </div>
    </>
  );
}

export default function GoMobileTicker() {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (user?.premium) return null;

  return (
    <div className="gomobile-ticker-wrap" dir="ltr">
      <div className="gomobile-ticker-brand">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" fill="currentColor" />
        </svg>
        <span>GoMobile</span>
      </div>
      <div className="gomobile-ticker-track">
        <div className="gomobile-ticker">
          <TickerItems />
          <TickerItems />
        </div>
      </div>
    </div>
  );
}