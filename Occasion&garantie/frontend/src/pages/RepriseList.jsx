import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiSmartphone, FiClock, FiRefreshCw } from 'react-icons/fi';
import api from '../api/axios';

const statusStyles = {
  en_attente: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Nouveau' },
  estime: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Estime' },
  accepte: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Accepte' },
  refuse: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Refuse' },
  converti: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6', label: 'Converti' },
};

export default function RepriseList() {
  const [reprises, setReprises] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/reprises').then(res => setReprises(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Link to="/" className="btn btn-ghost" style={{ marginBottom: 8 }}><FiArrowLeft /> Accueil</Link>
            <h1 style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiSmartphone size={28} style={{ color: 'var(--primary)' }} /> Demandes de reprise
            </h1>
          </div>
          <button onClick={load} className="btn btn-ghost" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiRefreshCw size={14} /> Actualiser
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="spinner" /></div>
        ) : reprises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <FiSmartphone size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>Aucune demande de reprise pour le moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reprises.map(r => (
              <div key={r.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{r.brand} {r.model}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {r.full_name || 'Anonyme'} | {r.imei ? `IMEI: ${r.imei}` : 'IMEI: N/A'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      <FiClock size={11} /> {new Date(r.created_at).toLocaleDateString('fr-FR')} {new Date(r.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                    background: (statusStyles[r.status] || statusStyles.en_attente).bg,
                    color: (statusStyles[r.status] || statusStyles.en_attente).color,
                  }}>
                    {(statusStyles[r.status] || statusStyles.en_attente).label}
                  </span>
                </div>

                {r.client_notes && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    {r.client_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
