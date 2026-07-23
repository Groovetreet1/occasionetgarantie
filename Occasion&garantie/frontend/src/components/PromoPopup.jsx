import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTrendingUp, FiX, FiArrowRight, FiSmartphone, FiDollarSign } from 'react-icons/fi';
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
        <button className="promo-close" onClick={handleClose}><FiX size={20} /></button>
        <div className="promo-icon"><FiSmartphone size={36} /></div>
        <h2 className="promo-title">Vous vendez un téléphone ?</h2>
        <p className="promo-text">
          Publiez votre annonce <strong>gratuitement</strong> sur notre marketplace.<br />
          Zero commission, paiement sécurisé, des milliers d'acheteurs.
        </p>
        <div className="promo-features">
          <div className="promo-feature"><FiTrendingUp size={16} /> Compte vendeur gratuit</div>
          <div className="promo-feature"><FiDollarSign size={16} /> 0% commission</div>
          <div className="promo-feature"><FiSmartphone size={16} /> Téléphones uniquement</div>
        </div>
        {user ? (
          <Link to="/seller" className="btn btn-primary" onClick={handleClose} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '16px', marginTop: '8px' }}>
            Mon Tableau de Bord <FiArrowRight size={18} />
          </Link>
        ) : (
          <Link to="/signup?role=seller" className="btn btn-primary" onClick={handleClose} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '16px', marginTop: '8px' }}>
            Devenir vendeur <FiArrowRight size={18} />
          </Link>
        )}
        <p className="promo-footer" style={{ marginTop: 12 }}>Offre valable pour les vendeurs de téléphones d'occasion.</p>
      </div>
    </div>
  );
}
