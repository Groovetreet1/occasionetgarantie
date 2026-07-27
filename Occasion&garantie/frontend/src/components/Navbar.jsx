import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiLogOut, FiSettings, FiChevronDown, FiSmartphone, FiMonitor, FiHeadphones, FiTablet, FiShoppingBag, FiTrendingUp, FiStar, FiMessageCircle, FiPackage } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import PremiumPopup from './PremiumPopup';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
  const [scrolled, setScrolled] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [mobileProdsOpen, setMobileProdsOpen] = useState(false);
  const navRef = useRef(null);
  const panelRef = useRef(null);
  const dropdownRef = useRef(null);
  const prodsRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handle = (e) => {
      if (navRef.current && !navRef.current.contains(e.target) && panelRef.current && !panelRef.current.contains(e.target)) setMenuOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (prodsRef.current && !prodsRef.current.contains(e.target)) setProdsOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const closeMenu = () => { setMenuOpen(false); setMobileProdsOpen(false); };

  return (
    <>
      <motion.nav
        className={`navbar${scrolled ? ' scrolled' : ''}`}
        ref={navRef}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo"><span>O</span>G</Link>

          <div className="navbar-desktop-nav">
            <NavLink to="/" end>Accueil</NavLink>
            <div className="navbar-prods"
              ref={prodsRef}
              onMouseEnter={() => setProdsOpen(true)}
              onMouseLeave={() => setProdsOpen(false)}
            >
              <button className={`navbar-prods-btn${isProductsActive ? ' active' : ''}`}
                onClick={() => setProdsOpen((o) => !o)}
              >
                Produits <FiChevronDown size={12} />
              </button>
              <AnimatePresence>
                {prodsOpen && (
                  <motion.div
                    className="navbar-prods-menu"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link to="/products" onClick={() => setProdsOpen(false)}>Tous les produits</Link>
                    {categories.map((cat) => {
                      const isActive = location.search === `?category=${cat.slug}`;
                      return (
                        <Link key={cat.slug} to={`/products?category=${cat.slug}`}
                          className={isActive ? 'active' : ''}
                          onClick={() => setProdsOpen(false)}
                        >
                          <cat.icon size={14} /> {cat.name}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <NavLink to="/about">À propos</NavLink>
            {user?.role == 'seller' ? (
              <NavLink to="/reprise/list" className="navbar-sell-link"><FiSmartphone size={14} /> Demandes reprise</NavLink>
            ) : user?.role == 'admin' ? null : (
              <NavLink to="/reprise" className="navbar-sell-link"><FiSmartphone size={14} /> Reprise</NavLink>
            )}
            {user?.role == 'seller' ? (
              <NavLink to="/seller" className="navbar-sell-link"><FiTrendingUp size={14} /> Vendre</NavLink>
            ) : user?.role !== 'admin' && (
              <NavLink to="/vendre" className="navbar-sell-link"><FiTrendingUp size={14} /> Vendre</NavLink>
            )}
          </div>

          <div className="navbar-actions">
            <ThemeToggle />
            {user ? (
              <div className="navbar-dropdown" ref={dropdownRef}>
                <button className="navbar-user" onClick={() => setDropdownOpen((o) => !o)}>
                  {user.avatar ? <img src={user.avatar.startsWith('http') ? user.avatar : `${API_BASE}/uploads/avatars/${user.avatar}`} alt="" className="navbar-user-avatar" /> : <FiUser size={16} />} <span>{user.fullName || user.full_name}</span> <FiChevronDown size={14} />
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      className="navbar-dropdown-menu"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <NavLink to="/profile" onClick={() => setDropdownOpen(false)}>
                        <FiUser size={14} /> Mon Profil
                      </NavLink>
                      <NavLink to="/messenger" onClick={() => setDropdownOpen(false)}>
                        <FiMessageCircle size={14} /> Messages
                      </NavLink>
                      {user.role !== 'admin' && (
                        user.premium ? (
                          <span className="navbar-premium-badge" onClick={() => setDropdownOpen(false)}>
                            <FiStar size={14} /> Premium
                          </span>
                        ) : (
                          <button onClick={() => { setDropdownOpen(false); setShowPremium(true); }} className="navbar-premium-btn">
                            <FiStar size={14} /> Passer Premium
                          </button>
                        )
                      )}
                      {(user.role === 'seller') && (
                        <NavLink to="/seller" onClick={() => setDropdownOpen(false)}>
                          <FiShoppingBag size={14} /> Tableau de Bord
                        </NavLink>
                      )}
                      {user.role === 'admin' && (
                        <NavLink to="/admin" onClick={() => setDropdownOpen(false)}>
                          <FiPackage size={14} /> Dashboard
                        </NavLink>
                      )}
                      <button onClick={() => { logout(); navigate('/'); setDropdownOpen(false); }}>
                        <FiLogOut size={14} /> Déconnexion
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div className="navbar-auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link to="/login" className="navbar-login">Connexion</Link>
                <Link to="/signup" className="navbar-signup">S'inscrire</Link>
              </motion.div>
            )}
            <button className={`navbar-hamburger${menuOpen ? ' active' : ''}`} onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </motion.nav>

      <div className={`navbar-mobile-panel${menuOpen ? ' open' : ''}`} ref={panelRef}>
        <NavLink to="/" end onClick={closeMenu}>Accueil</NavLink>
        <button onClick={() => setMobileProdsOpen(o => !o)} style={{
          background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', width: '100%',
          padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontSize: 16, fontFamily: 'var(--font)', fontWeight: 500,
        }}>
          Produits
          <FiChevronDown size={16} style={{ transform: mobileProdsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        {mobileProdsOpen && categories.map((cat) => {
          const isActive = location.search === `?category=${cat.slug}`;
          return (
            <Link key={cat.slug} to={`/products?category=${cat.slug}`} onClick={closeMenu}
              style={{ display: 'block', fontSize: 16, padding: '16px', opacity: 0.7, fontWeight: 500 }}
              className={isActive ? 'active' : ''}>
              <cat.icon size={16} style={{ marginRight: 6 }} /> {cat.name}
            </Link>
          );
        })}
        <Link to="/products" onClick={closeMenu} style={{ display: 'block', fontSize: 16, padding: '16px', opacity: 0.6, fontWeight: 500 }}>Tous les produits →</Link>
        <NavLink to="/about" onClick={closeMenu}>À propos</NavLink>
        {user?.role == 'seller' ? (
          <NavLink to="/reprise/list" onClick={closeMenu}><FiSmartphone size={14} /> Demandes reprise</NavLink>
        ) : user?.role == 'admin' ? null : (
          <NavLink to="/reprise" onClick={closeMenu}><FiSmartphone size={14} /> Reprise</NavLink>
        )}
        {user?.role == 'seller' ? (
          <NavLink to="/seller" onClick={closeMenu} className="navbar-mobile-sell"><FiTrendingUp size={14} /> Vendre</NavLink>
        ) : user?.role !== 'admin' && (
          <NavLink to="/vendre" onClick={closeMenu} className="navbar-mobile-sell"><FiTrendingUp size={14} /> Vendre</NavLink>
        )}
        <div className="navbar-mobile-divider" />
        {user ? (
          <>
            <NavLink to="/profile" onClick={closeMenu}><FiUser size={14} /> Mon Profil</NavLink>
            <NavLink to="/messenger" onClick={closeMenu}><FiMessageCircle size={14} /> Messages</NavLink>
            {user.role !== 'admin' && (
              user.premium ? (
                <span className="navbar-premium-badge" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 500 }}>
                  <FiStar size={16} /> Premium
                </span>
              ) : (
                <button onClick={() => { closeMenu(); setShowPremium(true); }} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 500, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', width: '100%' }}>
                  <FiStar size={16} /> Passer Premium
                </button>
              )
            )}
            {(user.role === 'seller') && (
              <NavLink to="/seller" onClick={closeMenu}><FiShoppingBag size={14} /> Tableau de Bord</NavLink>
            )}
            {user.role === 'admin' && (
              <NavLink to="/admin" onClick={closeMenu}><FiPackage size={14} /> Dashboard</NavLink>
            )}
            <button onClick={() => { logout(); navigate('/'); closeMenu(); }} className="navbar-mobile-logout">
              <FiLogOut size={14} /> Déconnexion
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" onClick={closeMenu}>Connexion</NavLink>
            <Link to="/signup" className="navbar-mobile-signup" onClick={closeMenu}>S'inscrire</Link>
          </>
        )}
      </div>

      <PremiumPopup open={showPremium} onClose={() => setShowPremium(false)} />
    </>
  );
}
