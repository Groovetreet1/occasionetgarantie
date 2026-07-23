import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiShield, FiCheck, FiLock, FiUpload, FiStar, FiCheckCircle } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const PREMIUM_AMOUNT = 50;

export default function PremiumPopup({ open, onClose }) {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState('info');
  const [paymentId, setPaymentId] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [checkingPremium, setCheckingPremium] = useState(false);

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
      setMsg({ type: 'error', text: err.response?.data?.message || 'Erreur.' });
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
      setMsg({ type: 'error', text: err.response?.data?.message || 'Erreur.' });
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
                <h2>Vous êtes déjà Premium</h2>
                <p className="premium-sub">Merci pour votre confiance !</p>
                <ul className="premium-benefits">
                  <li><FiCheck size={16} /> Navigation sans publicité</li>
                  <li><FiShield size={16} /> Accès prioritaire</li>
                  <li><FiStar size={16} /> Badge Premium sur votre profil</li>
                </ul>
                <button className="form-submit" onClick={onClose}>Fermer</button>
              </div>
            ) : step === 'info' && (
              <div className="premium-content">
                <div className="premium-icon-wrap"><FiStar size={32} /></div>
                <h2>Passer en Premium</h2>
                <p className="premium-sub">Profitez du site sans publicité</p>

                <ul className="premium-benefits">
                  <li><FiCheck size={16} /> Navigation sans publicit&eacute;</li>
                  <li><FiShield size={16} /> Acc&egrave;s prioritaire</li>
                  <li><FiStar size={16} /> Badge Premium sur votre profil</li>
                  <li><FiLock size={16} /> Fonctionnalit&eacute;s exclusives</li>
                </ul>

                <div className="premium-price">
                  <span className="premium-amount">{PREMIUM_AMOUNT} DH</span>
                  <span className="premium-period">/ an</span>
                </div>

                {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

                <button className="form-submit" onClick={handleStart} disabled={loading}>
                  {loading ? 'Chargement...' : `Passer Premium - ${PREMIUM_AMOUNT} DH`}
                </button>
              </div>
            )}

            {step === 'payment' && (
              <div className="premium-content">
                <div className="premium-icon-wrap"><FiLock size={32} /></div>
                <h2>Paiement</h2>
                <p className="premium-sub">Virement bancaire de {PREMIUM_AMOUNT} DH</p>

                {bankInfo && (
                  <div className="premium-bank-info">
                    <div className="premium-bank-row"><span>Banque</span><strong>{bankInfo.bank}</strong></div>
                    <div className="premium-bank-row"><span>Titulaire</span><strong>{bankInfo.holder}</strong></div>
                    <div className="premium-bank-row"><span>RIB</span><strong className="premium-rib">{bankInfo.rib}</strong></div>
                    <div className="premium-bank-row"><span>Montant</span><strong>{bankInfo.amount} DH</strong></div>
                  </div>
                )}

                <p className="premium-upload-label">Apr&egrave;s le virement, envoyez la capture d'&eacute;cran :</p>

                <label className={`premium-upload-btn ${uploading ? 'loading' : ''}`}>
                  {uploading ? 'Envoi...' : <><FiUpload size={16} /> Envoyer la capture</>}
                  <input type="file" accept="image/*" onChange={handleUploadScreenshot} hidden disabled={uploading} />
                </label>

                {msg && <div className={`alert alert-${msg.type}`} style={{ marginTop: 12 }}>{msg.text}</div>}
              </div>
            )}

            {step === 'done' && (
              <div className="premium-content">
                <div className="premium-icon-wrap premium-icon-success"><FiCheck size={32} /></div>
                <h2>Merci !</h2>
                <p className="premium-sub">Votre demande est en cours de v&eacute;rification</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  L&rsquo;administrateur va confirmer votre paiement sous 24h. Vous recevrez une notification SMS.
                </p>
                <button className="form-submit" onClick={onClose}>OK</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
