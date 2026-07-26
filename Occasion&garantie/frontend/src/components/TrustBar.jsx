import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiHeadphones, FiStar, FiUsers, FiMessageCircle } from 'react-icons/fi';
import api from '../api/axios';

const items = [
  { icon: FiMessageCircle, label: 'Avis clients', sub: 'Notez les vendeurs' },
  { icon: FiHeadphones, label: 'Support WhatsApp', sub: 'Réponse sous 24h' },
  { icon: FiStar, label: 'Satisfaction', sub: 'Clients notent les produits' },
];

export default function TrustBar() {
  const [stats, setStats] = useState({ products: 0, clients: 0, satisfaction: 98 });

  useEffect(() => {
    api.get('/stats')
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  return (
    <section className="trust-bar">
      <div className="container">
        <motion.div className="trust-bar-grid"
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          {items.map((item) => (
            <motion.div key={item.label} className="trust-bar-item"
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            >
              <div className="trust-bar-icon"><item.icon size={22} /></div>
              <div>
                <strong>{item.label}</strong>
                <span>{item.sub}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="trust-stats"
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
        >
          <motion.div className="trust-stat"
            variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
          >
            <FiStar size={28} />
            <span className="trust-stat-value">{stats.products > 0 ? stats.products.toLocaleString() + '+' : '—'}</span>
            <span className="trust-stat-label">Produits vendus</span>
          </motion.div>
          <motion.div className="trust-stat"
            variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
          >
            <FiUsers size={28} />
            <span className="trust-stat-value">{stats.clients > 0 ? stats.clients.toLocaleString() + '+' : '—'}</span>
            <span className="trust-stat-label">Clients satisfaits</span>
          </motion.div>
          <motion.div className="trust-stat"
            variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
          >
            <FiStar size={28} />
            <span className="trust-stat-value">{stats.satisfaction}%</span>
            <span className="trust-stat-label">Avis positifs</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
