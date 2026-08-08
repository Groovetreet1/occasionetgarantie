import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiMail } from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const CIRCLES = [
  { x: '6%', y: '18%', size: 10, delay: 0, duration: 5 },
  { x: '82%', y: '14%', size: 14, delay: 1.2, duration: 6 },
  { x: '70%', y: '72%', size: 12, delay: 0.6, duration: 5.5 },
  { x: '12%', y: '78%', size: 16, delay: 1.8, duration: 6.5 },
  { x: '45%', y: '8%', size: 8, delay: 0.3, duration: 4.5 },
  { x: '90%', y: '45%', size: 9, delay: 2.2, duration: 5.8 },
  { x: '25%', y: '45%', size: 11, delay: 1.5, duration: 6.2 },
  { x: '58%', y: '88%', size: 13, delay: 0.9, duration: 5.2 },
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
        <motion.div className="newsletter-card"
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        >
          <div className="newsletter-circles" aria-hidden="true">
            {CIRCLES.map((c, i) => (
              <motion.span
                key={i}
                className="newsletter-circle"
                style={{ left: c.x, top: c.y, width: c.size, height: c.size }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 3.5], opacity: [0, 0.55, 0] }}
                transition={{ duration: c.duration, delay: c.delay, repeat: Infinity, ease: 'easeOut' }}
              />
            ))}
          </div>
          <div className="newsletter-icon"><FiMail size={32} /></div>
          <h2>{t('home.newsletterTitle')}</h2>
          <p>{t('home.newsletterSubtitle')}</p>
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <input type="email" placeholder={t('home.newsletterPlaceholder')} value={email}
              onChange={(e) => setEmail(e.target.value)} required />
            <motion.button type="submit" className="btn btn-primary"
              whileTap={{ scale: 0.95 }} disabled={sent}>
              <FiSend size={16} /> {sent ? t('home.newsletterThanks') : t('home.newsletterSubscribe')}
            </motion.button>
          </form>
          {error && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
        </motion.div>
      </div>
    </section>
  );
}
