import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiMail } from 'react-icons/fi';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
    setTimeout(() => { setSent(false); setEmail(''); }, 3000);
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
        </motion.div>
      </div>
    </section>
  );
}
