import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiLock, FiSave, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Profile() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    api.get('/auth/me')
      .then((res) => {
        setName(res.data.full_name || '');
        setEmail(res.data.email || '');
        setPhone(res.data.phone || '');
      })
      .catch(() => { localStorage.removeItem('token'); navigate('/login'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.put('/auth/profile', { fullName: name, email, phone, password: password || undefined });
      localStorage.setItem('user', JSON.stringify({ fullName: name, email }));
      setMsg({ type: 'success', text: 'Profil mis à jour avec succès.' });
      setPassword('');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setSaving(false);
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
          <p>Gérez vos informations personnelles</p>
        </motion.div>

        <motion.form variants={item} className="auth-card" onSubmit={handleSubmit}>
          {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

          <div className="form-group">
            <label><FiUser size={14} style={{ marginRight: 6 }} />Nom complet</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label><FiMail size={14} style={{ marginRight: 6 }} />Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label><FiPhone size={14} style={{ marginRight: 6 }} />Téléphone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="form-group">
            <label><FiLock size={14} style={{ marginRight: 6 }} />Nouveau mot de passe (laisser vide pour ne pas changer)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
          </div>

          <motion.button className="form-submit" type="submit" disabled={saving} whileTap={{ scale: 0.97 }}>
            <FiSave size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </motion.button>
        </motion.form>
      </div>
    </motion.section>
  );
}
