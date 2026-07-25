import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiMail } from 'react-icons/fi';
import api from '../api';

export default function NewsletterSection() {
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
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
    }
  };

  return (
    <section className="newsletter-section">
      <div className="container">
        <motion.div className="newsletter-card"
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        >
          <div className="newsletter-icon"><FiMail size={32} /></div>
          <h2>Restez informé</h2>
          <p>Soyez le premier informé de nos nouvelles arrivées et offres exclusives.</p>
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <input type="email" placeholder="Votre adresse email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
            <motion.button type="submit" className="btn btn-primary"
              whileTap={{ scale: 0.95 }} disabled={sent}>
              <FiSend size={16} /> {sent ? 'Merci !' : "S'inscrire"}
            </motion.button>
          </form>
          {error && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
        </motion.div>
      </div>
    </section>
  );
}
