import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiPhone, FiArrowLeft, FiCheckCircle, FiSmartphone, FiUser } from 'react-icons/fi';
import api from '../api/axios';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [sentIdentifier, setSentIdentifier] = useState('');
  const [sentUserId, setSentUserId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [step, setStep] = useState('form');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { identifier });
      if (res.data.multipleAccounts) {
        setAccounts(res.data.accounts);
        setStep('choose');
      } else {
        setSentIdentifier(res.data.identifier);
        setSentUserId(res.data.userId || null);
        setSent(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = async (userId) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { identifier, userId });
      setSentIdentifier(res.data.identifier);
      setSentUserId(res.data.userId);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('form');
    setAccounts([]);
    setError('');
  };

  const qs = sentUserId ? `?identifier=${encodeURIComponent(sentIdentifier)}&userId=${sentUserId}` : `?identifier=${encodeURIComponent(sentIdentifier)}`;

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Mot de passe oublie ?</h1>
          {step === 'form' && <p>Entrez votre email ou telephone pour recevoir un code par SMS</p>}
          {step === 'choose' && <p>Plusieurs comptes trouves, selectionnez le votre</p>}
        </div>
        <div className="auth-card">
          {error && <div className="alert alert-error">{error}</div>}

          {step === 'form' && !sent && (
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
                {loading ? 'Verification...' : 'Envoyer le code par SMS'}
              </button>
            </form>
          )}

          {step === 'choose' && (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>
                Nous avons trouve {accounts.length} comptes avec ce numero. Selectionnez celui qui vous concerne :
              </p>
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleSelectAccount(acc.id)}
                  disabled={loading}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px', marginBottom: '10px', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', background: 'var(--bg-card)',
                    cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '14px',
                    textAlign: 'left', transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FiUser size={18} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{acc.full_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{acc.email}</div>
                  </div>
                </button>
              ))}
              <button
                onClick={handleBack}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center',
                  gap: '6px', margin: '12px auto 0', fontFamily: 'var(--font)',
                }}
              >
                <FiArrowLeft size={14} /> Revenir en arriere
              </button>
            </div>
          )}

          {sent && (
            <div style={{ textAlign: 'center' }}>
              <FiSmartphone size={48} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
              <FiCheckCircle size={24} style={{ color: 'var(--success)', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Un code de verification a ete envoye par SMS au numero associe a <strong>{sentIdentifier}</strong>.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Le code expire dans 15 minutes.
              </p>
              <Link to={`/reset-password${qs}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
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
