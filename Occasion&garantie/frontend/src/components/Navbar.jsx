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
import { translateNotification } from '../utils/translateNotification';
import { Menu, X, ChevronDown } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const categories = [
  { name: 'Smartphones', icon: FiSmartphone, slug: 'Smartphones' },
  { name: 'Tablettes', icon: FiTablet, slug: 'Tablettes' },
  { name: 'Ordinateurs', icon: FiMonitor, slug: 'Ordinateurs' },
  { name: 'Accessoires', icon: FiHeadphones, slug: 'Accessoires' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, lang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [prodsOpen, setProdsOpen] = useState(false);
  const [mobileProdsOpen, setMobileProdsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPremium, setShowPremium] = useState(false);
  const [showCleanConfirm, setShowCleanConfirm] = useState(false);

  const prodsRef = useRef(null);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const panelRef = useRef(null);

  const isProductsActive = location.pathname.startsWith('/products') || location.pathname.startsWith('/boutique');

  useEffect(() => {
    const onClick = (e) => {
      if (prodsRef.current && !prodsRef.current.contains(e.target)) setProdsOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const closeMenu = () => { setMenuOpen(false); setMobileProdsOpen(false); };

  const openNotifs = async () => {
    setNotifOpen((o) => !o);
    if (!notifOpen) {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data || []);
        const unread = (res.data || []).filter((n) => !n.read_at).length;
        setUnreadCount(unread);
      } catch (e) {}
    }
  };

  const markRead = async (n) => {
    try { await api.patch(`/notifications/${n.id}/read`); } catch (e) {}
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    try { await api.patch('/notifications/read-all'); } catch (e) {}
    setNotifications((prev) => prev.map((x) => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
    setUnreadCount(0);
  };

  const cleanAll = () => setShowCleanConfirm(true);
  const confirmClean = async () => {
    try { await api.delete('/notifications'); } catch (e) {}
    setNotifications([]);
    setUnreadCount(0);
    setShowCleanConfirm(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-[1000] bg-zinc-950/90 backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-[70px] grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 justify-self-start">
            <img src="/logo.png" alt="Occasion & Garantie" className="w-9 h-9 rounded-xl object-contain bg-white/95 p-1" />
            <span className="text-base font-extrabold tracking-tight text-white whitespace-nowrap">
              Occasion &amp; <span className="text-amber-400">Garantie</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 justify-self-center">
            <NavLink to="/" end className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-amber-400 bg-amber-500/10' : 'text-white/75 hover:text-white hover:bg-white/5'}`}>
              {t('nav.home')}
            </NavLink>
            <div className="relative" ref={prodsRef} onMouseEnter={() => setProdsOpen(true)} onMouseLeave={() => setProdsOpen(false)}>
              <button
                onClick={() => setProdsOpen((o) => !o)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${isProductsActive ? 'text-amber-400 bg-amber-500/10' : 'text-white/75 hover:text-white hover:bg-white/5'}`}
              >
                {t('nav.products')} <FiChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {prodsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden z-[10000]"
                  >
                    <Link to="/products" onClick={() => setProdsOpen(false)} className="block px-4 py-2.5 text-sm text-white/80 hover:bg-amber-500/10 hover:text-amber-400 transition-colors">
                      {t('nav.allProducts')}
                    </Link>
                    <Link to="/boutique" onClick={() => setProdsOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-2">
                      <FiShield className="w-3.5 h-3.5" /> {t('nav.officialStore')}
                    </Link>
                    <div className="h-px bg-white/10 my-1" />
                    {categories.map((cat) => {
                      const isActive = location.search === `?category=${cat.slug}`;
                      return (
                        <Link key={cat.slug} to={`/products?category=${cat.slug}`} onClick={() => setProdsOpen(false)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${isActive ? 'text-amber-400 bg-amber-500/10' : 'text-white/75 hover:bg-white/5 hover:text-white'}`}>
                          <cat.icon className="w-3.5 h-3.5" /> {cat.name}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <NavLink to="/about" className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-amber-400 bg-amber-500/10' : 'text-white/75 hover:text-white hover:bg-white/5'}`}>
              {t('nav.about')}
            </NavLink>
            {user?.role === 'seller' ? (
              <NavLink to="/reprise/list" className="navbar-sell-link">{t('nav.tradeInRequests')}</NavLink>
            ) : user?.role === 'admin' ? null : (
              <NavLink to="/reprise" className="navbar-sell-link">{t('nav.tradeIn')}</NavLink>
            )}
            {user?.role === 'seller' ? (
              <NavLink to="/seller/products/new" className="navbar-sell-link">{t('nav.sell')}</NavLink>
            ) : user?.role !== 'admin' && (
              <NavLink to="/vendre" className="navbar-sell-link">{t('nav.sell')}</NavLink>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 justify-self-end">
            <ThemeToggle />
            <LanguageToggle />
            {user && (
              <div className="relative" ref={notifRef}>
                <button onClick={openNotifs} aria-label="Notifications" className="p-2 rounded-full text-white/75 hover:text-white hover:bg-white/5 transition-colors relative">
                  <FiBell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-24px)] rounded-xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden z-[10000]"
                    >
                      <div className="flex justify-between items-center px-3 py-2.5 border-b border-white/10">
                        <strong className="text-xs">{t('nav.notifications')}</strong>
                        <div className="flex gap-2">
                          {notifications.length > 0 && (
                            <button onClick={cleanAll} className="text-[10px] text-red-400 hover:underline">{t('nav.clearAll')}</button>
                          )}
                          {notifications.some((n) => !n.read_at) && (
                            <button onClick={markAllRead} className="text-[10px] text-amber-400 hover:underline">{t('nav.markAllRead')}</button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-5 text-center text-xs text-white/50">{t('nav.noNotifications')}</div>
                        ) : notifications.slice(0, 10).map((n) => {
                          const tr = translateNotification(n, t);
                          return (
                            <button key={n.id} onClick={() => markRead(n)}
                              className={`block w-full text-left px-3 py-2 border-b border-white/5 hover:bg-white/5 transition-colors ${n.read_at ? '' : 'bg-indigo-500/5'}`}>
                              <div className="text-xs font-semibold">{tr.title}</div>
                              {tr.message && <div className="text-[10px] text-white/50 mt-0.5 truncate">{tr.message}</div>}
                              <div className="text-[9px] text-white/40 mt-1">
                                {new Date(n.created_at).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')} {lang === 'ar' ? ' في ' : ' à '} {new Date(n.created_at).toLocaleTimeString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen((o) => !o)} title={user.fullName || user.full_name} className="w-9 h-9 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={typeof user.avatar === 'string' && user.avatar.startsWith('http') ? user.avatar : `${API_BASE}/uploads/avatars/${user.avatar}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="w-4 h-4 text-white" />
                  )}
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden z-[10000]"
                    >
                      <div className="flex items-center gap-3 p-3 border-b border-white/10">
                        {user.avatar ? (
                          <img src={typeof user.avatar === 'string' && user.avatar.startsWith('http') ? user.avatar : `${API_BASE}/uploads/avatars/${user.avatar}`} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><FiUser className="w-5 h-5" /></span>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{user.store_name || user.fullName || user.full_name || user.email}</div>
                          <div className="text-[11px] text-white/50 truncate">{user.email}</div>
                        </div>
                      </div>
                      <div className="py-1">
                        <NavLink to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors">
                          <FiUser className="w-3.5 h-3.5" /> {t('nav.myProfile')}
                        </NavLink>
                        {user.role !== 'admin' && (
                          <>
                            <NavLink to="/offres" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors">
                              <FiMessageCircle className="w-3.5 h-3.5" /> {t('nav.myOffers')}
                            </NavLink>
                            <NavLink to="/messenger" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors">
                              <FiMessageCircle className="w-3.5 h-3.5" /> {t('nav.messages')}
                            </NavLink>
                          </>
                        )}
                        {user.role !== 'admin' && (
                          user.premium ? (
                            <span className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400">
                              <FiStar className="w-3.5 h-3.5" /> {t('nav.premium')}
                            </span>
                          ) : (
                            <button onClick={() => { setDropdownOpen(false); setShowPremium(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors">
                              <FiStar className="w-3.5 h-3.5" /> {t('nav.goPremium')}
                            </button>
                          )
                        )}
                        {user.role === 'seller' && (
                          <NavLink to="/seller" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors">
                            <FiShoppingBag className="w-3.5 h-3.5" /> {t('nav.dashboard')}
                          </NavLink>
                        )}
                        {user.role === 'admin' && (
                          <NavLink to="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors">
                            <FiPackage className="w-3.5 h-3.5" /> {t('nav.adminDashboard')}
                          </NavLink>
                        )}
                        <button onClick={() => { logout(); navigate('/'); setDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                          <FiLogOut className="w-3.5 h-3.5" /> {t('nav.logout')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <a href="/demo" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full border border-white/20 text-white text-xs font-bold hover:bg-white/5 transition-colors">
                  ▶ Demo
                </a>
                <Link to="/login" className="px-4 py-2 rounded-lg text-sm text-white/75 hover:text-white hover:bg-white/5 transition-colors">{t('nav.login')}</Link>
                <Link to="/signup" className="px-5 py-2 rounded-full bg-amber-500 text-zinc-950 text-sm font-bold hover:bg-amber-400 transition-colors">{t('nav.signup')}</Link>
              </div>
            )}
            <button onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" className="md:hidden p-2 rounded-lg text-white/80 hover:bg-white/5 transition-colors">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile panel */}
      <div ref={panelRef} className={`fixed top-[70px] right-0 bottom-0 w-72 max-w-[85vw] bg-zinc-950/98 backdrop-blur-xl border-l border-white/10 z-[9999] overflow-y-auto transition-transform duration-300 md:hidden ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col gap-1 p-4">
          <NavLink to="/" end onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 text-center">{t('nav.home')}</NavLink>
          <button onClick={() => setMobileProdsOpen((o) => !o)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 flex items-center justify-center gap-2">
            {t('nav.products')} <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileProdsOpen ? 'rotate-180' : ''}`} />
          </button>
          {mobileProdsOpen && categories.map((cat) => {
            const isActive = location.search === `?category=${cat.slug}`;
            return (
              <Link key={cat.slug} to={`/products?category=${cat.slug}`} onClick={closeMenu}
                className={`px-3 py-2 rounded-lg text-sm text-center ${isActive ? 'text-amber-400 bg-amber-500/10' : 'text-white/70 hover:bg-white/5'}`}>
                <cat.icon className="w-3.5 h-3.5 inline mr-1.5" /> {cat.name}
              </Link>
            );
          })}
          <Link to="/products" onClick={closeMenu} className="px-3 py-2 text-xs text-white/50 text-center">{t('nav.allProducts')}</Link>
          <Link to="/boutique" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-semibold text-amber-400 text-center flex items-center justify-center gap-2">
            <FiShield className="w-3.5 h-3.5" /> {t('nav.officialStore')}
          </Link>
          <NavLink to="/about" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 text-center">{t('nav.about')}</NavLink>
          {user?.role === 'seller' ? (
            <NavLink to="/reprise/list" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 text-center">{t('nav.tradeInRequests')}</NavLink>
          ) : user?.role === 'admin' ? null : (
            <NavLink to="/reprise" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 text-center">{t('nav.tradeIn')}</NavLink>
          )}
          {user?.role === 'seller' ? (
            <NavLink to="/seller/products/new" onClick={closeMenu} className="mx-2 mt-2 px-3 py-3 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm text-center flex items-center justify-center gap-2">
              <FiTrendingUp className="w-4 h-4" /> {t('nav.sell')}
            </NavLink>
          ) : user?.role !== 'admin' && (
            <NavLink to="/vendre" onClick={closeMenu} className="mx-2 mt-2 px-3 py-3 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm text-center flex items-center justify-center gap-2">
              <FiTrendingUp className="w-4 h-4" /> {t('nav.sell')}
            </NavLink>
          )}
          <div className="h-px bg-white/10 my-2" />
          {user ? (
            <>
              <NavLink to="/profile" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 text-center flex items-center justify-center gap-2">
                <FiUser className="w-3.5 h-3.5" /> {t('nav.myProfile')}
              </NavLink>
              {user.role !== 'admin' && (
                <>
                  <NavLink to="/offres" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 text-center flex items-center justify-center gap-2">
                    <FiMessageCircle className="w-3.5 h-3.5" /> {t('nav.myOffers')}
                  </NavLink>
                  <NavLink to="/messenger" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 text-center flex items-center justify-center gap-2">
                    <FiMessageCircle className="w-3.5 h-3.5" /> {t('nav.messages')}
                  </NavLink>
                </>
              )}
              {user.role !== 'admin' && (
                user.premium ? (
                  <span className="px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 text-center flex items-center justify-center gap-2">
                    <FiStar className="w-3.5 h-3.5" /> {t('nav.premium')}
                  </span>
                ) : (
                  <button onClick={() => { closeMenu(); setShowPremium(true); }} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 w-full flex items-center justify-center gap-2">
                    <FiStar className="w-3.5 h-3.5" /> {t('nav.goPremium')}
                  </button>
                )
              )}
              {user.role === 'seller' && (
                <NavLink to="/seller" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 text-center flex items-center justify-center gap-2">
                  <FiShoppingBag className="w-3.5 h-3.5" /> {t('nav.dashboard')}
                </NavLink>
              )}
              {user.role === 'admin' && (
                <NavLink to="/admin" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 text-center flex items-center justify-center gap-2">
                  <FiPackage className="w-3.5 h-3.5" /> {t('nav.adminDashboard')}
                </NavLink>
              )}
              <button onClick={() => { logout(); navigate('/'); closeMenu(); }} className="mx-2 mt-2 px-3 py-3 rounded-xl bg-red-500/10 text-red-400 font-bold text-sm text-center flex items-center justify-center gap-2">
                <FiLogOut className="w-4 h-4" /> {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <a href="/demo" target="_blank" rel="noopener noreferrer" className="mx-2 px-3 py-3 rounded-xl bg-red-500 text-white font-bold text-sm text-center">▶ Demo</a>
              <NavLink to="/login" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 text-center">{t('nav.login')}</NavLink>
              <Link to="/signup" onClick={closeMenu} className="mx-2 px-3 py-3 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm text-center">{t('nav.signup')}</Link>
            </>
          )}
        </div>
      </div>

      <PremiumPopup open={showPremium} onClose={() => setShowPremium(false)} />

      {showCleanConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center p-4" onClick={() => setShowCleanConfirm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="bg-zinc-900 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <FiTrash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">{t('nav.clearNotifsTitle')}</h3>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">{t('nav.clearNotifsDesc')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCleanConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/80 hover:bg-white/5 transition-colors">
                {t('nav.cancel')}
              </button>
              <button onClick={confirmClean} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">
                <FiTrash2 className="w-3.5 h-3.5 inline mr-1.5" /> {t('nav.clearAll')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
