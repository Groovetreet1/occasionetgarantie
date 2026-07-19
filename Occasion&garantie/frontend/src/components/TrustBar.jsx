import { motion } from 'framer-motion';
import { FiShield, FiTruck, FiRefreshCw, FiHeadphones, FiStar, FiUsers } from 'react-icons/fi';

const items = [
  { icon: FiShield, label: 'Garantie 15 jours', sub: 'Produits vérifiés' },
  { icon: FiTruck, label: 'Livraison gratuite', sub: 'Casablanca 24h' },
  { icon: FiRefreshCw, label: 'Retour facile', sub: 'Satisfait ou remboursé' },
  { icon: FiHeadphones, label: 'Support WhatsApp', sub: 'Réponse sous 24h' },
];

const stats = [
  { icon: FiStar, value: '4500+', label: 'Produits vendus' },
  { icon: FiUsers, value: '2000+', label: 'Clients satisfaits' },
  { icon: FiShield, value: '98%', label: 'Avis positifs' },
];

export default function TrustBar() {
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
          {stats.map((s) => (
            <motion.div key={s.label} className="trust-stat"
              variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
            >
              <s.icon size={28} />
              <span className="trust-stat-value">{s.value}</span>
              <span className="trust-stat-label">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
