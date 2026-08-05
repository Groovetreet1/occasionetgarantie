import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiTrash2, FiCheck, FiInfo, FiX } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText, confirmColor, icon }) {
  const { t } = useLanguage();
  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 32, maxWidth: 380, width: '100%', boxShadow: '0 25px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: `rgba(${confirmColor === '#dc2626' ? '239,68,68' : '99,102,241'},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {icon || <FiAlertTriangle size={26} color={confirmColor || '#dc2626'} />}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title || t('common.confirm')}</h3>
            {message && <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>{message}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px 0' }}>
                {t('common.cancel')}
              </button>
              <button onClick={onConfirm} className="form-submit" style={{ flex: 1, justifyContent: 'center', padding: '10px 0', background: confirmColor || '#dc2626', borderColor: confirmColor || '#dc2626' }}>
                {confirmText || t('common.confirm')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function AlertModal({ open, onClose, title, message, icon }) {
  const { t } = useLanguage();
  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 32, maxWidth: 380, width: '100%', boxShadow: '0 25px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {icon || <FiInfo size={26} color="#6366f1" />}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title || t('common.information')}</h3>
            {message && <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>{message}</p>}
            <button onClick={onClose} className="form-submit" style={{ width: '100%', justifyContent: 'center', padding: '10px 0' }}>
              <FiCheck size={14} /> {t('common.ok')}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
