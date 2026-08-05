import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiArrowRight, FiSmartphone, FiDollarSign, FiShield, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function PromoPopup() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('promoSeller') === '1');

  useEffect(() => {
    if (dismissed) return;
    if (user && (user.role === 'seller' || user.role === 'admin')) return;
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [user, dismissed]);

  if (!visible) return null;
  if (user && (user.role === 'seller' || user.role === 'admin')) return null;

  const handleClose = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('promoSeller', '1');
  };

  return (
    <div className="promo-overlay" onClick={handleClose}>
      <div className="promo-popup promo-seller" onClick={(e) => e.stopPropagation()}>
        <button className="promo-close" onClick={handleClose} aria-label={t('common.close')}><FiX size={20} /></button>
        <div className="promo-badge">{t('home.promoBadge')}</div>
        <div className="promo-icon"><FiSmartphone size={34} /></div>
        <h2 className="promo-title">{t('home.promoTitle')}</h2>
        <p className="promo-text">
          {t('home.promoTextBefore')}<strong>{t('home.promoFree')}</strong>{t('home.promoTextAfter')}
        </p>
        <div className="promo-features">
          <div className="promo-feature"><span className="promo-feature-icon"><FiCheckCircle size={15} /></span><span><strong>{t('home.promoSellerAccount')}</strong> {t('home.promoFree100')}</span></div>
          <div className="promo-feature"><span className="promo-feature-icon"><FiDollarSign size={15} /></span><span><strong>{t('home.promoZeroCommission')}</strong> {t('home.promoOnSales')}</span></div>
          <div className="promo-feature"><span className="promo-feature-icon"><FiShield size={15} /></span><span><strong>{t('home.promoSecureSale')}</strong> {t('home.promoSecureSaleTail')}</span></div>
        </div>
        {user ? (
          <Link to="/seller" className="btn btn-primary" onClick={handleClose} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', marginTop: '6px', fontWeight: 700 }}>
            {t('home.promoDashboard')} <FiArrowRight size={18} />
          </Link>
        ) : (
          <Link to="/signup?role=seller" className="btn btn-primary" onClick={handleClose} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', marginTop: '6px', fontWeight: 700 }}>
            {t('home.promoBecomeSeller')} <FiArrowRight size={18} />
          </Link>
        )}
        <button className="promo-skip" onClick={handleClose}>{t('home.promoLater')}</button>
      </div>
    </div>
  );
}
