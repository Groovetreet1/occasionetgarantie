import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { BsInstagram, BsTiktok, BsWhatsapp } from 'react-icons/bs';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>Occasion & Garantie</h3>
            <p>Des produits d&rsquo;exception à prix réduits, avec une garantie qui vous protège. Achetez en toute confiance.</p>
            <div className="footer-social">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram"><BsInstagram /></a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" title="TikTok"><BsTiktok /></a>
              <a href="https://wa.me/212669017295" target="_blank" rel="noopener noreferrer" title="WhatsApp"><BsWhatsapp /></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Navigation</h4>
            <Link to="/">Accueil</Link>
            <Link to="/products">Produits</Link>
          </div>
          <div className="footer-col">
            <h4>Compte</h4>
            <Link to="/login">Connexion</Link>
            <Link to="/signup">Inscription</Link>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <a href="mailto:contact@occasion-garantie.fr"><FiMail size={12} /> contact@occasion-garantie.fr</a>
            <a href="tel:+212669017295"><FiPhone size={12} /> +212 669-017295</a>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiMapPin size={12} /> Casablanca, Maroc
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiClock size={12} /> Lun-Sam 9h-19h
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Occasion & Garantie. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
