import { FiLogOut, FiX } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

export default function SessionExpiredModal({ onLogin, onClose }) {
  const { t } = useLanguage();
  return (
    <div className="suspended-overlay" role="dialog" aria-modal="true" aria-label={t('common.sessionExpiredTitle')}>
      <div className="suspended-modal">
        <button className="suspended-close" onClick={onClose} aria-label={t('common.close')}><FiX size={20} /></button>
        <div className="suspended-icon">
          <FiLogOut size={32} />
        </div>
        <h2>{t('common.sessionExpiredTitle')}</h2>
        <p className="suspended-reason">
          {t('common.sessionExpiredText')}
        </p>
        <button className="btn btn-primary" onClick={onLogin} style={{ width: '100%', justifyContent: 'center', marginTop: '18px' }}>
          {t('common.sessionExpiredBtn')}
        </button>
      </div>
    </div>
  );
}
