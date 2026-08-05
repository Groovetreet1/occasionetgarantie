import { FiLock, FiAlertTriangle, FiX } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

export default function SuspendedModal({ reason, onClose }) {
  const { t } = useLanguage();
  return (
    <div className="suspended-overlay" role="dialog" aria-modal="true" aria-label={t('common.suspendedTitle')}>
      <div className="suspended-modal">
        <button className="suspended-close" onClick={onClose} aria-label={t('common.close')}><FiX size={20} /></button>
        <div className="suspended-icon">
          <FiLock size={32} />
        </div>
        <h2>{t('common.suspendedTitle')}</h2>
        <p className="suspended-reason">
          {reason || t('common.suspendedReasonDefault')}
        </p>
        <div className="suspended-note">
          <FiAlertTriangle size={16} />
          <span>
            {t('common.suspendedNote')}
          </span>
        </div>
        <p className="suspended-contact">
          Email : <strong>contact-occasionetgarantie@proton.me</strong>
        </p>
        {onClose && (
          <button className="btn btn-outline" onClick={onClose} style={{ width: '100%', justifyContent: 'center', marginTop: '18px' }}>
            {t('common.close')}
          </button>
        )}
      </div>
    </div>
  );
}
