import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiArrowLeft, FiCheckCircle, FiSmartphone } from 'react-icons/fi';
import api from '../api/axios';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [sentIdentifier, setSentIdentifier] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { identifier });
      setSentIdentifier(res.data.identifier);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Mot de passe oublie ?</h1>
          <p>Entrez votre email ou telephone pour recevoir un code par SMS</p>
        </div>
        <div className="auth-card">
          {error && <div className="alert alert-error">{error}</div>}

          {!sent ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email ou Telephone</label>
                <div style={{ position: 'relative' }}>
                  {identifier.includes('@') || !identifier ? (
                    <FiMail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  ) : (
                    <FiPhone size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  )}
                  <input
                    type="text"
                    placeholder="vous@email.com ou +212 6XX XXX XXX"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
              </div>
              <button type="submit" className="form-submit" disabled={loading}>
                {loading ? 'Envoi...' : 'Envoyer le code par SMS'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <FiSmartphone size={48} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
              <FiCheckCircle size={24} style={{ color: 'var(--success)', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Un code de verification a ete envoye par SMS au numero associe a <strong>{sentIdentifier}</strong>.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Le code expire dans 15 minutes.
              </p>
              <Link to={`/reset-password?identifier=${encodeURIComponent(sentIdentifier)}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                J&rsquo;ai le code, reinitialiser
              </Link>
            </div>
          )}

          <div className="form-footer" style={{ marginTop: '16px' }}>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <FiArrowLeft size={14} /> Retour a la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
