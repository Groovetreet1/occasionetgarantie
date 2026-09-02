import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiMail, FiCheckCircle } from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const CIRCLES = [
  { x: '6%', y: '18%', size: 10, delay: 0, duration: 5 },
  { x: '82%', y: '14%', size: 14, delay: 1.2, duration: 6 },
  { x: '70%', y: '72%', size: 12, delay: 0.6, duration: 5.5 },
  { x: '12%', y: '78%', size: 16, delay: 1.8, duration: 6.5 },
  { x: '45%', y: '8%', size: 8, delay: 0.3, duration: 4.5 },
  { x: '90%', y: '45%', size: 9, delay: 2.2, duration: 5.8 },
];

export default function NewsletterSection() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.post('/newsletter/subscribe', { email });
      setSent(true);
      setError('');
      setTimeout(() => { setSent(false); setEmail(''); }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || t('home.newsletterError'));
    }
  };

  return (
    <section className="newsletter-section">
      <div className="container">
        <motion.div
          className="newsletter-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid #1e293b',
            borderRadius: 24,
            padding: '48px 32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
          }}
        >
          {/* subtle radial + dots like saas-cta */}
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.25, pointerEvents: 'none' }} />
          <div className="newsletter-circles" aria-hidden="true">
            {CIRCLES.map((c, i) => (
              <motion.span
                key={i}
                className="newsletter-circle"
                style={{ left: c.x, top: c.y, width: c.size, height: c.size, background: 'rgba(255,255,255,0.18)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 3.5], opacity: [0, 0.35, 0] }}
                transition={{ duration: c.duration, delay: c.delay, repeat: Infinity, ease: 'easeOut' }}
              />
            ))}
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.30)', color: '#fbbf24', fontSize: 11, fontWeight: 800, letterSpacing: 0.8, marginBottom: 16 }}>
              <FiMail size={12} /> NEWSLETTER
            </div>
            <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 10 }}>{t('home.newsletterTitle')}</h2>
            <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 15, marginBottom: 24, maxWidth: 560, margin: '0 auto 24px', lineHeight: 1.6 }}>{t('home.newsletterSubtitle')}</p>
            <form className="newsletter-form" onSubmit={handleSubmit} style={{ maxWidth: 460, margin: '0 auto', background: '#fff', borderRadius: 999, padding: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
              <input
                type="email"
                placeholder={t('home.newsletterPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px 18px', fontSize: 15, color: '#0f172a' }}
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                disabled={sent}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  borderRadius: 999,
                  background: '#f59e0b',
                  color: '#000',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
                }}
              >
                <FiSend size={16} /> {sent ? t('home.newsletterThanks') : t('home.newsletterSubscribe')}
              </motion.button>
            </form>
            {error && <p style={{ color: '#fca5a5', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
            {sent && <p style={{ color: '#86efac', fontSize: '13px', marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCheckCircle size={14} /> Merci ! Vérifiez votre e-mail.</p>}
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.55)', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCheckCircle size={11} /> Pas de spam</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCheckCircle size={11} /> Désabonnement 1 clic</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCheckCircle size={11} /> Offres exclusives</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
