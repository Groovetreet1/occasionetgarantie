import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiArrowRight, FiSmartphone, FiDollarSign, FiShield, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function PromoPopup() {
  const { user } = useAuth();
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
        <button className="promo-close" onClick={handleClose} aria-label="Fermer"><FiX size={20} /></button>
        <div className="promo-badge">Marketplace Maroc</div>
        <div className="promo-icon"><FiSmartphone size={34} /></div>
        <h2 className="promo-title">Vous vendez un téléphone ?</h2>
        <p className="promo-text">
          Publiez votre annonce <strong>gratuitement</strong> et touchez des milliers d'acheteurs en quelques minutes.
        </p>
        <div className="promo-features">
          <div className="promo-feature"><span className="promo-feature-icon"><FiCheckCircle size={15} /></span><span><strong>Compte vendeur</strong> 100% gratuit</span></div>
          <div className="promo-feature"><span className="promo-feature-icon"><FiDollarSign size={15} /></span><span><strong>0% commission</strong> sur vos ventes</span></div>
          <div className="promo-feature"><span className="promo-feature-icon"><FiShield size={15} /></span><span><strong>Vente sécurisée</strong> &amp; garantie</span></div>
        </div>
        {user ? (
          <Link to="/seller" className="btn btn-primary" onClick={handleClose} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', marginTop: '6px', fontWeight: 700 }}>
            Mon Tableau de Bord <FiArrowRight size={18} />
          </Link>
        ) : (
          <Link to="/signup?role=seller" className="btn btn-primary" onClick={handleClose} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', marginTop: '6px', fontWeight: 700 }}>
            Devenir vendeur <FiArrowRight size={18} />
          </Link>
        )}
        <button className="promo-skip" onClick={handleClose}>Peut-être plus tard</button>
      </div>
    </div>
  );
}
