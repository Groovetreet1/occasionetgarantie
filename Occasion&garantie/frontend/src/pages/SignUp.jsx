import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FiUserPlus, FiMail, FiLock, FiPhone, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function SignUp() {
  const { user, signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('form');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  if (user && user.phoneVerified) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await signup(fullName, email, password, phone);
      if (!data.user.phoneVerified) {
        setStep('verify');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setVerifying(true);
    try {
      const { data } = await api.post('/auth/verify-phone', { code });
      if (data.phoneVerified) {
        window.location.reload();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Code incorrect.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await api.post('/auth/resend-sms-code');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du renvoi.');
    } finally {
      setResending(false);
    }
  };

  if (step === 'verify') {
    return (
      <section className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <FiCheckCircle size={40} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
            <h1>Verification SMS</h1>
            <p>Un code a ete envoye au <strong>{phone}</strong></p>
          </div>
          <div className="auth-card">
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label>Code de verification</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: '28px', letterSpacing: '10px', fontWeight: 700 }}
                />
              </div>
              <button type="submit" className="form-submit" disabled={verifying || code.length < 6}>
                {verifying ? 'Verification...' : 'Verifier mon compte'}
              </button>
            </form>
            <button
              onClick={handleResend}
              disabled={resending}
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center', marginTop: '12px', gap: '8px' }}
            >
              <FiRefreshCw size={16} className={resending ? 'spin' : ''} />
              {resending ? 'Envoi...' : 'Renvoyer le code'}
            </button>
            <div className="form-footer" style={{ marginTop: '16px' }}>
              Le code expire dans 15 minutes.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Creer un compte</h1>
          <p>Rejoignez Occasion & Garantie</p>
        </div>
        <div className="auth-card">
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
            <button type="submit" className="form-submit">Creer mon compte</button>
          </form>
          <div className="form-footer">
            Deja un compte ? <Link to="/login">Connectez-vous</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
