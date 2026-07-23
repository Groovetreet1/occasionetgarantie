import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiX, FiClock, FiArrowLeft, FiStar, FiEye, FiThumbsDown, FiTrash2 } from 'react-icons/fi';
import api from '../api/axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminPremium() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

  useEffect(() => {
    api.get('/admin/premium-payments')
      .then(res => setPayments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = async (id) => {
    if (!window.confirm('Confirmer ce paiement Premium ?')) return;
    setActionId(id);
    try {
      await api.post(`/admin/premium-payments/${id}/confirm`);
      setPayments(payments.map(p => p.id === id ? { ...p, status: 'actif' } : p));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id, reason) => {
    setActionId(id);
    try {
      const res = await api.post(`/admin/premium-payments/${id}/reject`, { reason });
      setPayments(payments.map(p => p.id === id ? { ...p, status: 'rejete', rejection_reason: reason } : p));
      setRejectModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer definitivement cette demande ?')) return;
    setActionId(id);
    try {
      await api.delete(`/admin/premium-payments/${id}`);
      setPayments(payments.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setActionId(null);
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
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Téléphone</th>
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
                      ) : p.status === 'rejete' ? (
                        <span title={p.rejection_reason} style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'help' }}><FiX size={14} /> Rejeté</span>
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
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleConfirm(p.id)}
                            disabled={actionId === p.id}
                            className="btn btn-primary"
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                          >
                            {actionId === p.id ? '...' : <><FiCheck size={14} /> Confirmer</>}
                          </button>
                          <button
                            onClick={() => setRejectModal(p)}
                            disabled={actionId === p.id}
                            className="btn"
                            style={{ padding: '6px 14px', fontSize: '12px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: 'none' }}
                          >
                            <FiThumbsDown size={14} /> Rejeter
                          </button>
                        </div>
                      ) : p.status === 'rejete' ? (
                        <span style={{ color: 'var(--error)', fontSize: '12px', fontWeight: 600 }} title={p.rejection_reason}>Rejeté</span>
                      ) : (
                        <span style={{ color: 'var(--success)', fontSize: '12px', fontWeight: 600 }}>Confirmé</span>
                      )}
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={actionId === p.id}
                        style={{
                          marginLeft: '8px',
                          background: 'none', border: 'none',
                          color: 'var(--text-muted)', cursor: 'pointer',
                          padding: '4px', verticalAlign: 'middle'
                        }}
                        title="Supprimer"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', padding: '20px'
        }} onClick={() => setRejectModal(null)}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            padding: '32px', maxWidth: '480px', width: '100%',
            border: '1px solid var(--border)'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Rejeter la demande Premium</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Client: <strong>{rejectModal.full_name}</strong> &middot; {Number(rejectModal.amount).toLocaleString()} DH
            </p>
            <RejectForm
              paymentId={rejectModal.id}
              onSubmit={(reason) => handleReject(rejectModal.id, reason)}
              onCancel={() => setRejectModal(null)}
              loading={actionId === rejectModal.id}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function RejectForm({ onSubmit, onCancel, loading }) {
  const [reason, setReason] = useState('');

  const defaultReason = 'Paiement non valide. Veuillez reessayer avec un virement correct de 50 DH.';

  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
        Raison du rejet (optionnelle)
      </label>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder={defaultReason}
        rows={3}
        style={{
          width: '100%', padding: '12px', borderRadius: '10px',
          border: '1px solid var(--border)', background: 'var(--bg)',
          color: 'var(--text-primary)', fontFamily: 'var(--font)',
          fontSize: '14px', resize: 'vertical', marginBottom: '16px'
        }}
      />
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} className="btn btn-ghost" disabled={loading} style={{ padding: '10px 20px' }}>
          Annuler
        </button>
        <button
          onClick={() => onSubmit(reason.trim() || defaultReason)}
          disabled={loading}
          className="btn"
          style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: 'none', fontWeight: 600 }}
        >
          {loading ? '...' : 'Rejeter la demande'}
        </button>
      </div>
    </div>
  );
}
