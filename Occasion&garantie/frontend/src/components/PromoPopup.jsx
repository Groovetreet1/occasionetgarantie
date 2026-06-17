import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiGift, FiX, FiArrowRight } from 'react-icons/fi';

const TWO_DAYS = 2 * 24 * 60 * 60;

export default function PromoPopup() {
  const [visible, setVisible] = useState(false);
  const [remaining, setRemaining] = useState(() => {
    const saved = localStorage.getItem('promoEnd');
    if (saved) return Math.max(0, Math.floor((Number(saved) - Date.now()) / 1000));
    const end = Date.now() + TWO_DAYS * 1000;
    localStorage.setItem('promoEnd', String(end));
    return TWO_DAYS;
  });

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) return 0;
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;

  return (
    <div className="promo-overlay" onClick={() => setVisible(false)}>
      <div className="promo-popup" onClick={(e) => e.stopPropagation()}>
        <button className="promo-close" onClick={() => setVisible(false)}><FiX size={20} /></button>
        <div className="promo-icon"><FiGift size={36} /></div>
        <h2 className="promo-title">Promo Flash !</h2>
        <p className="promo-text">
          Profitez de nos <strong>produits haut de gamme</strong> à prix réduits.<br />
          Offre valable pour une durée limitée, ne manquez pas cette chance !
        </p>
        <div className="promo-timer">
          <FiClock size={18} />
          <div className="promo-timer-units">
            <div className="promo-unit">
              <span className="promo-num">{String(days).padStart(2, '0')}</span>
              <span className="promo-label">Jours</span>
            </div>
            <span className="promo-sep">:</span>
            <div className="promo-unit">
              <span className="promo-num">{String(hours).padStart(2, '0')}</span>
              <span className="promo-label">Heures</span>
            </div>
            <span className="promo-sep">:</span>
            <div className="promo-unit">
              <span className="promo-num">{String(minutes).padStart(2, '0')}</span>
              <span className="promo-label">Minutes</span>
            </div>
            <span className="promo-sep">:</span>
            <div className="promo-unit">
              <span className="promo-num">{String(secs).padStart(2, '0')}</span>
              <span className="promo-label">Secondes</span>
            </div>
          </div>
        </div>
        <p className="promo-footer">Dépêchez-vous, l'offre se termine bientôt !</p>
        <Link to="/products" className="btn btn-primary" onClick={() => setVisible(false)} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '16px', marginTop: '8px' }}>
          Voir les offres <FiArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
