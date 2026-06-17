import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>Occasion & Garantie</h3>
            <p>Des produits d&rsquo;exception à prix réduits, avec une garantie qui vous protège. Achetez et vendez en toute confiance.</p>
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
            <a href="mailto:contact@occasion-garantie.fr">contact@occasion-garantie.fr</a>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
              Livraison partout à Casablanca, Maroc
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Occasion & Garantie. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
