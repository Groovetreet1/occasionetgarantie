import { Link, NavLink } from 'react-router-dom';
import { FiUser, FiLogOut, FiSettings, FiChevronDown } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMenuOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">OG</Link>

        <div className={`navbar-nav${menuOpen ? ' open' : ''}`}>
          <NavLink to="/" end onClick={closeMenu}>Accueil</NavLink>
          <NavLink to="/products" onClick={closeMenu}>Produits</NavLink>
          <div className="navbar-nav-divider" />
          <div className="navbar-mobile-only">
            <ThemeToggle />
          </div>
          {user ? (
            <div className="navbar-mobile-only">
              {user.role === 'admin' && (
                <NavLink to="/admin" onClick={closeMenu}>
                  <FiSettings size={14} /> Admin
                </NavLink>
              )}
              <button onClick={() => { logout(); closeMenu(); }} className="navbar-logout-mobile">
                <FiLogOut size={14} /> D&eacute;connexion
              </button>
            </div>
          ) : (
            <div className="navbar-mobile-only">
              <NavLink to="/login" onClick={closeMenu}>Connexion</NavLink>
              <Link to="/signup" className="navbar-signup-mobile" onClick={closeMenu}>
                S&rsquo;inscrire
              </Link>
            </div>
          )}
        </div>

        <div className="navbar-actions">
          <ThemeToggle />
          {user ? (
            <div className="navbar-dropdown" ref={dropdownRef}>
              <button className="navbar-user" onClick={() => setDropdownOpen((o) => !o)}>
                <FiUser size={16} /> <span>{user.fullName}</span> <FiChevronDown size={14} />
              </button>
              {dropdownOpen && (
                <div className="navbar-dropdown-menu">
                  {user.role === 'admin' && (
                    <NavLink to="/admin" onClick={() => setDropdownOpen(false)}>
                      <FiSettings size={14} /> Administration
                    </NavLink>
                  )}
                  <button onClick={() => { logout(); setDropdownOpen(false); }}>
                    <FiLogOut size={14} /> D&eacute;connexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-auth">
              <Link to="/login" className="navbar-login">Connexion</Link>
              <Link to="/signup" className="navbar-signup">S&rsquo;inscrire</Link>
            </div>
          )}
          <button className={`navbar-hamburger${menuOpen ? ' active' : ''}`} onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
