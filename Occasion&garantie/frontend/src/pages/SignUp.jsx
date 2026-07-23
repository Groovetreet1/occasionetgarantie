import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { FiUserPlus, FiMail, FiLock, FiPhone, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function SignUp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSeller = searchParams.get('role') === 'seller';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/signup', { fullName, email, password, phone, role: isSeller ? 'seller' : undefined });
      navigate(`/verify-code?email=${encodeURIComponent(email)}${isSeller ? '&role=seller' : ''}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{isSeller ? 'Creer un compte vendeur' : 'Creer un compte'}</h1>
          <p>{isSeller ? 'Commencez a vendre vos telephones gratuitement' : 'Rejoignez Occasion & Garantie'}</p>
        </div>
        <div className="auth-card">
          {isSeller && (
            <div className="seller-badge-header">
              <FiTrendingUp size={18} /> Compte Vendeur
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label><FiUserPlus size={14} /> Nom complet</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Votre nom" required />
            </div>
            <div className="form-group">
              <label><FiMail size={14} /> Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@email.com" required />
            </div>
            <div className="form-group">
              <label><FiLock size={14} /> Mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 caracteres" minLength={6} required />
            </div>
            <div className="form-group">
              <label><FiPhone size={14} /> Telephone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212 6XX XXX XXX" required />
            </div>
            <button type="submit" className="form-submit" disabled={loading}>
              {loading ? 'Inscription...' : isSeller ? 'Creer mon compte vendeur' : 'Creer mon compte'}
            </button>
          </form>
          <div className="form-footer">
            Deja un compte ? <Link to="/login">Connectez-vous</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
