import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiLogOut, FiSettings, FiChevronDown, FiSmartphone, FiMonitor, FiHeadphones, FiTablet, FiShoppingBag, FiTrendingUp, FiStar, FiMessageCircle, FiPackage, FiBell } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import PremiumPopup from './PremiumPopup';
import api from '../api/axios';

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

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = () => {
      api.get('/notifications/unread-count').then(r => setUnreadCount(r.data.count)).catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handle = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const openNotifs = async () => {
    setNotifOpen(true);
    setDropdownOpen(false);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(0);
    } catch {}
  };

  const markRead = async (n) => {
    try { await api.put(`/notifications/${n.id}/read`); } catch {}
    if (n.link) navigate(n.link);
    setNotifOpen(false);
  };

  const markAllRead = async () => {
    try { await api.put('/notifications/read-all'); setNotifications(n => n.map(n => ({ ...n, read_at: 'now' }))); setUnreadCount(0); } catch {}
  };

  const cleanAll = async () => {
    if (!window.confirm('Supprimer toutes les notifications ?')) return;
    try { await api.delete('/notifications/all'); setNotifications([]); setUnreadCount(0); } catch {}
  };

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
            {user && (
              <div className="navbar-notif" ref={notifRef}>
                <button className="navbar-notif-btn" onClick={openNotifs} aria-label="Notifications">
                  <FiBell size={18} />
                  {unreadCount > 0 && <span className="navbar-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div className="navbar-notif-dropdown"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                        <strong style={{ fontSize: 13 }}>Notifications</strong>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {notifications.length > 0 && (
                            <button onClick={cleanAll} style={{ fontSize: 10, background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontFamily: 'var(--font)', padding: 0 }}>
                              Vider
                            </button>
                          )}
                          {notifications.some(n => !n.read_at) && (
                            <button onClick={markAllRead} style={{ fontSize: 10, background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'var(--font)', padding: 0 }}>
                              Tout marquer lu
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                            Aucune notification
                          </div>
                        ) : notifications.slice(0, 10).map(n => (
                          <button key={n.id} onClick={() => markRead(n)} style={{
                            display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
                            border: 'none', borderBottom: '1px solid var(--border)', background: n.read_at ? 'transparent' : 'rgba(99,102,241,0.04)',
                            cursor: 'pointer', color: 'inherit', fontFamily: 'var(--font)',
                          }}>
                            <div style={{ fontSize: 12, fontWeight: n.read_at ? 400 : 600 }}>{n.title}</div>
                            {n.message && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>}
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                              {new Date(n.created_at).toLocaleDateString('fr-FR')} {new Date(n.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
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
