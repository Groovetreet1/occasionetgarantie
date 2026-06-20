import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { BsInstagram, BsFacebook, BsWhatsapp } from 'react-icons/bs';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>{t('Occasion & Garantie')}</h3>
            <p>{t("Des produits d'exception à prix réduits, avec une garantie qui vous protège. Achetez en toute confiance.")}</p>
            <div className="footer-social">
              <a href="https://www.instagram.com/occasionetgarentie/" target="_blank" rel="noopener noreferrer" title="Instagram"><BsInstagram /></a>
              <a href="https://www.facebook.com/abidal.kawtarix.dasilva.april1" target="_blank" rel="noopener noreferrer" title="Facebook"><BsFacebook /></a>
              <a href="https://wa.me/212669017295" target="_blank" rel="noopener noreferrer" title="WhatsApp"><BsWhatsapp /></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>{t('Liens rapides')}</h4>
            <Link to="/">{t('Accueil')}</Link>
            <Link to="/products">{t('Produits')}</Link>
          </div>
          <div className="footer-col">
            <h4>{t('Mon compte')}</h4>
            <Link to="/login">{t('Connexion')}</Link>
            <Link to="/signup">{t('Inscription')}</Link>
          </div>
          <div className="footer-col">
            <h4>{t('Contactez-nous')}</h4>
            <a href="mailto:contact@occasion-garantie.fr"><FiMail size={12} /> contact@occasion-garantie.fr</a>
            <a href="tel:+212669017295"><FiPhone size={12} /> +212 669-017295</a>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiMapPin size={12} /> Casablanca, Maroc
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiClock size={12} /> {t('Lun-Sam 9h-19h')}
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} {t('Occasion & Garantie')}. {t('Tous droits réservés.')}
        </div>
      </div>
    </footer>
  );
}
