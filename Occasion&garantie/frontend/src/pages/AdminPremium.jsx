import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiX, FiClock, FiArrowLeft, FiStar, FiEye, FiThumbsDown, FiTrash2 } from 'react-icons/fi';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import { useLanguage } from '../context/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminPremium() {
  const { t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    api.get('/admin/premium-payments')
      .then(res => setPayments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const executeConfirm = async () => {
    if (!confirmTarget) return;
    const id = confirmTarget;
    setConfirmTarget(null);
    setActionId(id);
    try {
      await api.post(`/admin/premium-payments/${id}/confirm`);
      setPayments(payments.map(p => p.id === id ? { ...p, status: 'actif' } : p));
    } catch (err) {
      alert(err.response?.data?.message || t('admin.error'));
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
      alert(err.response?.data?.message || t('admin.error'));
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
      await api.delete(`/admin/premium-payments/${id}`);
      setPayments(payments.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || t('admin.error'));
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
            <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> {t('admin.dashboardTitle')}</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>{t('admin.premiumManagementTitle')}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{payments.length} {payments.length > 1 ? t('admin.requestPlural') : t('admin.requestSingular')}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/admin/premium" className="btn btn-primary" style={{ fontSize: 13 }}>{t('admin.premiumTab')}</Link>
            <Link to="/admin/credits" className="btn btn-outline" style={{ fontSize: 13 }}>{t('admin.creditsTab')}</Link>

          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : payments.length === 0 ? (
          <div className="empty-state"><FiStar size={48} /><p>{t('admin.noPremiumRequests')}</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thId')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thClient')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thPhone')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thAmount')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thDate')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thStatus')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thScreenshot')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thAction')}</th>
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
                        <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}><FiCheck size={14} /> {t('admin.active')}</span>
                      ) : p.status === 'rejete' ? (
                        <span title={p.rejection_reason} style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'help' }}><FiX size={14} /> {t('admin.rejected')}</span>
                      ) : (
                        <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}><FiClock size={14} /> {t('admin.pending')}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {p.screenshot ? (
                        <a href={p.screenshot.startsWith('http') ? p.screenshot : `${API_BASE}/uploads/premium/${p.screenshot}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                          <FiEye size={14} /> {t('admin.view')}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}><FiX size={14} /></span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {p.status === 'en_attente' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => setConfirmTarget(p.id)}
                            disabled={actionId === p.id}
                            className="btn btn-primary"
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                          >
                            {actionId === p.id ? '...' : <><FiCheck size={14} /> {t('admin.confirm')}</>}
                          </button>
                          <button
                            onClick={() => setRejectModal(p)}
                            disabled={actionId === p.id}
                            className="btn"
                            style={{ padding: '6px 14px', fontSize: '12px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: 'none' }}
                          >
                            <FiThumbsDown size={14} /> {t('admin.reject')}
                          </button>
                        </div>
                      ) : p.status === 'rejete' ? (
                        <span style={{ color: 'var(--error)', fontSize: '12px', fontWeight: 600 }} title={p.rejection_reason}>{t('admin.rejected')}</span>
                      ) : (
                        <span style={{ color: 'var(--success)', fontSize: '12px', fontWeight: 600 }}>{t('admin.confirmed')}</span>
                      )}
                      <button
                        onClick={() => setDeleteTarget(p.id)}
                        disabled={actionId === p.id}
                        style={{
                          marginLeft: '8px',
                          background: 'none', border: 'none',
                          color: 'var(--text-muted)', cursor: 'pointer',
                          padding: '4px', verticalAlign: 'middle'
                        }}
                        title={t('admin.delete')}
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
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{t('admin.rejectPremiumTitle')}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              {t('admin.clientLabel')} <strong>{rejectModal.full_name}</strong> &middot; {Number(rejectModal.amount).toLocaleString()} DH
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

      <ConfirmModal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={executeConfirm}
        title={t('admin.confirmPaymentTitle')}
        message={t('admin.confirmPaymentMessage')}
        confirmText={t('admin.confirm')}
        confirmColor="#059669"
      />
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title={t('admin.deleteRequestTitle')}
        message={t('admin.irreversible')}
        confirmText={t('admin.delete')}
        confirmColor="#dc2626"
        icon={<FiTrash2 size={26} color="#dc2626" />}
      />
    </section>
  );
}

function RejectForm({ onSubmit, onCancel, loading }) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');

  const defaultReason = t('admin.defaultRejectReason');

  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
        {t('admin.rejectReasonLabel')}
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
          {t('admin.cancel')}
        </button>
        <button
          onClick={() => onSubmit(reason.trim() || defaultReason)}
          disabled={loading}
          className="btn"
          style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: 'none', fontWeight: 600 }}
        >
          {loading ? '...' : t('admin.rejectRequest')}
        </button>
      </div>
    </div>
  );
}
