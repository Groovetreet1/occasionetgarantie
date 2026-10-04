import { useState } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiCheckCircle, FiSmartphone, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AuthLayout from '../components/AuthLayout';
import api from '../api/axios';

export default function Login() {
  const { user, setSession } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(null);
  const [need2fa, setNeed2fa] = useState(null);
  const [code2fa, setCode2fa] = useState('');
  const navigate = useNavigate();

  const verified = searchParams.get('verified');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(null);
    setLoading(true);
    let lat, lng;
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
      lat = pos.coords.latitude; lng = pos.coords.longitude;
    } catch {}
    try {
      const { data } = await api.post('/auth/login', { email, password, latitude: lat, longitude: lng });
      if (data.requires2FA) {
        setNeed2fa({ tempToken: data.tempToken, email: data.email || email });
        setCode2fa('');
        return;
      }
      setSession(data.token, data.user);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsVerification) {
        setNeedsVerification(data.email);
      } else {
        setError(data?.message || t('auth.loginErrorFallback'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2faVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/2fa/verify', { tempToken: need2fa.tempToken, code: code2fa });
      setSession(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  if (need2fa) {
    return (
      <AuthLayout
        title={t('auth.tfaTitle')}
        subtitle={t('auth.tfaSubtitle', { email: need2fa.email })}
        footer={<button onClick={() => { setNeed2fa(null); setCode2fa(''); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>← {t('auth.backToLogin')}</button>}
      >
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handle2faVerify}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <FiShield size={44} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="form-group">
            <label>{t('auth.tfaCodeLabel')}</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="123456"
              value={code2fa}
              onChange={(e) => setCode2fa(e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 8))}
              required
              autoFocus
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '6px', fontWeight: 700 }}
            />
          </div>
          <button type="submit" className="form-submit" disabled={loading || !code2fa}>
            {loading ? t('auth.verifying') : t('auth.tfaVerifyBtn')}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={<>{t('auth.noAccount')} <Link to="/signup">{t('auth.createOne')}</Link></>}
    >
      {verified === 'success' && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiCheckCircle size={18} /> {t('auth.verifiedSuccess')}
        </div>
      )}
      {needsVerification && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiSmartphone size={18} /> {t('auth.accountNotVerified')}{' '}
          <Link to={`/verify-code?email=${encodeURIComponent(needsVerification)}`} style={{ color: 'var(--primary)', textDecoration: 'underline', marginLeft: '4px' }}>
            {t('auth.enterCode')}
          </Link>
        </div>
      )}
      {error && (
        <div className={error.includes('suspend') ? 'alert alert-suspension' : 'alert alert-error'}>
          {error.includes('suspendu') && <FiLock size={18} style={{ flexShrink: 0 }} />}
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('auth.emailLabel')}</label>
          <div style={{ position: 'relative' }}>
            <FiMail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            <input
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ paddingLeft: '42px' }}
            />
          </div>
        </div>
        <div className="form-group">
          <label>{t('auth.passwordLabel')}</label>
          <div style={{ position: 'relative' }}>
            <FiLock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingLeft: '42px', paddingRight: '42px' }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute', right: '14px', top: '14px',
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: 0, display: 'flex',
              }}
            >
              {showPw ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </div>
        <div style={{ textAlign: 'right', marginTop: '4px' }}>
          <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--primary)' }}>{t('auth.forgotPassword')}</Link>
        </div>
        <button type="submit" className="form-submit" disabled={loading}>
          {loading ? t('auth.loginLoading') : t('auth.loginButton')}
        </button>
      </form>
    </AuthLayout>
  );
}