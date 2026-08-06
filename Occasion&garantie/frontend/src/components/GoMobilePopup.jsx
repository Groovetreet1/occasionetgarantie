import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const KEY_COUNT = 'gm_ad_popup_count';
const KEY_LAST = 'gm_ad_popup_last';
const MAX_POPUPS = 6;
const HOURS = 6;
const DELAY_MS = 5000;

export default function GoMobilePopup() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const wasLoggedIn = useRef(Boolean(user));

  useEffect(() => {
    if (user && !wasLoggedIn.current) {
      wasLoggedIn.current = true;
      localStorage.setItem(KEY_COUNT, '0');
      localStorage.setItem(KEY_LAST, '0');
    }
    if (!user) wasLoggedIn.current = false;
  }, [user]);

  useEffect(() => {
    if (user?.premium) return;
    if (location.pathname.startsWith('/admin')
      || location.pathname.startsWith('/messenger')
      || location.pathname === '/login'
      || location.pathname === '/signup') return;

    const now = Date.now();
    let count = parseInt(localStorage.getItem(KEY_COUNT) || '0', 10) || 0;
    let last = parseInt(localStorage.getItem(KEY_LAST) || '0', 10) || 0;

    if (count >= MAX_POPUPS && now - last < HOURS * 3600 * 1000) {
      return;
    }

    const timer = setTimeout(() => {
      count += 1;
      localStorage.setItem(KEY_COUNT, String(count));
      localStorage.setItem(KEY_LAST, String(now));
      setOpen(true);
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [location.pathname, user?.premium]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="gomobile-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="gomobile-popup-card"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="gomobile-popup-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
            <div className="gomobile-popup-brand" dir="ltr">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" fill="currentColor" />
              </svg>
              <span>GoMobile</span>
            </div>
            <h3>{t('ad.popupTitle')}</h3>
            <p>{t('ad.popupText')}</p>
            <a href="https://www.gomobile.ma" target="_blank" rel="noopener noreferrer" className="gomobile-popup-cta" onClick={() => setOpen(false)}>
              {t('ad.popupCta')} →
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}