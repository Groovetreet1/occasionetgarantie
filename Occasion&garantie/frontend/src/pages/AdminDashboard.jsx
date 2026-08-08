import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiArrowLeft, FiStar, FiCheck, FiX, FiClock, FiEye, FiThumbsDown } from 'react-icons/fi';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import { useLanguage } from '../context/LanguageContext';
const stateLabels = { neuf: 'Neuf', comme_neuf: 'Comme neuf', tres_bon: 'Très bon', bon: 'Bon', acceptable: 'Acceptable' };
const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [pLoading, setPLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deletePremiumTarget, setDeletePremiumTarget] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/products')
      .then((res) => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    api.get('/admin/premium-payments')
      .then(res => setPayments(res.data))
      .catch(() => {})
      .finally(() => setPLoading(false));
  }, []);

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.delete(`/products/${id}`);
      load();
    } catch { alert(t('admin.deleteError')); }
  };

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
      await api.post(`/admin/premium-payments/${id}/reject`, { reason });
      setPayments(payments.map(p => p.id === id ? { ...p, status: 'rejete', rejection_reason: reason } : p));
      setRejectModal(null);
    } catch (err) {
      alert(err.response?.data?.message || t('admin.error'));
    } finally {
      setActionId(null);
    }
  };

  const executeDeletePremium = async () => {
    if (!deletePremiumTarget) return;
    const id = deletePremiumTarget;
    setDeletePremiumTarget(null);
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
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>{t('admin.dashboardAdminTitle')}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{products.length} {products.length > 1 ? t('admin.productPlural') : t('admin.productSingular')}</p>
          </div>
          <Link to="/admin/products/new" className="btn btn-primary">
            <FiPlus size={18} /> {t('admin.newProduct')}
          </Link>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span><strong style={{ color: 'var(--text-primary)' }}>{t('admin.categoriesAvailable')}</strong> Smartphones, Tablettes, Ordinateurs, Accessoires, Gaming</span>
          <span><strong style={{ color: 'var(--text-primary)' }}>{t('admin.states')}</strong> Neuf, Comme neuf, Très bon état, Bon état</span>
          <span><strong style={{ color: 'var(--text-primary)' }}>{t('admin.tip')}</strong> {t('admin.tipFeaturedPrefix')} <strong style={{ color: 'var(--primary)' }}>{t('admin.featuredProduct')}</strong> {t('admin.tipFeaturedSuffix')}</span>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state"><div className="icon"><FiPackage size={48} /></div><p>{t('admin.noProducts')}</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thId')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thName')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thPrice')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thCategory')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thState')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thStock')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thActions')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>#{p.id}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {!!p.featured && <span style={{ background: 'var(--gradient)', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', marginRight: '6px', fontWeight: 700 }}>TOP</span>}
                      {p.name}
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--primary)', fontWeight: 700 }}>{formatPrice(p.price)}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{p.category_name || '-'}</td>
                    <td style={{ padding: '12px 8px' }}><span style={{ padding: '2px 10px', borderRadius: '10px', background: 'var(--primary-light)', fontSize: '12px' }}>{stateLabels[p.state] || p.state}</span></td>
                    <td style={{ padding: '12px 8px' }}>{p.stock > 0 ? <span style={{ color: 'var(--success)' }}>✓ {p.stock}</span> : <span style={{ color: 'var(--error)' }}>{t('admin.outOfStock')}</span>}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link to={`/admin/products/edit/${p.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}><FiEdit2 size={14} /></Link>
                        <button onClick={() => setDeleteTarget(p.id)} className="btn" style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: 'none' }}><FiTrash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ height: 2, background: 'var(--border)', margin: '40px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiStar style={{ color: '#FFD700' }} /> {t('admin.premiumSectionTitle')}
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-secondary)' }}>
              {payments.length} {payments.length > 1 ? t('admin.requestPlural') : t('admin.requestSingular')}
            </span>
          </h2>
        </div>

        {pLoading ? (
          <div style={{ padding: '40px 0' }}><div className="spinner" /></div>
        ) : payments.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0' }}><FiStar size={40} /><p>{t('admin.noPremiumRequests')}</p></div>
        ) : (
          <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thId')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thClient')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thAmount')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thDate')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thStatus')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thProof')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thAction')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>#{p.id}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{p.full_name}<br /><small style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{p.email}</small></td>
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
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {p.status === 'en_attente' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setConfirmTarget(p.id)} disabled={actionId === p.id} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                            {actionId === p.id ? '...' : <><FiCheck size={14} /> {t('admin.confirm')}</>}
                          </button>
                          <button onClick={() => setRejectModal(p)} disabled={actionId === p.id} className="btn" style={{ padding: '6px 14px', fontSize: '12px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: 'none' }}>
                            <FiThumbsDown size={14} /> {t('admin.reject')}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletePremiumTarget(p.id)} disabled={actionId === p.id} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} title={t('admin.delete')}>
                          <FiTrash2 size={14} />
                        </button>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: '20px' }} onClick={() => setRejectModal(null)}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '32px', maxWidth: '480px', width: '100%', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{t('admin.rejectPremiumTitle')}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              {t('admin.clientLabel')} <strong>{rejectModal.full_name}</strong> &middot; {Number(rejectModal.amount).toLocaleString()} DH
            </p>
            <textarea id="reject-reason" defaultValue="" placeholder={t('admin.defaultRejectReason')} rows={3} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'var(--font)', fontSize: '14px', resize: 'vertical', marginBottom: '16px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectModal(null)} className="btn btn-ghost" disabled={actionId === rejectModal.id} style={{ padding: '10px 20px' }}>{t('admin.cancel')}</button>
              <button onClick={() => handleReject(rejectModal.id, document.getElementById('reject-reason').value.trim() || t('admin.defaultRejectReason'))} disabled={actionId === rejectModal.id} className="btn" style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: 'none', fontWeight: 600 }}>
                {actionId === rejectModal.id ? '...' : t('admin.rejectRequest')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title={t('admin.deleteProductTitle')}
        message={t('admin.irreversible')}
        confirmText={t('admin.delete')}
        confirmColor="#dc2626"
        icon={<FiTrash2 size={26} color="#dc2626" />}
      />
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
        open={!!deletePremiumTarget}
        onClose={() => setDeletePremiumTarget(null)}
        onConfirm={executeDeletePremium}
        title={t('admin.deleteRequestTitle')}
        message={t('admin.irreversible')}
        confirmText={t('admin.delete')}
        confirmColor="#dc2626"
        icon={<FiTrash2 size={26} color="#dc2626" />}
      />
    </section>
  );
}
