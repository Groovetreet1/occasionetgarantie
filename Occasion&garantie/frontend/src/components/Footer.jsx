import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { BsInstagram, BsTiktok, BsWhatsapp } from 'react-icons/bs';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container">

        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/logo.png" alt="Occasion & Garantie" className="footer-logo-img" />
              <h3>Occasion &amp; Garantie</h3>
            </div>
            <p>{t('footer.tagline')}</p>
            <div className="footer-social">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram"><BsInstagram /></a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" title="TikTok"><BsTiktok /></a>
              <a href="https://wa.me/212669017295" target="_blank" rel="noopener noreferrer" title="WhatsApp"><BsWhatsapp /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>{t('footer.navigation')}</h4>
            <Link to="/">{t('nav.home')}</Link>
            <Link to="/products">{t('footer.allProducts')}</Link>
            <Link to="/boutique">{t('footer.officialStore')}</Link>
            <Link to="/about">{t('footer.about')}</Link>
            <Link to="/login">{t('footer.myAccount')}</Link>
          </div>

          <div className="footer-col">
            <h4>{t('footer.categories')}</h4>
            <Link to="/products?category=Smartphones">{t('footer.smartphones')}</Link>
            <Link to="/products?category=Tablettes">{t('footer.tablets')}</Link>
            <Link to="/products?category=Ordinateurs">{t('footer.computers')}</Link>
            <Link to="/products?category=Accessoires">{t('footer.accessories')}</Link>
            <Link to="/products?category=Gaming">{t('footer.gaming')}</Link>
          </div>

          <div className="footer-col">
            <h4>{t('footer.cities')}</h4>
            <Link to="/ville/casablanca">Casablanca</Link>
            <Link to="/ville/rabat">Rabat</Link>
            <Link to="/ville/marrakech">Marrakech</Link>
            <Link to="/ville/tanger">Tanger</Link>
            <Link to="/ville/fes">Fès</Link>
            <Link to="/ville/agadir">Agadir</Link>
          </div>

          <div className="footer-col">
            <h4>{t('footer.contact')}</h4>
            <a className="footer-contact" href="mailto:contact@contact.occasionetgarantie.store"><FiMail size={13} /> contact@contact.occasionetgarantie.store</a>
            <a className="footer-contact" href="tel:+212669017295"><FiPhone size={13} /> +212 669-017295</a>
            <span className="footer-contact"><FiMapPin size={13} /> {t('footer.casablanca')}</span>
            <span className="footer-contact"><FiClock size={13} /> {t('footer.hours')}</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Occasion &amp; Garantie. {t('footer.allRights')}</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">{t('footer.privacy')}</Link>
            <Link to="/legal">{t('footer.legal')}</Link>
            <Link to="/about">{t('footer.about')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
