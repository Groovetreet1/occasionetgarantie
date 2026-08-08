import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiGrid, FiCreditCard, FiShield, FiPackage, FiHeadphones, FiSmartphone,
  FiUserCheck, FiMonitor, FiUsers, FiChevronsLeft, FiChevronsRight,
  FiTrendingUp, FiCheckSquare,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const SIDEBAR_KEY = 'admin-sidebar';

function readSidebarPreference() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1';
  } catch (err) {
    return false;
  }
}

function writeSidebarPreference(collapsed) {
  try {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
  } catch (err) {
    /* storage unavailable: keep state in memory only */
  }
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(readSidebarPreference);
  const { t, dir } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    writeSidebarPreference(collapsed);
  }, [collapsed]);

  const nav = [
    { to: '/admin', end: true, icon: FiGrid, label: t('admin.dashboardTitle') },
    { to: '/admin/credits', icon: FiCreditCard, label: t('admin.creditPurchases') },
    { to: '/admin/premium', icon: FiShield, label: t('admin.premiumRequests') },
    { to: '/admin/products', icon: FiPackage, label: t('admin.products') },
    { to: '/admin/products/pending', icon: FiCheckSquare, label: t('admin.approveProducts') },
    { to: '/admin/store-products', icon: FiTrendingUp, label: t('admin.officialStore') },
    { to: '/admin/tickets', icon: FiHeadphones, label: t('admin.ticketsSupport') },
    { to: '/admin/reprises', icon: FiSmartphone, label: t('admin.reprises') },
    { to: '/admin/managed-vendors', icon: FiUserCheck, label: t('admin.vendorAccounts') },
    { to: '/admin/vendor-logs', icon: FiMonitor, label: t('admin.vendorJournal') },
    { to: '/admin/users', icon: FiUsers, label: t('admin.users') },
  ];

  return (
    <div className={`admin-shell ${collapsed ? 'collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <button
            className="admin-sidebar-toggle"
            onClick={() => setCollapsed(c => !c)}
            aria-label="Toggle sidebar"
          >
            {collapsed
              ? <FiChevronsRight size={18} style={{ transform: dir === 'rtl' ? 'rotate(180deg)' : 'none' }} />
              : <FiChevronsLeft size={18} style={{ transform: dir === 'rtl' ? 'rotate(180deg)' : 'none' }} />}
          </button>
        </div>
        <nav className="admin-sidebar-nav">
          {nav.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="admin-nav-icon"><Icon size={18} /></span>
                {!collapsed && <span className="admin-nav-label">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="admin-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}