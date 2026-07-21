import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FiUserPlus, FiMail, FiLock, FiPhone, FiCheckCircle, FiSmartphone } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function SignUp() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/signup', { fullName, email, password, phone });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
    }
  };

  if (success) {
    return (
      <section className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <FiCheckCircle size={40} style={{ color: 'var(--success)', marginBottom: '8px' }} />
            <h1>Compte cree</h1>
            <p>Verifiez votre telephone</p>
          </div>
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <FiSmartphone size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
            <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
              Un lien d&rsquo;activation a ete envoye par SMS au <strong>{phone}</strong>.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Cliquez sur le lien dans le SMS pour activer votre compte.
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
