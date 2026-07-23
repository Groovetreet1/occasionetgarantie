import { Link, useLocation } from 'react-router-dom';
import { FiBarChart2, FiTrendingUp, FiPlus, FiUser, FiShoppingBag, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/seller', label: 'Tableau de Bord', icon: FiBarChart2 },
  { to: '/seller/stats', label: 'Statistiques', icon: FiTrendingUp },
  { to: '/seller/products/new', label: 'Nouveau produit', icon: FiPlus },
  { to: '/profile', label: 'Mon Profil', icon: FiUser },
];

export default function SellerSidebar({ open, onToggle }) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onToggle} />}
      <aside className={`seller-sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">Administration</span>
          <button className="sidebar-close" onClick={onToggle}><FiX size={18} /></button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.avatar ? <img src={`/uploads/avatars/${user.avatar}`} alt="" /> : <FiUser size={20} />}
          </div>
          <div className="sidebar-user-info">
            <strong>{user?.full_name || user?.fullName}</strong>
            <small>Vendeur</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map(link => {
            const isActive = location.pathname === link.to || (link.to !== '/seller' && location.pathname.startsWith(link.to));
            const Icon = link.icon;
            return (
              <Link key={link.to} to={link.to} className={`sidebar-link ${isActive ? 'active' : ''}`} onClick={onToggle}>
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link to={`/seller/${user?.id}`} className="sidebar-link">
            <FiShoppingBag size={18} />
            <span>Voir ma boutique</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
