import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FiMapPin, FiPhone, FiMail, FiClock, FiSend } from 'react-icons/fi';
import { BsInstagram, BsTiktok, BsWhatsapp } from 'react-icons/bs';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

export default function Footer() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.post('/newsletter/subscribe', { email });
      setSent(true);
      setTimeout(() => { setSent(false); setEmail(''); }, 3000);
    } catch {}
  };
  return (
    <footer className="footer">
      <div className="container">
        {/* SaasAble-inspired JoinUS bar */}
        <form className="saas-footer-join" onSubmit={handleJoin}>
          <div className="saas-footer-join-text">
            <h4>Join our newsletter</h4>
            <p>Découvrez les nouveautés, offres exclusives et conseils avant tout le monde. Pas de spam, désabonnement en un clic.</p>
          </div>
          <div className="saas-footer-join-form">
            <input type="email" placeholder="Entrez votre adresse e-mail" value={email} onChange={e => setEmail(e.target.value)} required aria-label="Email" />
            <button type="submit" aria-label="S'abonner">
              <FiSend size={16} />
            </button>
          </div>
          {sent && <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>Merci ! Vérifiez votre e-mail.</span>}
        </form>

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
