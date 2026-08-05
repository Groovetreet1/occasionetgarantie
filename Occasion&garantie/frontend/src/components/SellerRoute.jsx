import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function SellerRoute({ children }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  if (loading) return <div className="loading-spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'seller' && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
