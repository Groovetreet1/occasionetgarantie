import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="auth-page"><div className="spinner" /></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  return children;
}
