import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiSearch } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
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
          <h1>{t('profile.pageNotFound')}</h1>
          <p>{t('profile.pageNotFoundDesc')}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <Link to="/" className="btn btn-primary"><FiHome size={16} /> {t('common.home')}</Link>
          <Link to="/products" className="btn btn-outline"><FiSearch size={16} /> {t('profile.viewProducts')}</Link>
        </div>
      </motion.div>
    </section>
  );
}
