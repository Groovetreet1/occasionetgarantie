import { useState } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiCheckCircle, FiXCircle, FiSmartphone } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(null);
  const navigate = useNavigate();

  const verified = searchParams.get('verified');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsVerification) {
        setNeedsVerification(data.email);
      } else {
        setError(data?.message || 'Erreur de connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Content de vous revoir</h1>
          <p>Connectez-vous a votre compte</p>
        </div>
        <div className="auth-card">
          {verified === 'success' && (
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCheckCircle size={18} /> Telephone verifie avec succes. Vous pouvez maintenant vous connecter.
            </div>
          )}
          {needsVerification && (
            <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiSmartphone size={18} /> Compte non verifie.{' '}
              <Link to={`/verify-code?email=${encodeURIComponent(needsVerification)}`} style={{ color: 'var(--primary)', textDecoration: 'underline', marginLeft: '4px' }}>
                Entrer le code
              </Link>
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <div style={{ position: 'relative' }}>
                <FiMail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="vous@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <FiLock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: '14px', top: '14px',
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', padding: 0, display: 'flex',
                  }}
                >
                  {showPw ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginTop: '4px' }}>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--primary)' }}>Mot de passe oublie ?</Link>
            </div>
            <button type="submit" className="form-submit" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <div className="form-footer">
            Pas encore de compte ? <Link to="/signup">Creez-en un</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
