import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FiSmartphone, FiMail, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

export default function VerifyCode() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const method = searchParams.get('method') || 'sms';
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
      setError(err.response?.data?.message || t('auth.invalidCodeFallback'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      const { data } = await api.post('/auth/resend-code', { email });
      setResent(true);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.resendErrorFallback'));
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
            <h1>{t('auth.accountVerifiedTitle')}</h1>
            <p>{t('auth.accountVerifiedSubtitle')}</p>
          </div>
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <FiCheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
              {t('auth.accountVerifiedText')}
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              {t('auth.loginButton')}
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
          {method === 'email' ? <FiMail size={32} style={{ color: 'var(--primary)', marginBottom: '8px' }} /> : <FiSmartphone size={32} style={{ color: 'var(--primary)', marginBottom: '8px' }} />}
          <h1>{t('auth.verificationTitle')}</h1>
          <p>{method === 'email' ? t('auth.enterCodeByEmail') : t('auth.enterCodeBySms')}</p>
        </div>
        <div className="auth-card">
          {error && <div className="alert alert-error">{error}</div>}
          {resent && (
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCheckCircle size={18} /> {t('auth.newCodeSent')}
            </div>
          )}
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', textAlign: 'center' }}>
            {t('auth.codeSentToPrefix')} <strong>{email}</strong> {t('auth.codeSentVia')} {method === 'email' ? t('auth.emailOption') : t('auth.smsOption')}.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('auth.verificationCodeLabel')}</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder={t('auth.verificationCodePlaceholder')}
                required
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                autoFocus
              />
            </div>
            <button type="submit" className="form-submit" disabled={loading || code.length !== 6}>
              {loading ? t('auth.verifying') : t('auth.verifyMyAccount')}
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
              {resending ? t('auth.resending') : t('auth.resendCode')}
            </button>
          </div>
          <div className="form-footer">
            <Link to="/login">{t('auth.backToLogin')}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}