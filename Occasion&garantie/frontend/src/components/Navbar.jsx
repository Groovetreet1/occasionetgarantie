import { Link, NavLink } from 'react-router-dom';
import { FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">Occasion &amp; Garantie</Link>
        <button className="hamburger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          {menuOpen ? '\u2715' : '\u2630'}
        </button>
        <div ref={menuRef} className={`nav-links${menuOpen ? ' open' : ''}`}>
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
                <FiLogOut size={14} /> D&eacute;connexion
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
