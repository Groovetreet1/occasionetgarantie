import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiX, FiClock, FiArrowLeft, FiThumbsDown } from 'react-icons/fi';
import api from '../api/axios';

const statusLabels = { en_attente: 'En attente', actif: 'Actif', rejete: 'Rejete' };
const statusColors = { en_attente: '#d97706', actif: 'var(--success)', rejete: 'var(--error)' };
const formatPrice = (p) => Number(p).toLocaleString() + ' DH';

export default function AdminInstallments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

  useEffect(() => {
    api.get('/admin/installments')
      .then(res => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = async (id) => {
    if (!window.confirm('Confirmer cette demande de paiement echelonne ?')) return;
    setActionId(id);
    try {
      await api.post(`/admin/installments/${id}/confirm`);
      setItems(items.map(i => i.id === id ? { ...i, status: 'actif' } : i));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id, reason) => {
    setActionId(id);
    try {
      await api.post(`/admin/installments/${id}/reject`, { reason });
      setItems(items.map(i => i.id === id ? { ...i, status: 'rejete', rejection_reason: reason } : i));
      setRejectModal(null);
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
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Paiements Echelonnes</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{items.length} demande{items.length > 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/admin/credits" className="btn btn-outline" style={{ fontSize: 13 }}>Credits</Link>
            <Link to="/admin/installments" className="btn btn-primary" style={{ fontSize: 13 }}>Echelonnement</Link>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><div className="icon"><FiClock size={48} /></div><p>Aucune demande de paiement echelonne.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Acheteur</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Produit</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Vendeur</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Total</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Apport</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Mensualite</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Mois</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Statut</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 6px', color: 'var(--text-muted)' }}>#{i.id}</td>
                    <td style={{ padding: '10px 6px', fontWeight: 600 }}>
                      {i.buyer_name}<br /><small style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '11px' }}>{i.buyer_email} &middot; {i.buyer_phone}</small>
                    </td>
                    <td style={{ padding: '10px 6px' }}>{i.product_name}</td>
                    <td style={{ padding: '10px 6px' }}>{i.seller_name || '#' + i.seller_id}</td>
                    <td style={{ padding: '10px 6px', fontWeight: 700, color: 'var(--primary)' }}>{formatPrice(i.total_price)}</td>
                    <td style={{ padding: '10px 6px' }}>{formatPrice(i.down_payment)}</td>
                    <td style={{ padding: '10px 6px', fontWeight: 700 }}>{formatPrice(i.monthly_amount)}</td>
                    <td style={{ padding: '10px 6px' }}>{i.months}</td>
                    <td style={{ padding: '10px 6px', fontSize: '11px', color: 'var(--text-secondary)' }}>{formatDate(i.created_at)}</td>
                    <td style={{ padding: '10px 6px' }}>
                      <span style={{ color: statusColors[i.status], display: 'flex', alignItems: 'center', gap: 4 }}>
                        {i.status === 'en_attente' ? <FiClock size={13} /> : i.status === 'actif' ? <FiCheck size={13} /> : <FiX size={13} />}
                        {statusLabels[i.status] || i.status}
                      </span>
                      {i.status === 'rejete' && i.rejection_reason && (
                        <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px', marginTop: 2 }}>"{i.rejection_reason}"</small>
                      )}
                    </td>
                    <td style={{ padding: '10px 6px' }}>
                      {i.status === 'en_attente' ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => handleConfirm(i.id)} disabled={actionId === i.id}
                            className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '11px' }}>
                            {actionId === i.id ? '...' : <><FiCheck size={12} /> OK</>}
                          </button>
                          <button onClick={() => setRejectModal(i)} disabled={actionId === i.id}
                            className="btn" style={{ padding: '5px 10px', fontSize: '11px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: 'none' }}>
                            <FiThumbsDown size={12} /> Refuser
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: statusColors[i.status], fontSize: '11px', fontWeight: 600 }}>{statusLabels[i.status]}</span>
                      )}
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
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Refuser le paiement echelonne</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Acheteur: <strong>{rejectModal.buyer_name}</strong> &middot; {formatPrice(rejectModal.total_price)} sur {rejectModal.months} mois
            </p>
            <RejectForm
              onSubmit={(reason) => handleReject(rejectModal.id, reason)}
              onCancel={() => setRejectModal(null)}
              loading={actionId === rejectModal.id}
              defaultMsg="Profil de l'acheteur non eligible."
            />
          </div>
        </div>
      )}
    </section>
  );
}

function RejectForm({ onSubmit, onCancel, loading, defaultMsg }) {
  const [reason, setReason] = useState('');
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
        Raison du refus (optionnelle)
      </label>
      <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={defaultMsg} rows={3}
        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'var(--font)', fontSize: '14px', resize: 'vertical', marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} className="btn btn-ghost" disabled={loading} style={{ padding: '10px 20px' }}>Annuler</button>
        <button onClick={() => onSubmit(reason.trim() || defaultMsg)} disabled={loading}
          className="btn" style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: 'none', fontWeight: 600 }}>
          {loading ? '...' : 'Refuser la demande'}
        </button>
      </div>
    </div>
  );
}