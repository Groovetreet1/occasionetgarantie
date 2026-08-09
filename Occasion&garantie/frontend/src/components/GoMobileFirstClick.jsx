import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SESSION_KEY = 'gomobile_first_click_opened';
const REDIRECT_URL = 'https://www.gomobile.ma';

export default function GoMobileFirstClick() {
  const { user, loading } = useAuth();
  const location = useLocation();
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
      window.open(REDIRECT_URL, '_blank', 'noopener,noreferrer');
    };
    document.addEventListener('click', onFirstClick, true);
    return () => document.removeEventListener('click', onFirstClick, true);
  }, []);

  return null;
}