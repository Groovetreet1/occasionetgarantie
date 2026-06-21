import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiShield, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiCamera, FiSave, FiLock, FiPackage } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Profile() {
  const { user, loading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (tab === 'deposits' && deposits.length === 0 && !depositsLoading) {
      setDepositsLoading(true);
      api.get('/auth/deposits')
        .then((res) => setDeposits(res.data))
        .catch(() => {})
        .finally(() => setDepositsLoading(false));
    }
  }, [tab, deposits.length, depositsLoading]);

  if (loading) return <div className="auth-page"><div className="spinner" /></div>;
  if (!user) return null;

  const initials = (user.full_name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const avatarUrl = user.avatar ? `/uploads/${user.avatar}` : null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const { data } = await api.put('/auth/profile', { fullName, phone });
      await refreshUser();
      setMsg({ type: 'success', text: data.message });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }
    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }
    setPwSaving(true);
    setMsg(null);
    try {
      const { data } = await api.put('/auth/password', { currentPassword, newPassword });
      setMsg({ type: 'success', text: data.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Erreur lors du changement de mot de passe.' });
    } finally {
      setPwSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('avatar', file);
    try {
      const { data } = await api.post('/upload/avatar', form);
      window.location.reload();
    } catch (err) {
      setMsg({ type: 'error', text: "Erreur lors de l'upload de l'avatar." });
    }
  };

  const roleLabel = user.role === 'admin' ? 'Administrateur' : 'Client';
  const statusMap = {
    en_attente: { icon: FiClock, label: 'En attente', class: 'pending' },
    accepte: { icon: FiCheckCircle, label: 'Accepté', class: 'accepted' },
    refuse: { icon: FiXCircle, label: 'Refusé', class: 'refused' },
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-card">
              <div className="profile-avatar-wrap">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="profile-avatar" />
                ) : (
                  <div className="profile-avatar-placeholder">{initials}</div>
                )}
                <label className="profile-avatar-upload" title="Changer l'avatar">
                  <FiCamera size={16} />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
                </label>
              </div>
              <h2 className="profile-name">{user.full_name}</h2>
              <span className={`profile-role ${user.role}`}>{roleLabel}</span>
              <div className="profile-email"><FiMail size={14} /> {user.email}</div>
              {user.phone && <div className="profile-phone"><FiPhone size={14} /> {user.phone}</div>}
              {memberSince && <div className="profile-since"><FiClock size={14} /> Membre depuis {memberSince}</div>}
            </div>
            <nav className="profile-tabs">
              <button className={`profile-tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
                <FiUser size={16} /> Informations
              </button>
              <button className={`profile-tab ${tab === 'deposits' ? 'active' : ''}`} onClick={() => setTab('deposits')}>
                <FiPackage size={16} /> Mes acomptes
              </button>
              <button className={`profile-tab ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>
                <FiLock size={16} /> Sécurité
              </button>
            </nav>
          </aside>

          <main className="profile-main">
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

            {tab === 'info' && (
              <div className="profile-panel">
                <h2 className="profile-panel-title">Mes informations</h2>
                <form onSubmit={handleSaveProfile}>
                  <div className="form-group">
                    <label>Nom complet</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={user.email} disabled style={{ opacity: 0.6 }} />
                  </div>
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212XXXXXXXXX" />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    <FiSave size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </form>
              </div>
            )}

            {tab === 'deposits' && (
              <div className="profile-panel">
                <h2 className="profile-panel-title">Mes acomptes</h2>
                {depositsLoading ? (
                  <div className="spinner" style={{ marginTop: 40 }} />
                ) : deposits.length === 0 ? (
                  <div className="empty-state" style={{ padding: 60 }}>
                    <FiPackage size={48} className="icon" />
                    <p>Aucun acompte pour le moment.</p>
                  </div>
                ) : (
                  <div className="deposits-list">
                    {deposits.map((d) => {
                      const st = statusMap[d.status] || { icon: FiAlertCircle, label: d.status, class: '' };
                      const StIcon = st.icon;
                      return (
                        <div key={d.id} className="deposit-item">
                          <div className="deposit-top">
                            <span className="deposit-product">{d.product_name || 'Produit'}</span>
                            <span className={`deposit-status ${st.class}`}>
                              <StIcon size={14} /> {st.label}
                            </span>
                          </div>
                          <div className="deposit-bottom">
                            <span className="deposit-date">
                              {new Date(d.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {d.screenshot && (
                              <a href={`/uploads/${d.screenshot}`} target="_blank" rel="noopener noreferrer" className="deposit-screenshot">
                                Voir le reçu
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === 'security' && (
              <div className="profile-panel">
                <h2 className="profile-panel-title">Changer le mot de passe</h2>
                <form onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label>Mot de passe actuel</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Nouveau mot de passe</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="form-group">
                    <label>Confirmer le nouveau mot de passe</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={pwSaving}>
                    <FiShield size={16} /> {pwSaving ? 'Modification...' : 'Modifier le mot de passe'}
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
