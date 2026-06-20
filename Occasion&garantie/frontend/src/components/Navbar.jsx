import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiLogOut, FiSettings, FiChevronDown, FiSmartphone, FiMonitor, FiHeadphones, FiTablet, FiGlobe } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const categories = [
  { name: 'Smartphones', icon: FiSmartphone, slug: 'Smartphones' },
  { name: 'Tablettes', icon: FiTablet, slug: 'Tablettes' },
  { name: 'Ordinateurs', icon: FiMonitor, slug: 'Ordinateurs' },
  { name: 'Accessoires', icon: FiHeadphones, slug: 'Accessoires' },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
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

  const toggleLang = () => {
    const next = i18n.language === 'ar' ? 'fr' : 'ar';
    i18n.changeLanguage(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

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
            <NavLink to="/" end>{t('Accueil')}</NavLink>
            <div className="navbar-prods" ref={prodsRef} onMouseEnter={() => setProdsOpen(true)} onMouseLeave={() => setProdsOpen(false)}>
              <button className={`navbar-prods-btn${isProductsActive ? ' active' : ''}`} onClick={() => setProdsOpen((o) => !o)}>
                {t('Produits')} <FiChevronDown size={12} />
              </button>
              {prodsOpen && (
                <div className="navbar-prods-menu">
                  <Link to="/products" onClick={() => setProdsOpen(false)}>{t('Tous les produits')}</Link>
                  {categories.map((cat) => {
                    const isActive = location.search === `?category=${cat.slug}`;
                    return (
                      <Link key={cat.slug} to={`/products?category=${cat.slug}`} className={isActive ? 'active' : ''} onClick={() => setProdsOpen(false)}>
                        <cat.icon size={14} /> {t(cat.name)}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            <NavLink to="/about">{t('À propos')}</NavLink>
          </div>

          <div className="navbar-actions">
            <ThemeToggle />
            <button className="navbar-lang" onClick={toggleLang} title={i18n.language === 'ar' ? 'Français' : 'العربية'} aria-label="Langue">
              <FiGlobe size={16} /> <span>{i18n.language === 'ar' ? 'FR' : 'AR'}</span>
            </button>
            {user ? (
              <div className="navbar-dropdown" ref={dropdownRef}>
                <button className="navbar-user" onClick={() => setDropdownOpen((o) => !o)}>
                  <FiUser size={16} /> <span>{user.fullName}</span> <FiChevronDown size={14} />
                </button>
                {dropdownOpen && (
                  <div className="navbar-dropdown-menu">
                    {user.role === 'admin' && (
                      <NavLink to="/admin" onClick={() => setDropdownOpen(false)}>
                        <FiSettings size={14} /> {t('Admin')}
                      </NavLink>
                    )}
                    <button onClick={() => { logout(); setDropdownOpen(false); }}>
                      <FiLogOut size={14} /> {t('Déconnexion')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="navbar-auth">
                <Link to="/login" className="navbar-login">{t('Connexion')}</Link>
                <Link to="/signup" className="navbar-signup">{t("S'inscrire")}</Link>
              </div>
            )}
            <button className={`navbar-hamburger${menuOpen ? ' active' : ''}`} onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <div className={`navbar-mobile-panel${menuOpen ? ' open' : ''}`} ref={panelRef}>
        <NavLink to="/" end onClick={closeMenu}>{t('Accueil')}</NavLink>
        <Link to="/products" onClick={closeMenu} className={location.pathname.startsWith('/products') ? 'active' : ''}>{t('Produits')}</Link>
        {categories.map((cat) => {
          const isActive = location.search === `?category=${cat.slug}`;
          return (
            <Link key={cat.slug} to={`/products?category=${cat.slug}`} onClick={closeMenu} style={{ paddingLeft: '32px', fontSize: '14px', opacity: 0.7 }} className={isActive ? 'active' : ''}>
              <cat.icon size={14} style={{ marginRight: 6 }} /> {t(cat.name)}
            </Link>
          );
        })}
        <NavLink to="/about" onClick={closeMenu}>{t('À propos')}</NavLink>
        <div className="navbar-mobile-divider" />
        {user ? (
          <>
            {user.role === 'admin' && (
              <NavLink to="/admin" onClick={closeMenu}><FiSettings size={14} /> {t('Admin')}</NavLink>
            )}
            <button onClick={() => { logout(); closeMenu(); }} className="navbar-mobile-logout">
              <FiLogOut size={14} /> {t('Déconnexion')}
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" onClick={closeMenu}>{t('Connexion')}</NavLink>
            <Link to="/signup" className="navbar-mobile-signup" onClick={closeMenu}>
              {t("S'inscrire")}
            </Link>
          </>
        )}
      </div>
    </>
  );
}
