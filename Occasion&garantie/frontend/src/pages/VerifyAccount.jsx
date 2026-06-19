import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import api from '../api/axios';

export default function VerifyAccount() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Lien de vérification invalide.');
      return;
    }
    api.post('/auth/verify-signup', { token })
      .then((res) => {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setStatus('success');
        setTimeout(() => window.location.href = '/', 2000);
      })
      .catch((err) => {
        setStatus('error');
        setError(err.response?.data?.message || 'Erreur de vérification.');
      });
  }, [token]);

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center', padding: '40px' }}>
          {status === 'loading' && (
            <>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p>Vérification de votre compte...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <FiCheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
              <h2>Compte vérifié !</h2>
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Votre compte a été créé avec succès. Vous êtes maintenant connecté.</p>
              <Link to="/" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Accueil</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <FiXCircle size={48} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
              <h2>Lien invalide ou expiré</h2>
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>{error}</p>
              <Link to="/signup" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Réessayer l'inscription</Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}