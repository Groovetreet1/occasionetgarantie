import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function GoMobileTicker() {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (user?.premium) return null;

  return (
    <div className="gomobile-ticker-wrap" dir="ltr">
      <div className="gomobile-ticker">
        <div className="gomobile-ticker__item">
          🚀 {t('ad.boostSales')} <strong>GoMobile</strong>! {t('ad.solutionsList')}{' '}
          <a href="https://www.gomobile.ma" target="_blank" rel="noopener noreferrer">www.gomobile.ma</a>
        </div>
        <div className="gomobile-ticker__item">
          📱 {t('ad.darijaBoost')}
        </div>
      </div>
    </div>
  );
}