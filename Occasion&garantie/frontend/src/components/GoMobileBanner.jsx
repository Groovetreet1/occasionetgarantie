import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const HIDE_GOMOBILE_ADS = true;
const DELAY_MS = 8000;

export default function GoMobileBanner() {
  if (HIDE_GOMOBILE_ADS) return null;
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user?.premium) return;
    if (location.pathname.startsWith('/admin')
      || location.pathname.startsWith('/messenger')
      || location.pathname === '/login'
      || location.pathname === '/signup') return;

    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [location.pathname, user?.premium]);

  const close = () => setOpen(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="gomobile-banner"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 160, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 240 }}
        >
          <button className="gomobile-banner-close" onClick={close} aria-label="Close">×</button>
          <div className="gomobile-banner-brand" dir="ltr">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" fill="currentColor" />
            </svg>
            <span>GoMobile</span>
          </div>
          <div className="gomobile-banner-body">
            <strong>{t('ad.bannerTitle')}</strong>
            <span>{t('ad.bannerText')}</span>
          </div>
          <a href="https://www.gomobile.ma" target="_blank" rel="noopener noreferrer" className="gomobile-banner-cta">
            {t('ad.popupCta')} →
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}