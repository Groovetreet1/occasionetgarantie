import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FiSmartphone, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import api from '../api/axios';

export default function VerifyCode() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-code', { email, code });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Code invalide.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await api.post('/auth/resend-code', { email });
      setResent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du renvoi.');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <section className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <FiCheckCircle size={40} style={{ color: 'var(--success)', marginBottom: '8px' }} />
            <h1>Telephone verifie</h1>
            <p>Votre compte est maintenant actif</p>
          </div>
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <FiCheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
              Votre telephone a ete verifie avec succes.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Se connecter
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <FiSmartphone size={32} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
          <h1>Verification</h1>
          <p>Entrez le code recu par SMS</p>
        </div>
        <div className="auth-card">
          {error && <div className="alert alert-error">{error}</div>}
          {resent && (
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCheckCircle size={18} /> Un nouveau code a ete envoye.
            </div>
          )}
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', textAlign: 'center' }}>
            Un code a 6 chiffres a ete envoye au <strong>{email}</strong>.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Code de verification</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                autoFocus
              />
            </div>
            <button type="submit" className="form-submit" disabled={loading || code.length !== 6}>
              {loading ? 'Verification...' : 'Verifier mon compte'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{
                background: 'none', border: 'none', color: 'var(--primary)',
                cursor: 'pointer', fontSize: '13px', display: 'inline-flex',
                alignItems: 'center', gap: '6px'
              }}
            >
              <FiRefreshCw size={14} className={resending ? 'spin' : ''} />
              {resending ? 'Envoi...' : 'Renvoyer le code'}
            </button>
          </div>
          <div className="form-footer">
            <Link to="/login">Retour a la connexion</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
