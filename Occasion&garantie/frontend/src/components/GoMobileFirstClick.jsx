import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const SESSION_KEY = 'gomobile_first_click_shown';
const REDIRECT_URL = 'https://www.gomobile.ma';
const COUNTDOWN = 5;

export default function GoMobileFirstClick() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [seconds, setSeconds] = useState(COUNTDOWN);
  const armedRef = useRef(false);

  useEffect(() => {
    if (loading || user?.premium) {
      armedRef.current = false;
      return;
    }
    if (sessionStorage.getItem(SESSION_KEY)) {
      armedRef.current = false;
      return;
    }
    const p = location.pathname;
    if (p.startsWith('/admin')
      || p.startsWith('/messenger')
      || p === '/login'
      || p === '/signup') {
      armedRef.current = false;
      return;
    }
    armedRef.current = true;
  }, [loading, user?.premium, location.pathname]);

  useEffect(() => {
    const onFirstClick = () => {
      if (!armedRef.current) return;
      armedRef.current = false;
      sessionStorage.setItem(SESSION_KEY, '1');
      setSeconds(COUNTDOWN);
      setShow(true);
    };
    document.addEventListener('click', onFirstClick, true);
    return () => document.removeEventListener('click', onFirstClick, true);
  }, []);

  const go = () => { window.location.href = REDIRECT_URL; };

  useEffect(() => {
    if (!show) return;
    document.documentElement.style.overflow = 'hidden';
    const iv = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(iv); go(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { clearInterval(iv); document.documentElement.style.overflow = ''; };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="gomobile-firstclick"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="gomobile-firstclick-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          >
            <span className="gomobile-firstclick-sponsor">{t('ad.firstClickSponsor')}</span>
            <div className="gomobile-firstclick-brand" dir="ltr">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" fill="currentColor" />
              </svg>
              <span>GoMobile</span>
            </div>
            <p className="gomobile-firstclick-title">{t('ad.firstClickTitle')}</p>
            <p className="gomobile-firstclick-text">{t('ad.firstClickText')}</p>
            <div className="gomobile-firstclick-bar-wrap">
              <div
                className="gomobile-firstclick-bar-inner"
                style={{ animationDuration: `${COUNTDOWN}s` }}
              />
            </div>
            <button type="button" className="gomobile-firstclick-cta" onClick={go}>
              {t('ad.firstClickGo')} →
            </button>
            <div className="gomobile-firstclick-count">
              {t('ad.firstClickCount')} {seconds} {t('ad.firstClickSeconds')}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}