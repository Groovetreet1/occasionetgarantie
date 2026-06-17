import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FiUserPlus, FiMail, FiLock, FiPhone } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const { user, signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(fullName, email, password, phone);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
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
              <label><FiPhone size={14} /> Téléphone (optionnel)</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212 6XX XXX XXX" />
            </div>
            <button type="submit" className="form-submit">Créer mon compte</button>
          </form>
          <div className="form-footer">
            Déjà un compte ? <Link to="/login">Connectez-vous</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
