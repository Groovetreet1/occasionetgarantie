import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiX, FiClock, FiArrowLeft, FiStar, FiEye } from 'react-icons/fi';
import api from '../api/axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminPremium() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    api.get('/admin/premium-payments')
      .then(res => setPayments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = async (id) => {
    if (!window.confirm('Confirmer ce paiement Premium ?')) return;
    setConfirming(id);
    try {
      await api.post(`/admin/premium-payments/${id}/confirm`);
      setPayments(payments.map(p => p.id === id ? { ...p, status: 'actif' } : p));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setConfirming(null);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> Retour au site</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Gestion Premium</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{payments.length} demande{payments.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : payments.length === 0 ? (
          <div className="empty-state"><FiStar size={48} /><p>Aucune demande premium pour le moment.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Client</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>T&eacute;l&eacute;phone</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Montant</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Statut</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Screenshot</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>#{p.id}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{p.full_name}<br /><small style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{p.email}</small></td>
                    <td style={{ padding: '12px 8px' }}>{p.phone || '-'}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>{Number(p.amount).toLocaleString()} DH</td>
                    <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(p.created_at)}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {p.status === 'actif' ? (
                        <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}><FiCheck size={14} /> Actif</span>
                      ) : (
                        <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}><FiClock size={14} /> En attente</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {p.screenshot ? (
                        <a href={`${API_BASE}/uploads/premium/${p.screenshot}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                          <FiEye size={14} /> Voir
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}><FiX size={14} /></span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {p.status === 'en_attente' ? (
                        <button
                          onClick={() => handleConfirm(p.id)}
                          disabled={confirming === p.id}
                          className="btn btn-primary"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                        >
                          {confirming === p.id ? '...' : <><FiCheck size={14} /> Confirmer</>}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--success)', fontSize: '12px', fontWeight: 600 }}>Confirm&eacute;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
