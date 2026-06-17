import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiUser, FiLogOut, FiSettings, FiMenu, FiX } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">Occasion & Garantie</Link>
        <button className="hamburger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <div className={`nav-links${menuOpen ? ' open' : ''}`}>
          <NavLink to="/" end onClick={closeMenu}>Accueil</NavLink>
          <NavLink to="/products" onClick={closeMenu}>Produits</NavLink>
          <ThemeToggle />
          <div className="mobile-divider" />
          {user ? (
            <>
              {user.role === 'admin' && (
                <NavLink to="/admin" className="admin-btn" onClick={closeMenu}>
                  <FiSettings size={14} /> Admin
                </NavLink>
              )}
              <span className="user-badge">
                <FiUser size={14} /> {user.fullName}
              </span>
              <button onClick={() => { logout(); closeMenu(); }} className="logout-btn">
                <FiLogOut size={14} /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={closeMenu}>Connexion</NavLink>
              <Link to="/signup" className="btn btn-primary" onClick={closeMenu}>
                S&rsquo;inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
