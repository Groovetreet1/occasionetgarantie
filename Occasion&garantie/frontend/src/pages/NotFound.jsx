import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiSearch } from 'react-icons/fi';

export default function NotFound() {
  return (
    <section className="auth-page">
      <motion.div className="auth-container"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      >
        <div className="auth-header">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'var(--primary-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: 42, fontWeight: 800,
              color: 'var(--primary)',
            }}
          >
            404
          </motion.div>
          <h1>Page introuvable</h1>
          <p>La page que vous cherchez n'existe pas ou a été déplacée.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <Link to="/" className="btn btn-primary"><FiHome size={16} /> Accueil</Link>
          <Link to="/products" className="btn btn-outline"><FiSearch size={16} /> Voir les produits</Link>
        </div>
      </motion.div>
    </section>
  );
}
