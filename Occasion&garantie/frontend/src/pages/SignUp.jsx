import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { FiUserPlus, FiMail, FiLock, FiPhone, FiTrendingUp, FiShoppingBag, FiFileText, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';
import TermsPopup from '../components/TermsPopup';
import AuthLayout from '../components/AuthLayout';

export default function SignUp() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
      setError(err.response?.data?.message || t('auth.signupErrorFallback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isSeller ? t('auth.sellerSignupTitle') : t('auth.signupTitle')}
      subtitle={isSeller ? t('auth.sellerSignupSubtitle') : t('auth.signupSubtitle')}
      footer={<>{t('auth.haveAccount')} <Link to="/login">{t('auth.loginLink')}</Link></>}
    >
      {isSeller && (
        <div className="seller-badge-header">
          <FiTrendingUp size={18} /> {t('auth.sellerBadge')}
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label><FiUserPlus size={14} /> {t('auth.fullNameLabel')}</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('auth.fullNamePlaceholder')} required />
        </div>
        <div className="form-group">
          <label><FiMail size={14} /> {t('auth.emailLabel')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholderSignup')} required />
        </div>
        <div className="form-group">
          <label><FiLock size={14} /> {t('auth.passwordLabel')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholderSignup')} minLength={6} required />
        </div>
        <div className="form-group">
          <label><FiPhone size={14} /> {t('auth.phoneLabel')}</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('auth.phonePlaceholder')} required />
        </div>
        <div className="form-group">
          <label style={{ marginBottom: 8, display: 'block' }}>{t('auth.receiveCodeBy')}</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: verifMethod === 'sms' ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: verifMethod === 'sms' ? 'rgba(37,99,235,0.05)' : 'transparent' }}>
              <input type="radio" name="verifMethod" value="sms" checked={verifMethod === 'sms'} onChange={() => setVerifMethod('sms')} style={{ accentColor: 'var(--primary)' }} />
              <FiMessageSquare size={16} /> {t('auth.smsOption')}
            </label>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: verifMethod === 'email' ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: verifMethod === 'email' ? 'rgba(37,99,235,0.05)' : 'transparent' }}>
              <input type="radio" name="verifMethod" value="email" checked={verifMethod === 'email'} onChange={() => setVerifMethod('email')} style={{ accentColor: 'var(--primary)' }} />
              <FiMail size={16} /> {t('auth.emailOption')}
            </label>
          </div>
        </div>
        {isSeller && (
          <div className="form-group">
            <label><FiShoppingBag size={14} /> {t('auth.storeNameLabel')}</label>
            <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder={t('auth.storeNamePlaceholder')} required />
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
          {t('auth.acceptTermsPrefix')}{' '}
          <button type="button" onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 0 }}>
            {t('auth.acceptTermsLink')}
          </button>
        </div>
        <button type="submit" className="form-submit" disabled={loading}>
          <FiFileText size={16} /> {loading ? t('auth.signupLoading') : isSeller ? t('auth.sellerSignupButton') : t('auth.signupButton')}
        </button>
      </form>

      <TermsPopup
        open={showTerms}
        onAccept={handleAcceptTerms}
        onClose={() => setShowTerms(false)}
      />
    </AuthLayout>
  );
}