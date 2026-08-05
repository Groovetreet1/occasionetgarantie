import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiShield, FiCheck, FiLock, FiUpload, FiStar, FiCheckCircle, FiCopy } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const PREMIUM_AMOUNT = 50;

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
};

export default function PremiumPopup({ open, onClose }) {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState('info');
  const [paymentId, setPaymentId] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [checkingPremium, setCheckingPremium] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (open) {
      setStep('info');
      setMsg(null);
      setCheckingPremium(true);
      refreshUser().finally(() => setCheckingPremium(false));
    }
  }, [open]);

  const handleStart = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const { data } = await api.post('/premium/initiate');
      setPaymentId(data.paymentId);
      setBankInfo(data.bank);
      setStep('payment');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || t('common.errorShort') });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadScreenshot = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    const fd = new FormData();
    fd.append('screenshot', file);
    try {
      const { data } = await api.post('/premium/activate', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg({ type: 'success', text: data.message });
      setStep('done');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || t('common.errorShort') });
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="premium-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="premium-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="premium-close" onClick={onClose}><FiX size={20} /></button>

            {step === 'info' && checkingPremium ? (
              <div className="premium-content" style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '20px auto' }} />
              </div>
            ) : step === 'info' && user?.premium ? (
              <div className="premium-content">
                <div className="premium-icon-wrap premium-icon-success"><FiCheckCircle size={32} /></div>
                <h2>{t('common.alreadyPremium')}</h2>
                <p className="premium-sub">{t('common.thanksForTrust')}</p>
                <ul className="premium-benefits">
                  <li><FiCheck size={16} /> {t('common.noAds')}</li>
                  <li><FiShield size={16} /> {t('common.priorityAccess')}</li>
                  <li><FiStar size={16} /> {t('common.premiumBadge')}</li>
                </ul>
                <button className="form-submit" onClick={onClose}>{t('common.close')}</button>
              </div>
            ) : step === 'info' && (
              <div className="premium-content">
                <div className="premium-icon-wrap"><FiStar size={32} /></div>
                <h2>{t('common.goPremiumTitle')}</h2>
                <p className="premium-sub">{t('common.enjoyNoAds')}</p>

                <ul className="premium-benefits">
                  <li><FiCheck size={16} /> {t('common.noAds')}</li>
                  <li><FiShield size={16} /> {t('common.priorityAccess')}</li>
                  <li><FiStar size={16} /> {t('common.premiumBadge')}</li>
                  <li><FiLock size={16} /> {t('common.exclusiveFeatures')}</li>
                </ul>

                <div className="premium-price">
                  <span className="premium-amount">{PREMIUM_AMOUNT} DH</span>
                  <span className="premium-period">{t('common.perYear')}</span>
                </div>

                {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

                <button className="form-submit" onClick={handleStart} disabled={loading}>
                  {loading ? t('common.loading') : t('common.goPremiumWithPrice', { amount: PREMIUM_AMOUNT })}
                </button>
              </div>
            )}

            {step === 'payment' && (
              <div className="premium-content">
                <div className="premium-icon-wrap"><FiLock size={32} /></div>
                <h2>{t('common.payment')}</h2>
                <p className="premium-sub">{t('common.bankTransferOf', { amount: PREMIUM_AMOUNT })}</p>

                {bankInfo && (
                  <div className="premium-bank-info">
                    <div className="premium-bank-row">
                      <span>{t('common.bank')}</span>
                      <strong>{bankInfo.bank}</strong>
                    </div>
                    <div className="premium-bank-row">
                      <span>{t('common.holder')}</span>
                      <strong>{bankInfo.holder}</strong>
                      <button className="premium-copy-btn" onClick={async () => { await copyText(bankInfo.holder); setCopiedField('holder'); setTimeout(() => setCopiedField(null), 1500); }} title={t('common.copy')}>
                        {copiedField === 'holder' ? <FiCheck size={14} /> : <FiCopy size={14} />}
                      </button>
                    </div>
                    <div className="premium-bank-row">
                      <span>{t('common.rib')}</span>
                      <strong className="premium-rib">{bankInfo.rib}</strong>
                      <button className="premium-copy-btn" onClick={async () => { await copyText(bankInfo.rib); setCopiedField('rib'); setTimeout(() => setCopiedField(null), 1500); }} title={t('common.copy')}>
                        {copiedField === 'rib' ? <FiCheck size={14} /> : <FiCopy size={14} />}
                      </button>
                    </div>
                    <div className="premium-bank-row"><span>{t('common.amount')}</span><strong>{bankInfo.amount} DH</strong></div>
                  </div>
                )}

                <p className="premium-upload-label">{t('common.sendScreenshotAfter')}</p>

                <label className={`premium-upload-btn ${uploading ? 'loading' : ''}`}>
                  {uploading ? t('common.sending') : <><FiUpload size={16} /> {t('common.sendScreenshot')}</>}
                  <input type="file" accept="image/*" onChange={handleUploadScreenshot} hidden disabled={uploading} />
                </label>

                {msg && <div className={`alert alert-${msg.type}`} style={{ marginTop: 12 }}>{msg.text}</div>}
              </div>
            )}

            {step === 'done' && (
              <div className="premium-content">
                <div className="premium-icon-wrap premium-icon-success"><FiCheck size={32} /></div>
                <h2>{t('common.thanks')}</h2>
                <p className="premium-sub">{t('common.requestPending')}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  {t('common.adminWillConfirm')}
                </p>
                <button className="form-submit" onClick={onClose}>{t('common.ok')}</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
