import { Link, useLocation } from 'react-router-dom';
import { FiBarChart2, FiTrendingUp, FiPlus, FiUser, FiShoppingBag } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function SellerNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const links = [
    { to: '/seller', label: t('seller.navDashboard'), icon: FiBarChart2 },
    { to: '/seller/stats', label: t('seller.navStats'), icon: FiTrendingUp },
    { to: '/seller/products/new', label: t('seller.navNewProduct'), icon: FiPlus },
    { to: '/profile', label: t('seller.navProfile'), icon: FiUser },
  ];

  return (
    <div className="seller-nav-bar">
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
          <FiShoppingBag size={16} /> <span>{t('seller.navStore')}</span>
        </Link>
      )}
    </div>
  );
}