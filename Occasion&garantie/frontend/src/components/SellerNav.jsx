import { Link, useLocation } from 'react-router-dom';
import { FiBarChart2, FiTrendingUp, FiPlus, FiUser, FiShoppingBag } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/seller', label: 'Tableau de Bord', icon: FiBarChart2 },
  { to: '/seller/stats', label: 'Statistiques', icon: FiTrendingUp },
  { to: '/seller/products/new', label: 'Nouveau produit', icon: FiPlus },
  { to: '/profile', label: 'Mon Profil', icon: FiUser },
];

export default function SellerNav() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="seller-nav-horizontal">
      <div className="seller-nav-links">
        {links.map(link => {
          const isActive = location.pathname === link.to || (link.to !== '/seller' && location.pathname.startsWith(link.to));
          const Icon = link.icon;
          return (
            <Link key={link.to} to={link.to} className={`seller-nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
      {user && (
        <Link to={`/seller/${user.id}`} className="seller-nav-shop">
          <FiShoppingBag size={16} /> <span>Boutique</span>
        </Link>
      )}
    </div>
  );
}
