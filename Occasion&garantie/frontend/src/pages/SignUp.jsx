import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { FiUserPlus, FiMail, FiLock, FiPhone, FiTrendingUp, FiShoppingBag, FiFileText, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import TermsPopup from '../components/TermsPopup';

export default function SignUp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSeller = searchParams.get('role') === 'seller';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [verifMethod, setVerifMethod] = useState('sms');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowTerms(true);
  };

  const handleAcceptTerms = async () => {
    setShowTerms(false);
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/signup', { fullName, email, password, phone, role: isSeller ? 'seller' : undefined, storeName: isSeller ? storeName : undefined, termsAccepted: true, verificationMethod: verifMethod });
      navigate(`/verify-code?email=${encodeURIComponent(email)}${isSeller ? '&role=seller' : ''}${verifMethod === 'email' ? '&method=email' : ''}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{isSeller ? 'Creer un compte vendeur' : 'Creer un compte'}</h1>
          <p>{isSeller ? 'Commencez a vendre vos telephones gratuitement' : 'Rejoignez Occasion & Garantie'}</p>
        </div>
        <div className="auth-card">
          {isSeller && (
            <div className="seller-badge-header">
              <FiTrendingUp size={18} /> Compte Vendeur
            </div>
          )}
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
            <div className="form-group">
              <label style={{ marginBottom: 8, display: 'block' }}>Recevoir le code par</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: verifMethod === 'sms' ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: verifMethod === 'sms' ? 'rgba(37,99,235,0.05)' : 'transparent' }}>
                  <input type="radio" name="verifMethod" value="sms" checked={verifMethod === 'sms'} onChange={() => setVerifMethod('sms')} style={{ accentColor: 'var(--primary)' }} />
                  <FiMessageSquare size={16} /> SMS
                </label>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: verifMethod === 'email' ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: verifMethod === 'email' ? 'rgba(37,99,235,0.05)' : 'transparent' }}>
                  <input type="radio" name="verifMethod" value="email" checked={verifMethod === 'email'} onChange={() => setVerifMethod('email')} style={{ accentColor: 'var(--primary)' }} />
                  <FiMail size={16} /> Email
                </label>
              </div>
            </div>
            {isSeller && (
              <div className="form-group">
                <label><FiShoppingBag size={14} /> Nom de la boutique</label>
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ex: PhoneStore Casablanca" required />
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
              En cliquant sur "Creer mon compte", vous acceptez nos{' '}
              <button type="button" onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 0 }}>
                conditions generales
              </button>
            </div>
            <button type="submit" className="form-submit" disabled={loading}>
              <FiFileText size={16} /> {loading ? 'Inscription...' : isSeller ? 'Creer mon compte vendeur' : 'Creer mon compte'}
            </button>
          </form>
          <div className="form-footer">
            Deja un compte ? <Link to="/login">Connectez-vous</Link>
          </div>
        </div>
      </div>

      <TermsPopup
        open={showTerms}
        onAccept={handleAcceptTerms}
        onClose={() => setShowTerms(false)}
      />
    </section>
  );
}