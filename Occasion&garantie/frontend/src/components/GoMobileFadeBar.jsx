import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function GoMobileFadeBar() {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (user?.premium) return null;

  return (
    <div className="gomobile-fade-bar">
      <div className="fade-text">
        🚀 {t('ad.smsWhatsapp')} <a href="https://www.gomobile.ma" target="_blank" rel="noopener noreferrer">GoMobile.ma</a>
      </div>
      <div className="fade-text">📈 {t('ad.reachClients')}</div>
      <div className="fade-text">📞 {t('ad.voiceMessaging')}</div>
    </div>
  );
}