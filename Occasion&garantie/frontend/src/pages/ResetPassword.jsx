import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FiLock, FiCheckCircle } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

export default function ResetPassword() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const identifierParam = searchParams.get('identifier') || '';
  const userIdParam = searchParams.get('userId') || '';
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = { identifier: identifierParam, code, newPassword };
      if (userIdParam) body.userId = Number(userIdParam);
      await api.post('/auth/reset-password', body);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  if (!identifierParam) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{t('auth.invalidLink')}</p>
            <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
              {t('auth.forgotPasswordTitle')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <FiCheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
            <h2 style={{ marginBottom: '8px' }}>{t('auth.passwordResetSuccess')}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{t('auth.passwordChangedSuccess')}</p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              {t('auth.loginButton')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{t('auth.resetTitle')}</h1>
          <p>{t('auth.resetSubtitle')}</p>
        </div>
        <div className="auth-card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('auth.emailPhoneLabel')}</label>
              <input type="text" value={identifierParam} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="form-group">
              <label>{t('auth.verificationCodeLabel')}</label>
              <input
                type="text"
                placeholder={t('auth.verificationCodePlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 700 }}
              />
            </div>
            <div className="form-group">
              <label>{t('auth.newPasswordLabel')}</label>
              <div style={{ position: 'relative' }}>
                <FiLock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder={t('auth.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>
            <button type="submit" className="form-submit" disabled={loading}>
              {loading ? t('auth.resetting') : t('auth.resetPasswordButton')}
            </button>
          </form>
          <div className="form-footer">
            <Link to="/login">{t('auth.backToLogin')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
