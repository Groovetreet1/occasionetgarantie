import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { BsInstagram, BsTiktok, BsWhatsapp } from 'react-icons/bs';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="footer-logo-badge">O&amp;G</span>
              <h3>Occasion &amp; Garantie</h3>
            </div>
            <p>Des produits d&rsquo;exception à prix réduits. Achetez et vendez en toute confiance.</p>
            <div className="footer-social">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram"><BsInstagram /></a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" title="TikTok"><BsTiktok /></a>
              <a href="https://wa.me/212669017295" target="_blank" rel="noopener noreferrer" title="WhatsApp"><BsWhatsapp /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Navigation</h4>
            <Link to="/">Accueil</Link>
            <Link to="/products">Tous les produits</Link>
            <Link to="/boutique">Boutique officielle</Link>
            <Link to="/about">À propos</Link>
            <Link to="/login">Mon compte</Link>
          </div>

          <div className="footer-col">
            <h4>Catégories</h4>
            <Link to="/products?category=Smartphones">Smartphones</Link>
            <Link to="/products?category=Tablettes">Tablettes</Link>
            <Link to="/products?category=Ordinateurs">Ordinateurs</Link>
            <Link to="/products?category=Accessoires">Accessoires</Link>
            <Link to="/products?category=Gaming">Gaming</Link>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <a className="footer-contact" href="mailto:contact@contact.occasionetgarantie.store"><FiMail size={13} /> contact@contact.occasionetgarantie.store</a>
            <a className="footer-contact" href="tel:+212669017295"><FiPhone size={13} /> +212 669-017295</a>
            <span className="footer-contact"><FiMapPin size={13} /> Casablanca, Maroc</span>
            <span className="footer-contact"><FiClock size={13} /> Lun-Sam, 9h &ndash; 19h</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Occasion &amp; Garantie. Tous droits réservés.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Confidentialité</Link>
            <Link to="/legal">Mentions légales</Link>
            <Link to="/about">À propos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
