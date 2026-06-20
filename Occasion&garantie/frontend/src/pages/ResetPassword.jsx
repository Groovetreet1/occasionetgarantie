import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiLock, FiCheckCircle } from 'react-icons/fi';
import api from '../api/axios';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
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
      await api.post('/auth/reset-password', { email: emailParam, code, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || t('Erreur.'));
    } finally {
      setLoading(false);
    }
  };

  if (!emailParam) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{t('Lien invalide. Veuillez refaire une demande.')}</p>
            <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
              {t('Mot de passe oublié ?')}
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
            <h2 style={{ marginBottom: '8px' }}>{t('Mot de passe réinitialisé')}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{t('Votre mot de passe a été modifié avec succès.')}</p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              {t('Se connecter')}
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
          <h1>{t('Réinitialisation')}</h1>
          <p>{t('Entrez le code reçu par SMS et votre nouveau mot de passe')}</p>
        </div>
        <div className="auth-card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={emailParam} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="form-group">
              <label>{t('Code de vérification')}</label>
              <input
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 700 }}
              />
            </div>
            <div className="form-group">
              <label>{t('Nouveau mot de passe')}</label>
              <div style={{ position: 'relative' }}>
                <FiLock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder={t('Au moins 6 caractères')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>
            <button type="submit" className="form-submit" disabled={loading}>
              {loading ? t('Réinitialisation...') : t('Réinitialiser le mot de passe')}
            </button>
          </form>
          <div className="form-footer">
            <Link to="/login">{t('Retour à la connexion')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
