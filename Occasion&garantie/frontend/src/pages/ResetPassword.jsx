import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FiLock, FiCheckCircle } from 'react-icons/fi';
import api from '../api/axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const identifierParam = searchParams.get('identifier') || '';
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { identifier: identifierParam, code, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  if (!identifierParam) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Lien invalide. Veuillez refaire une demande.</p>
            <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
              Mot de passe oublie ?
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <FiCheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
            <h2 style={{ marginBottom: '8px' }}>Mot de passe reinitialise</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Votre mot de passe a ete modifie avec succes.</p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Reinitialisation</h1>
          <p>Entrez le code recu par SMS et votre nouveau mot de passe</p>
        </div>
        <div className="auth-card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email / Telephone</label>
              <input type="text" value={identifierParam} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="form-group">
              <label>Code de verification</label>
              <input
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 700 }}
              />
            </div>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <FiLock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="Au moins 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>
            <button type="submit" className="form-submit" disabled={loading}>
              {loading ? 'Reinitialisation...' : 'Reinitialiser le mot de passe'}
            </button>
          </form>
          <div className="form-footer">
            <Link to="/login">Retour a la connexion</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
