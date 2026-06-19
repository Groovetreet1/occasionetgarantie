import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiLogOut, FiSettings, FiChevronDown, FiSmartphone, FiMonitor, FiHeadphones, FiTablet } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const categories = [
  { name: 'Smartphones', icon: FiSmartphone, slug: 'Smartphones' },
  { name: 'Tablettes', icon: FiTablet, slug: 'Tablettes' },
  { name: 'Ordinateurs', icon: FiMonitor, slug: 'Ordinateurs' },
  { name: 'Accessoires', icon: FiHeadphones, slug: 'Accessoires' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isProductsActive = location.pathname.startsWith('/products');
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [prodsOpen, setProdsOpen] = useState(false);
  const navRef = useRef(null);
  const panelRef = useRef(null);
  const dropdownRef = useRef(null);
  const prodsRef = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (navRef.current && !navRef.current.contains(e.target) && panelRef.current && !panelRef.current.contains(e.target)) setMenuOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (prodsRef.current && !prodsRef.current.contains(e.target)) setProdsOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="navbar" ref={navRef}>
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">OG</Link>

          <div className="navbar-desktop-nav">
            <NavLink to="/" end>Accueil</NavLink>
            <div className="navbar-prods" ref={prodsRef} onMouseEnter={() => setProdsOpen(true)} onMouseLeave={() => setProdsOpen(false)}>
              <button className={`navbar-prods-btn${isProductsActive ? ' active' : ''}`} onClick={() => setProdsOpen((o) => !o)}>
                Produits <FiChevronDown size={12} />
              </button>
              {prodsOpen && (
                <div className="navbar-prods-menu">
                  <Link to="/products" onClick={() => setProdsOpen(false)}>Tous les produits</Link>
                  {categories.map((cat) => {
                    const isActive = location.search === `?category=${cat.slug}`;
                    return (
                      <Link key={cat.slug} to={`/products?category=${cat.slug}`} className={isActive ? 'active' : ''} onClick={() => setProdsOpen(false)}>
                        <cat.icon size={14} /> {cat.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            <NavLink to="/about">À propos</NavLink>
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

      <div className={`navbar-mobile-panel${menuOpen ? ' open' : ''}`} ref={panelRef}>
        <NavLink to="/" end onClick={closeMenu}>Accueil</NavLink>
        <Link to="/products" onClick={closeMenu} className={location.pathname.startsWith('/products') ? 'active' : ''}>Produits</Link>
        {categories.map((cat) => {
          const isActive = location.search === `?category=${cat.slug}`;
          return (
            <Link key={cat.slug} to={`/products?category=${cat.slug}`} onClick={closeMenu} style={{ paddingLeft: '32px', fontSize: '14px', opacity: 0.7 }} className={isActive ? 'active' : ''}>
              <cat.icon size={14} style={{ marginRight: 6 }} /> {cat.name}
            </Link>
          );
        })}
        <NavLink to="/about" onClick={closeMenu}>À propos</NavLink>
        <div className="navbar-mobile-divider" />
        {user ? (
          <>
            {user.role === 'admin' && (
              <NavLink to="/admin" onClick={closeMenu}><FiSettings size={14} /> Admin</NavLink>
            )}
            <button onClick={() => { logout(); closeMenu(); }} className="navbar-mobile-logout">
              <FiLogOut size={14} /> D&eacute;connexion
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" onClick={closeMenu}>Connexion</NavLink>
            <Link to="/signup" className="navbar-mobile-signup" onClick={closeMenu}>
              S&rsquo;inscrire
            </Link>
          </>
        )}
      </div>
    </>
  );
}
