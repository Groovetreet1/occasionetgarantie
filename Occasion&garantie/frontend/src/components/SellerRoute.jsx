import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SellerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'seller' && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
