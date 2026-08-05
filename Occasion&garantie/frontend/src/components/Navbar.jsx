import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiLogOut, FiSettings, FiChevronDown, FiSmartphone, FiMonitor, FiHeadphones, FiTablet, FiShoppingBag, FiTrendingUp, FiStar, FiMessageCircle, FiPackage, FiBell, FiTrash2, FiAlertTriangle, FiShield } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
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
  const { t } = useLanguage();
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
      const inPanel = panelRef.current && panelRef.current.contains(e.target);
      const onHamburger = e.target.closest && e.target.closest('.navbar-hamburger');
      if (!inPanel && !onHamburger) setMenuOpen(false);
      else if (panelRef.current && e.target === panelRef.current) setMenuOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (prodsRef.current && !prodsRef.current.contains(e.target)) setProdsOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCleanConfirm, setShowCleanConfirm] = useState(false);
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
    setShowCleanConfirm(true);
  };

  const confirmClean = async () => {
    setShowCleanConfirm(false);
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
            <NavLink to="/" end>{t('nav.home')}</NavLink>
            <div className="navbar-prods"
              ref={prodsRef}
              onMouseEnter={() => setProdsOpen(true)}
              onMouseLeave={() => setProdsOpen(false)}
            >
              <button className={`navbar-prods-btn${isProductsActive ? ' active' : ''}`}
                onClick={() => setProdsOpen((o) => !o)}
              >
                {t('nav.products')} <FiChevronDown size={12} />
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
                    <Link to="/products" onClick={() => setProdsOpen(false)}>{t('nav.allProducts')}</Link>
                    <Link to="/boutique" onClick={() => setProdsOpen(false)} style={{ color: '#d97706', fontWeight: 600 }}>
                      <FiShield size={14} /> {t('nav.officialStore')}
                    </Link>
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
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
            <NavLink to="/about">{t('nav.about')}</NavLink>
            {user?.role == 'seller' ? (
              <NavLink to="/reprise/list" className="navbar-sell-link"><FiSmartphone size={14} /> {t('nav.tradeInRequests')}</NavLink>
            ) : user?.role == 'admin' ? null : (
              <NavLink to="/reprise" className="navbar-sell-link"><FiSmartphone size={14} /> {t('nav.tradeIn')}</NavLink>
            )}
            {user?.role == 'seller' ? (
              <NavLink to="/seller/products/new" className="navbar-sell-link"><FiTrendingUp size={14} /> {t('nav.sell')}</NavLink>
            ) : user?.role !== 'admin' && (
              <NavLink to="/vendre" className="navbar-sell-link"><FiTrendingUp size={14} /> {t('nav.sell')}</NavLink>
            )}
          </div>

          <div className="navbar-actions">
            <ThemeToggle />
            <LanguageToggle />
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
                        <strong style={{ fontSize: 13 }}>{t('nav.notifications')}</strong>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {notifications.length > 0 && (
                            <button onClick={cleanAll} style={{ fontSize: 10, background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontFamily: 'var(--font)', padding: 0 }}>
                              {t('nav.clearAll')}
                            </button>
                          )}
                          {notifications.some(n => !n.read_at) && (
                            <button onClick={markAllRead} style={{ fontSize: 10, background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'var(--font)', padding: 0 }}>
                              {t('nav.markAllRead')}
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                            {t('nav.noNotifications')}
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
                <button className="navbar-user" onClick={() => setDropdownOpen((o) => !o)} title={user.fullName || user.full_name}>
                  {user.avatar ? (
                    <img src={typeof user.avatar === 'string' && user.avatar.startsWith('http') ? user.avatar : `${API_BASE}/uploads/avatars/${user.avatar}`} alt="" className="navbar-user-avatar" />
                  ) : (
                    <span className="navbar-user-fallback"><FiUser size={18} /></span>
                  )}
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
                        <FiUser size={14} /> {t('nav.myProfile')}
                      </NavLink>
                      {user.role !== 'admin' && (
                        <>
                          <NavLink to="/offres" onClick={() => setDropdownOpen(false)}>
                            <FiMessageCircle size={14} /> {t('nav.myOffers')}
                          </NavLink>
                          <NavLink to="/messenger" onClick={() => setDropdownOpen(false)}>
                            <FiMessageCircle size={14} /> {t('nav.messages')}
                          </NavLink>
                        </>
                      )}
                      {user.role !== 'admin' && (
                        user.premium ? (
                          <span className="navbar-premium-badge" onClick={() => setDropdownOpen(false)}>
                            <FiStar size={14} /> {t('nav.premium')}
                          </span>
                        ) : (
                          <button onClick={() => { setDropdownOpen(false); setShowPremium(true); }} className="navbar-premium-btn">
                            <FiStar size={14} /> {t('nav.goPremium')}
                          </button>
                        )
                      )}
                      {(user.role === 'seller') && (
                        <NavLink to="/seller" onClick={() => setDropdownOpen(false)}>
                          <FiShoppingBag size={14} /> {t('nav.dashboard')}
                        </NavLink>
                      )}
                      {user.role === 'admin' && (
                        <NavLink to="/admin" onClick={() => setDropdownOpen(false)}>
                          <FiPackage size={14} /> {t('nav.adminDashboard')}
                        </NavLink>
                      )}
                      <button onClick={() => { logout(); navigate('/'); setDropdownOpen(false); }}>
                        <FiLogOut size={14} /> {t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div className="navbar-auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link to="/login" className="navbar-login">{t('nav.login')}</Link>
                <Link to="/signup" className="navbar-signup">{t('nav.signup')}</Link>
              </motion.div>
            )}
            <button className={`navbar-hamburger${menuOpen ? ' active' : ''}`} onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </motion.nav>

      <div className={`navbar-mobile-panel${menuOpen ? ' open' : ''}`} ref={panelRef}>
        <NavLink to="/" end onClick={closeMenu}>{t('nav.home')}</NavLink>
        <button onClick={() => setMobileProdsOpen(o => !o)} style={{
          background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', width: '100%',
          padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontSize: 14, fontFamily: 'var(--font)', fontWeight: 500,
        }}>
          {t('nav.products')}
          <FiChevronDown size={14} style={{ transform: mobileProdsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        {mobileProdsOpen && categories.map((cat) => {
          const isActive = location.search === `?category=${cat.slug}`;
          return (
            <Link key={cat.slug} to={`/products?category=${cat.slug}`} onClick={closeMenu}
              style={{ display: 'block', fontSize: 14, padding: '10px', opacity: 0.7, fontWeight: 500 }}
              className={isActive ? 'active' : ''}>
              <cat.icon size={14} style={{ marginRight: 6 }} /> {cat.name}
            </Link>
          );
        })}
        <Link to="/products" onClick={closeMenu} style={{ display: 'block', fontSize: 14, padding: '10px', opacity: 0.6, fontWeight: 500 }}>{t('nav.allProducts')} →</Link>
        <Link to="/boutique" onClick={closeMenu} style={{ display: 'block', fontSize: 14, padding: '10px', fontWeight: 600, color: '#d97706' }}>
          <FiShield size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {t('nav.officialStore')}
        </Link>
        <NavLink to="/about" onClick={closeMenu}>{t('nav.about')}</NavLink>
        {user?.role == 'seller' ? (
          <NavLink to="/reprise/list" onClick={closeMenu}><FiSmartphone size={14} /> {t('nav.tradeInRequests')}</NavLink>
        ) : user?.role == 'admin' ? null : (
          <NavLink to="/reprise" onClick={closeMenu}><FiSmartphone size={14} /> {t('nav.tradeIn')}</NavLink>
        )}
        {user?.role == 'seller' ? (
          <NavLink to="/seller/products/new" onClick={closeMenu} className="navbar-mobile-sell"><FiTrendingUp size={14} /> {t('nav.sell')}</NavLink>
        ) : user?.role !== 'admin' && (
          <NavLink to="/vendre" onClick={closeMenu} className="navbar-mobile-sell"><FiTrendingUp size={14} /> {t('nav.sell')}</NavLink>
        )}
        <div className="navbar-mobile-divider" />
        {user ? (
          <>
            <NavLink to="/profile" onClick={closeMenu}><FiUser size={14} /> {t('nav.myProfile')}</NavLink>
            {user.role !== 'admin' && (
              <>
                <NavLink to="/offres" onClick={closeMenu}><FiMessageCircle size={14} /> {t('nav.myOffers')}</NavLink>
                <NavLink to="/messenger" onClick={closeMenu}><FiMessageCircle size={14} /> {t('nav.messages')}</NavLink>
              </>
            )}
            {user.role !== 'admin' && (
              user.premium ? (
                <span className="navbar-premium-badge" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, fontWeight: 500 }}>
                  <FiStar size={14} /> {t('nav.premium')}
                </span>
              ) : (
                <button onClick={() => { closeMenu(); setShowPremium(true); }} style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, fontWeight: 500, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', width: '100%' }}>
                  <FiStar size={14} /> {t('nav.goPremium')}
                </button>
              )
            )}
            {(user.role === 'seller') && (
              <NavLink to="/seller" onClick={closeMenu}><FiShoppingBag size={14} /> {t('nav.dashboard')}</NavLink>
            )}
            {user.role === 'admin' && (
              <NavLink to="/admin" onClick={closeMenu}><FiPackage size={14} /> {t('nav.adminDashboard')}</NavLink>
            )}
            <button onClick={() => { logout(); navigate('/'); closeMenu(); }} className="navbar-mobile-logout">
              <FiLogOut size={14} /> {t('nav.logout')}
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" onClick={closeMenu}>{t('nav.login')}</NavLink>
            <Link to="/signup" className="navbar-mobile-signup" onClick={closeMenu}>{t('nav.signup')}</Link>
          </>
        )}
      </div>

      <PremiumPopup open={showPremium} onClose={() => setShowPremium(false)} />

      {showCleanConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowCleanConfirm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 32, maxWidth: 360, width: '100%', boxShadow: '0 25px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FiTrash2 size={26} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('nav.clearNotifsTitle')}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              {t('nav.clearNotifsDesc')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowCleanConfirm(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px 0' }}>
                {t('nav.cancel')}
              </button>
              <button onClick={confirmClean} className="form-submit" style={{ flex: 1, justifyContent: 'center', padding: '10px 0', background: '#dc2626', borderColor: '#dc2626' }}>
                <FiTrash2 size={14} /> {t('nav.clearAll')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
