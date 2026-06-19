import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FiUserPlus, FiMail, FiLock, FiPhone, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function SignUp() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-verification', { fullName, email, password, phone });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du SMS.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Créer un compte</h1>
          <p>Rejoignez Occasion & Garantie</p>
        </div>
        <div className="auth-card">
          {error && <div className="alert alert-error">{error}</div>}

          {!sent ? (
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
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 caractères" minLength={6} required />
              </div>
              <div className="form-group">
                <label><FiPhone size={14} /> Téléphone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212 6XX XXX XXX" required />
              </div>
              <button type="submit" className="form-submit" disabled={loading}>
                {loading ? 'Envoi...' : 'Créer mon compte'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <FiCheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Un SMS de confirmation a été envoyé au <strong>{phone}</strong>.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Cliquez sur le lien reçu par SMS pour activer votre compte. Le lien expire dans 15 minutes.
              </p>
              <Link to="/login" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                Retour à la connexion
              </Link>
            </div>
          )}

          <div className="form-footer">
            Déjà un compte ? <Link to="/login">Connectez-vous</Link>
          </div>
        </div>
      </div>
    </section>
  );
}