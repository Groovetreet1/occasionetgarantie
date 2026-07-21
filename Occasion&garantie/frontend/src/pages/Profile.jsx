import { useState, useEffect, useRef } from 'react';
import { FiUser, FiMail, FiPhone, FiLock, FiSave, FiArrowLeft, FiCamera, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Profile() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [pwdMsg, setPwdMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneStep, setPhoneStep] = useState('form');
  const [phoneLoading, setPhoneLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    api.get('/auth/me')
      .then((res) => {
        setName(res.data.full_name || '');
        setEmail(res.data.email || '');
        setPhone(res.data.phone || '');
        setAvatar(res.data.avatar || '');
      })
      .catch(() => { localStorage.removeItem('token'); navigate('/login'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const { data } = await api.post('/auth/upload-avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatar(data.avatar);
      setMsg({ type: 'success', text: 'Photo de profil mise a jour.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Erreur.' });
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.put('/auth/profile', { fullName: name });
      localStorage.setItem('user', JSON.stringify({ fullName: name }));
      setMsg({ type: 'success', text: 'Profil mis a jour avec succes.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Erreur.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg(null);

    if (!oldPassword) {
      setPwdMsg({ type: 'error', text: 'Veuillez entrer votre ancien mot de passe.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    setSavingPwd(true);
    try {
      await api.put('/auth/profile', { oldPassword, newPassword });
      setPwdMsg({ type: 'success', text: 'Mot de passe modifie avec succes.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Erreur.' });
    } finally {
      setSavingPwd(false);
    }
  };

  const handlePhoneChange = async (e) => {
    e.preventDefault();
    setPhoneLoading(true);
    try {
      await api.post('/auth/send-phone-code', { newPhone });
      setPhoneStep('verify');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Erreur.' });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handlePhoneVerify = async (e) => {
    e.preventDefault();
    setPhoneLoading(true);
    try {
      const { data } = await api.post('/auth/verify-phone-change', { code: phoneCode });
      setPhone(data.phone);
      setShowPhoneModal(false);
      setNewPhone('');
      setPhoneCode('');
      setPhoneStep('form');
      setMsg({ type: 'success', text: 'Numero mis a jour avec succes.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Code incorrect.' });
    } finally {
      setPhoneLoading(false);
    }
  };

  if (loading) return (
    <section className="auth-page">
      <div className="spinner" />
    </section>
  );

  return (
    <motion.section className="auth-page" variants={container} initial="hidden" animate="show">
      <div className="auth-container">
        <motion.div variants={item} className="auth-header">
          <Link to="/" className="btn btn-ghost" style={{ marginBottom: '12px' }}><FiArrowLeft /> Retour</Link>
          <h1>Mon Profil</h1>
          <p>Gerer vos informations personnelles</p>
        </motion.div>

        <motion.form variants={item} className="auth-card" onSubmit={handleProfileSubmit} style={{ marginBottom: 20 }}>
          {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
                margin: '0 auto 8px', cursor: 'pointer', position: 'relative',
                background: 'var(--bg-card)', border: '3px solid var(--border)',
              }}
            >
              {avatar ? (
                <img src={`/uploads/avatars/${avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <FiUser size={40} />
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '4px', color: '#fff', fontSize: 12 }}>
                {uploading ? '...' : <FiCamera size={16} />}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </div>

          <div className="form-group">
            <label><FiUser size={14} style={{ marginRight: 6 }} />Nom complet</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label><FiMail size={14} style={{ marginRight: 6 }} />Email</label>
            <input type="email" value={email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>L&rsquo;email ne peut pas etre modifie.</small>
          </div>

          <div className="form-group">
            <label><FiPhone size={14} style={{ marginRight: 6 }} />Telephone</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="tel" value={phone} disabled style={{ opacity: 0.6, cursor: 'not-allowed', flex: 1 }} />
              <button type="button" className="btn btn-outline" onClick={() => setShowPhoneModal(true)} style={{ whiteSpace: 'nowrap' }}>
                Changer
              </button>
            </div>
          </div>

          <motion.button className="form-submit" type="submit" disabled={saving} whileTap={{ scale: 0.97 }}>
            <FiSave size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
          </motion.button>
        </motion.form>

        <motion.form variants={item} className="auth-card" onSubmit={handlePasswordSubmit}>
          <h3 style={{ marginBottom: 16, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiLock size={16} /> Changer le mot de passe
          </h3>

          {pwdMsg && <div className={`alert alert-${pwdMsg.type}`}>{pwdMsg.text}</div>}

          <div className="form-group">
            <label>Ancien mot de passe</label>
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Votre mot de passe actuel" />
          </div>

          <div className="form-group">
            <label>Nouveau mot de passe</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Au moins 6 caracteres" minLength={6} />
          </div>

          <div className="form-group">
            <label>Confirmer le mot de passe</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repetez le nouveau mot de passe" minLength={6} />
          </div>

          <motion.button className="form-submit" type="submit" disabled={savingPwd} whileTap={{ scale: 0.97 }}>
            <FiSave size={16} /> {savingPwd ? 'Modification...' : 'Modifier le mot de passe'}
          </motion.button>
        </motion.form>
      </div>

      {showPhoneModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => { setShowPhoneModal(false); setPhoneStep('form'); setNewPhone(''); setPhoneCode(''); }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18 }}>Changer de numero</h2>
              <button type="button" onClick={() => { setShowPhoneModal(false); setPhoneStep('form'); setNewPhone(''); setPhoneCode(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>
                <FiX />
              </button>
            </div>

            {phoneStep === 'form' ? (
              <form onSubmit={handlePhoneChange}>
                <div className="form-group">
                  <label>Nouveau numero</label>
                  <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+212 6XX XXX XXX" required />
                </div>
                <button type="submit" className="form-submit" disabled={phoneLoading}>
                  {phoneLoading ? 'Envoi...' : 'Envoyer le code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePhoneVerify}>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
                <p style={{ marginBottom: 16, color: 'var(--text-secondary)', textAlign: 'center', fontSize: 13 }}>
                  Un code a ete envoye au <strong>{newPhone}</strong>
                </p>
                <div className="form-group">
                  <label>Code de verification</label>
                  <input type="text" placeholder="000000" value={phoneCode} onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }} />
                </div>
                <button type="submit" className="form-submit" disabled={phoneLoading || phoneCode.length < 6}>
                  {phoneLoading ? 'Verification...' : 'Verifier le numero'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}
