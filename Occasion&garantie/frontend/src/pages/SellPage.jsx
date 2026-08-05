import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiSmartphone, FiDollarSign, FiShield, FiUsers, FiCheckCircle, FiArrowRight, FiCamera, FiLock, FiSend, FiStar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function SellPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState('info');
  const [code, setCode] = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSendCode = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const { data } = await api.post('/auth/upgrade-seller');
      setMsg({ type: 'success', text: data.message });
      setStep('verify');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || t('seller.errorGeneric') });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;
    setLoading(true);
    setMsg(null);
    try {
      const { data } = await api.post('/auth/verify-upgrade', { code, storeName: storeName || undefined });
      if (data.token) localStorage.setItem('token', data.token);
      setMsg({ type: 'success', text: data.message });
      await refreshUser();
      setStep('done');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || t('seller.errorWrongCode') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="show" className="sell-page">
      {/* Hero */}
      <section className="sell-hero">
        <div className="container">
          <motion.div className="sell-hero-content" variants={fadeUp}>
            <h1>{t('seller.sellHeroTitle')} <span className="gradient-text">{t('seller.sellHeroHighlight')}</span></h1>
            <p>{t('seller.sellHeroSubtitle')}</p>
            {!user ? (
              <Link to="/signup?role=seller" className="btn btn-primary btn-lg">
                {t('seller.createSellerAccount')} <FiArrowRight size={18} />
              </Link>
            ) : user.role === 'seller' || user.role === 'admin' ? (
              <Link to="/seller" className="btn btn-primary btn-lg">
                {t('seller.myDashboard')} <FiArrowRight size={18} />
              </Link>
            ) : step === 'done' ? (
              <Link to="/seller" className="btn btn-primary btn-lg">
                {t('seller.myDashboard')} <FiArrowRight size={18} />
              </Link>
            ) : step === 'verify' ? (
              <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'left', background: 'var(--bg-card)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <FiLock size={28} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: 16, marginTop: 8 }}>{t('seller.verification')}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('seller.verificationSmsSent')}</p>
                </div>
                {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 12 }}>{msg.text}</div>}
                <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label>{t('seller.storeNameOptional')}</label>
                    <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder={t('seller.storeNamePlaceholder')} />
                  </div>
                  <div className="form-group">
                    <label>{t('seller.verificationCode')}</label>
                    <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }} />
                  </div>
                  <button type="submit" className="form-submit" disabled={loading || code.length < 6} style={{ justifyContent: 'center' }}>
                    {loading ? t('seller.verifying') : t('seller.activateSellerAccount')}
                  </button>
                </form>
                <button type="button" className="btn btn-ghost" onClick={handleSendCode} disabled={loading} style={{ width: '100%', marginTop: 8, justifyContent: 'center', fontSize: 13 }}>
                  {t('seller.resendCode')}
                </button>
              </div>
            ) : (
              <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center', background: 'var(--bg-card)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <FiStar size={32} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: 16, marginTop: 12 }}>{t('seller.becomeSeller')}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '8px 0 16px' }}>{t('seller.verifySmsToActivate')}</p>
                {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 12 }}>{msg.text}</div>}
                <button className="form-submit" onClick={handleSendCode} disabled={loading} style={{ justifyContent: 'center', width: '100%' }}>
                  {loading ? t('seller.sending') : <><FiSend size={16} /> {t('seller.sendCode')}</>}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <motion.section className="section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <h2 className="section-title text-center">{t('seller.howItWorks')}</h2>
          <p className="section-subtitle text-center">{t('seller.sellIn3Steps')}</p>
          <motion.div className="steps-grid" variants={stagger}>
            {[
              { step: '1', icon: FiUsers, title: t('seller.step1Title'), desc: t('seller.step1Desc') },
              { step: '2', icon: FiCamera, title: t('seller.step2Title'), desc: t('seller.step2Desc') },
              { step: '3', icon: FiDollarSign, title: t('seller.step3Title'), desc: t('seller.step3Desc') },
            ].map((s) => (
              <motion.div key={s.step} className="step-card" variants={fadeUp}>
                <div className="step-number">{s.step}</div>
                <div className="step-icon"><s.icon size={24} /></div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Benefits */}
      <motion.section className="section sell-benefits" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <h2 className="section-title text-center">{t('seller.whySellWithUs')}</h2>
          <motion.div className="benefits-grid" variants={stagger}>
            {[
              { icon: FiTrendingUp, title: t('seller.benefitFreeTitle'), desc: t('seller.benefitFreeDesc') },
              { icon: FiShield, title: t('seller.benefitSecurePaymentTitle'), desc: t('seller.benefitSecurePaymentDesc') },
              { icon: FiSmartphone, title: t('seller.benefitAudienceTitle'), desc: t('seller.benefitAudienceDesc') },
            ].map((b) => (
              <motion.div key={b.title} className="benefit-card" variants={fadeUp}>
                <div className="benefit-icon"><b.icon size={24} /></div>
                <div>
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section className="sell-cta" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <h2>{t('seller.readyToSell')}</h2>
          <p>{t('seller.joinCommunity')}</p>
          {!user ? (
            <Link to="/signup?role=seller" className="btn btn-primary btn-lg">
              {t('seller.startSelling')} <FiArrowRight size={18} />
            </Link>
          ) : user.role === 'seller' || user.role === 'admin' ? (
            <Link to="/seller" className="btn btn-primary btn-lg">
              {t('seller.goToDashboard')} <FiArrowRight size={18} />
            </Link>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              {t('seller.becomeSeller')} <FiArrowRight size={18} />
            </button>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}