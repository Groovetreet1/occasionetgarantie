import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiSmartphone, FiDollarSign, FiShield, FiUsers, FiCheckCircle, FiArrowRight, FiCamera, FiLock, FiSend, FiStar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function SellPage() {
  const { user, refreshUser } = useAuth();
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
      setMsg({ type: 'error', text: err.response?.data?.message || 'Erreur.' });
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
      setMsg({ type: 'success', text: data.message });
      await refreshUser();
      setStep('done');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Code incorrect.' });
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
            <h1>Vendez votre téléphone <span className="gradient-text">en toute simplicité</span></h1>
            <p>Créez votre compte vendeur, publiez vos annonces et trouvez des acheteurs rapidement. Zero commission.</p>
            {!user ? (
              <Link to="/signup?role=seller" className="btn btn-primary btn-lg">
                Créer mon compte vendeur <FiArrowRight size={18} />
              </Link>
            ) : user.role === 'seller' || user.role === 'admin' ? (
              <Link to="/seller" className="btn btn-primary btn-lg">
                Mon Tableau de Bord <FiArrowRight size={18} />
              </Link>
            ) : step === 'done' ? (
              <Link to="/seller" className="btn btn-primary btn-lg">
                Mon Tableau de Bord <FiArrowRight size={18} />
              </Link>
            ) : step === 'verify' ? (
              <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'left', background: 'var(--bg-card)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <FiLock size={28} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: 16, marginTop: 8 }}>Verification</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Un code a ete envoye par SMS a votre numero.</p>
                </div>
                {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 12 }}>{msg.text}</div>}
                <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label>Nom de la boutique (optionnel)</label>
                    <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Votre boutique" />
                  </div>
                  <div className="form-group">
                    <label>Code de verification</label>
                    <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }} />
                  </div>
                  <button type="submit" className="form-submit" disabled={loading || code.length < 6} style={{ justifyContent: 'center' }}>
                    {loading ? 'Verification...' : 'Activer mon compte vendeur'}
                  </button>
                </form>
                <button type="button" className="btn btn-ghost" onClick={handleSendCode} disabled={loading} style={{ width: '100%', marginTop: 8, justifyContent: 'center', fontSize: 13 }}>
                  Renvoyer le code
                </button>
              </div>
            ) : (
              <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center', background: 'var(--bg-card)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <FiStar size={32} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: 16, marginTop: 12 }}>Devenir vendeur</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '8px 0 16px' }}>Verifiez votre identite par SMS pour activer votre compte vendeur.</p>
                {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 12 }}>{msg.text}</div>}
                <button className="form-submit" onClick={handleSendCode} disabled={loading} style={{ justifyContent: 'center', width: '100%' }}>
                  {loading ? 'Envoi...' : <><FiSend size={16} /> Envoyer le code</>}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <motion.section className="section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <h2 className="section-title text-center">Comment ça marche ?</h2>
          <p className="section-subtitle text-center">Vendez votre téléphone en 3 étapes</p>
          <motion.div className="steps-grid" variants={stagger}>
            {[
              { step: '1', icon: FiUsers, title: 'Créez votre compte', desc: 'Inscrivez-vous en tant que vendeur. C\'est gratuit et sans engagement.' },
              { step: '2', icon: FiCamera, title: 'Publiez votre annonce', desc: 'Ajoutez photos, description et prix de vente de votre téléphone.' },
              { step: '3', icon: FiDollarSign, title: 'Vendez et encaissez', desc: 'Un acheteur réserve votre produit, vous confirmez et la vente est faite.' },
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
          <h2 className="section-title text-center">Pourquoi vendre chez nous ?</h2>
          <motion.div className="benefits-grid" variants={stagger}>
            {[
              { icon: FiTrendingUp, title: 'Gratuit', desc: 'Pas de frais d\'inscription ni de commission. Vous gardez 100% du prix de vente.' },
              { icon: FiShield, title: 'Paiement sécurisé', desc: 'L\'acheteur verse un acompte par virement, vous êtes payé à la confirmation.' },
              { icon: FiSmartphone, title: 'Audience ciblée', desc: 'Des milliers d\'acheteurs à la recherche de téléphones d\'occasion de qualité.' },
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
          <h2>Prêt à vendre votre téléphone ?</h2>
          <p>Rejoignez notre communauté de vendeurs dès aujourd'hui.</p>
          {!user ? (
            <Link to="/signup?role=seller" className="btn btn-primary btn-lg">
              Commencer à vendre <FiArrowRight size={18} />
            </Link>
          ) : user.role === 'seller' || user.role === 'admin' ? (
            <Link to="/seller" className="btn btn-primary btn-lg">
              Aller au tableau de bord <FiArrowRight size={18} />
            </Link>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Devenir vendeur <FiArrowRight size={18} />
            </button>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}