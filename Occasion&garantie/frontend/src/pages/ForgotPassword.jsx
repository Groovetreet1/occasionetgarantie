import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [waUrl, setWaUrl] = useState('');
  const [sentEmail, setSentEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWaUrl('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setWaUrl(res.data.waUrl);
      setSentEmail(res.data.email);
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
          <h1>Mot de passe oublié ?</h1>
          <p>Entrez votre email pour recevoir un code via WhatsApp</p>
        </div>
        <div className="auth-card">
          {error && <div className="alert alert-error">{error}</div>}

          {!waUrl ? (
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
              <button type="submit" className="form-submit" disabled={loading}>
                {loading ? 'Envoi...' : 'Envoyer le code'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <FiCheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Un code de réinitialisation a été généré pour <strong>{sentEmail}</strong>.
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '16px', gap: '10px', marginBottom: '12px' }}
              >
                <BsWhatsapp size={22} /> Voir le code sur WhatsApp
              </a>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Le code expire dans 15 minutes.
              </p>
              <Link to={`/reset-password?email=${encodeURIComponent(sentEmail)}`} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                J&rsquo;ai le code, réinitialiser
              </Link>
            </div>
          )}

          <div className="form-footer" style={{ marginTop: '16px' }}>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <FiArrowLeft size={14} /> Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
