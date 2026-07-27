import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBell, FiCheck } from 'react-icons/fi';
import api from '../api/axios';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
          {notifications.some(n => !n.read_at) && (
            <button onClick={markAllRead} className="btn btn-ghost" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiCheck size={14} /> Tout marquer lu
            </button>
          )}
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
    </section>
  );
}
