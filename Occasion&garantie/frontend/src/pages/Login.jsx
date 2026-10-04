import { useState, useRef } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiCheckCircle, FiSmartphone, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AuthLayout from '../components/AuthLayout';
import api from '../api/axios';

function OtpBoxes({ digits, setDigits, disabled, onComplete }) {
  const refs = useRef([]);

  const commit = (next) => {
    setDigits(next);
    if (next.every(Boolean)) onComplete(next.join(''));
  };

  const handleChange = (i, v) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    commit(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6).split('');
    if (!t.length) return;
    const next = [...digits];
    t.forEach((ch, k) => { next[k] = ch; });
    commit(next);
    refs.current[Math.min(t.length, 6) - 1]?.focus();
  };

  const box = {
    width: 46, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 800,
    border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)',
    color: 'var(--text)', outline: 'none', fontFamily: 'var(--font)', padding: 0,
  };

  return (
    <div dir="ltr" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }} onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
          disabled={disabled}
          autoFocus={i === 0}
          aria-label={`Digit ${i + 1}`}
          style={box}
        />
      ))}
    </div>
  );
}

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
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [backupMode, setBackupMode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const reset2fa = () => {
    setNeed2fa(null);
    setDigits(['', '', '', '', '', '']);
    setBackupMode(false);
    setBackupCode('');
    setError('');
  };

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
      const { data } = await api.post('/auth/login', { email, password, latitude: lat, longitude: lng, remember: rememberMe });
      if (data.requires2FA) {
        setNeed2fa({ tempToken: data.tempToken, email: data.email || email });
        setDigits(['', '', '', '', '', '']);
        setBackupMode(false);
        setBackupCode('');
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

  const doVerify = async (code) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/2fa/verify', { tempToken: need2fa.tempToken, code });
      setSession(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.genericError'));
      setDigits(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupSubmit = (e) => {
    e.preventDefault();
    if (backupCode.trim()) doVerify(backupCode.trim());
  };

  if (need2fa) {
    return (
      <AuthLayout
        title={t('auth.tfaTitle')}
        subtitle={t('auth.tfaSubtitle', { email: need2fa.email })}
        footer={<button onClick={reset2fa} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>← {t('auth.backToLogin')}</button>}
      >
        {error && <div className="alert alert-error">{error}</div>}
        {!backupMode ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <FiShield size={44} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {t('auth.tfaCodeLabel')}
            </div>
            <OtpBoxes
              digits={digits}
              setDigits={setDigits}
              disabled={loading}
              onComplete={doVerify}
            />
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <button onClick={() => setBackupMode(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                {t('auth.tfaUseBackup')}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleBackupSubmit}>
            <div className="form-group">
              <label>{t('auth.tfaBackupLabel')}</label>
              <input
                type="text"
                placeholder="AB12CD34"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 8))}
                required
                autoFocus
                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '4px', fontWeight: 700, fontFamily: 'monospace' }}
              />
            </div>
            <button type="submit" className="form-submit" disabled={loading || backupCode.length < 8}>
              {loading ? t('auth.verifying') : t('auth.tfaVerifyBtn')}
            </button>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button type="button" onClick={() => setBackupMode(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                {t('auth.tfaUseApp')}
              </button>
            </div>
          </form>
        )}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', marginBottom: '14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--primary)', cursor: 'pointer' }} />
            {t('auth.rememberMe')}
          </label>
          <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--primary)' }}>{t('auth.forgotPassword')}</Link>
        </div>
        <button type="submit" className="form-submit" disabled={loading}>
          {loading ? t('auth.loginLoading') : t('auth.loginButton')}
        </button>
      </form>
    </AuthLayout>
  );
}