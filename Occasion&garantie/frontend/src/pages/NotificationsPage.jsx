import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import api from '../api/axios';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCleanConfirm, setShowCleanConfirm] = useState(false);

  useEffect(() => {
    api.get('/notifications').then(res => setNotifications(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const markRead = async (n) => {
    try { await api.put(`/notifications/${n.id}/read`); } catch {}
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read_at: 'now' } : x));
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(x => ({ ...x, read_at: 'now' })));
    } catch {}
  };

  const confirmClean = async () => {
    setShowCleanConfirm(false);
    try { await api.delete('/notifications/all'); setNotifications([]); } catch {}
  };

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <Link to="/" className="btn btn-ghost" style={{ marginBottom: 8 }}><FiArrowLeft /> Accueil</Link>
            <h1 style={{ fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiBell size={22} style={{ color: 'var(--primary)' }} /> Notifications
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {notifications.length > 0 && (
              <button onClick={() => setShowCleanConfirm(true)} className="btn btn-ghost" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--error)' }}>
                <FiTrash2 size={14} /> Vider
              </button>
            )}
            {notifications.some(n => !n.read_at) && (
              <button onClick={markAllRead} className="btn btn-ghost" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiCheck size={14} /> Tout marquer lu
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="spinner" /></div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <FiBell size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
            <p>Aucune notification.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notifications.map(n => (
              <button key={n.id} onClick={() => markRead(n)} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '14px 16px',
                border: '1px solid var(--border)', borderRadius: 10,
                background: n.read_at ? 'var(--bg-card)' : 'rgba(99,102,241,0.05)',
                cursor: 'pointer', color: 'inherit', fontFamily: 'var(--font)',
              }}>
                <div style={{ fontSize: 14, fontWeight: n.read_at ? 400 : 600, display: 'flex', gap: 8 }}>
                  {!n.read_at && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 5 }} />}
                  <span>{n.title}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5, paddingLeft: !n.read_at ? 16 : 0 }}>{n.message}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, paddingLeft: !n.read_at ? 16 : 0 }}>
                  {new Date(n.created_at).toLocaleDateString('fr-FR')} a {new Date(n.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
      {showCleanConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowCleanConfirm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 32, maxWidth: 360, width: '100%', boxShadow: '0 25px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FiTrash2 size={26} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Vider les notifications ?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Cette action est irreversible. Toutes vos notifications seront supprimees.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowCleanConfirm(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px 0' }}>
                Annuler
              </button>
              <button onClick={confirmClean} className="form-submit" style={{ flex: 1, justifyContent: 'center', padding: '10px 0', background: '#dc2626', borderColor: '#dc2626' }}>
                <FiTrash2 size={14} /> Vider
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </section>
  );
}
