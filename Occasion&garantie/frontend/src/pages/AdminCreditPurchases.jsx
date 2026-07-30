import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiX, FiClock, FiArrowLeft, FiCreditCard, FiThumbsDown, FiTrash2, FiEye } from 'react-icons/fi';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminCreditPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    api.get('/admin/credit-purchases')
      .then(res => setPurchases(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const executeConfirm = async () => {
    if (!confirmTarget) return;
    const id = confirmTarget;
    setConfirmTarget(null);
    setActionId(id);
    try {
      await api.post(`/admin/credit-purchases/${id}/confirm`);
      setPurchases(purchases.map(p => p.id === id ? { ...p, status: 'confirme' } : p));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id, reason) => {
    setActionId(id);
    try {
      await api.post(`/admin/credit-purchases/${id}/reject`, { reason });
      setPurchases(purchases.map(p => p.id === id ? { ...p, status: 'rejete', rejection_reason: reason } : p));
      setRejectModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setActionId(null);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    setActionId(id);
    try {
      await api.delete(`/admin/credit-purchases/${id}`);
      setPurchases(purchases.filter(p => p.id !== id));
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
            <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> Dashboard</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Achats de Credits</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{purchases.length} demande{purchases.length > 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/admin/credits" className="btn btn-primary" style={{ fontSize: 13 }}>Credits</Link>

          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : purchases.length === 0 ? (
          <div className="empty-state"><FiCreditCard size={48} /><p>Aucune demande d'achat de credits.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Client</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Montant</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Credits</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Statut</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Screenshot</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>#{p.id}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{p.full_name}<br /><small style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{p.email}</small></td>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>{Number(p.amount_dh).toLocaleString()} DH</td>
                    <td style={{ padding: '12px 8px' }}>{p.credits}</td>
                    <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(p.created_at)}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {p.status === 'confirme' ? (
                        <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}><FiCheck size={14} /> Confirme</span>
                      ) : p.status === 'rejete' ? (
                        <span title={p.rejection_reason} style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'help' }}><FiX size={14} /> Rejete</span>
                      ) : (
                        <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}><FiClock size={14} /> En attente</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {p.screenshot ? (
                        <a href={p.screenshot.startsWith('http') ? p.screenshot : `${API_BASE}/uploads/credits/${p.screenshot}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                          <FiEye size={14} /> Voir
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {p.status === 'en_attente' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setConfirmTarget(p.id)} disabled={actionId === p.id}
                            className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                            {actionId === p.id ? '...' : <><FiCheck size={14} /> Confirmer</>}
                          </button>
                          <button onClick={() => setRejectModal(p)} disabled={actionId === p.id}
                            className="btn" style={{ padding: '6px 14px', fontSize: '12px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: 'none' }}>
                            <FiThumbsDown size={14} /> Rejeter
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: p.status === 'confirme' ? 'var(--success)' : 'var(--error)', fontSize: '12px', fontWeight: 600 }}>
                          {p.status === 'confirme' ? 'Confirme' : 'Rejete'}
                        </span>
                      )}
                      <button onClick={() => setDeleteTarget(p.id)} disabled={actionId === p.id}
                        style={{ marginLeft: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', verticalAlign: 'middle' }} title="Supprimer">
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: '20px' }}
          onClick={() => setRejectModal(null)}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '32px', maxWidth: '480px', width: '100%', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Rejeter l'achat de credits</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Client: <strong>{rejectModal.full_name}</strong> &middot; {Number(rejectModal.amount_dh).toLocaleString()} DH
            </p>
            <RejectForm
              onSubmit={(reason) => handleReject(rejectModal.id, reason)}
              onCancel={() => setRejectModal(null)}
              loading={actionId === rejectModal.id}
              defaultMsg="Paiement non recu. Veuillez reessayer."
            />
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={executeConfirm}
        title="Confirmer cet achat de credits ?"
        message="Cette action confirmera l'achat de credits."
        confirmText="Confirmer"
        confirmColor="#059669"
      />
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title="Supprimer cette demande ?"
        message="Cette action est irreversible."
        confirmText="Supprimer"
        confirmColor="#dc2626"
        icon={<FiTrash2 size={26} color="#dc2626" />}
      />
    </section>
  );
}

function RejectForm({ onSubmit, onCancel, loading, defaultMsg }) {
  const [reason, setReason] = useState('');
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
        Raison du rejet (optionnelle)
      </label>
      <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={defaultMsg} rows={3}
        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'var(--font)', fontSize: '14px', resize: 'vertical', marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} className="btn btn-ghost" disabled={loading} style={{ padding: '10px 20px' }}>Annuler</button>
        <button onClick={() => onSubmit(reason.trim() || defaultMsg)} disabled={loading}
          className="btn" style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: 'none', fontWeight: 600 }}>
          {loading ? '...' : 'Rejeter la demande'}
        </button>
      </div>
    </div>
  );
}