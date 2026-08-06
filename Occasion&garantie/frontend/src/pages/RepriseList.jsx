import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiSmartphone, FiClock, FiRefreshCw, FiCheck, FiX, FiPhone, FiDollarSign, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import ConfirmModal from '../components/ConfirmModal';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const statusStyles = {
  en_attente: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'reprise.statusNew' },
  estime: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'reprise.statusEstimated' },
  accepte: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'reprise.statusAccepted' },
  refuse: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'reprise.statusRefused' },
  converti: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6', label: 'reprise.statusConverted' },
};

export default function RepriseList() {
  const { t } = useLanguage();
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');
  const [reprises, setReprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [photoErrors, setPhotoErrors] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [reprisePhotos, setReprisePhotos] = useState({});
  const [refuseTarget, setRefuseTarget] = useState(null);
  const [refuseReason, setRefuseReason] = useState('');

  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isVendor = user.role === 'seller' || user.role === 'admin';

  const load = () => {
    setLoading(true);
    setError(null);
    api.get('/reprises').then(res => setReprises(res.data)).catch(e => setError(e?.response?.data?.message || e.message || t('reprise.loadErrorFallback'))).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (reprises.length === 0) return;
    const withPhotos = reprises.filter(r => r.photo_count > 0).map(r => r.id);
    if (withPhotos.length === 0) return;
    const t = setTimeout(() => {
      api.get(`/reprises/photos/batch?ids=${withPhotos.join(',')}`).then(res => setReprisePhotos(res.data)).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [reprises]);

  const update = async (id, data) => {
    setActionLoading(id);
    try {
      await api.put(`/reprises/${id}`, data);
      load();
    } catch {}
    setActionLoading(null);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget);
    try {
      await api.delete(`/reprises/${deleteTarget}`);
      setDeleteTarget(null);
      load();
    } catch {}
    setActionLoading(null);
  };

  const del = (id) => setDeleteTarget(id);

  const imgUrl = (p) => p?.startsWith('http') || p?.startsWith('data:') ? p : `${API_BASE}${p}`;

  const getPhotos = (id) => reprisePhotos[id] || {};

  const productImgs = (r) => {
    if (!r.product_images) return [];
    const imgs = typeof r.product_images === 'object' ? r.product_images : (() => { try { return JSON.parse(r.product_images); } catch { return []; } })();
    return Array.isArray(imgs) ? imgs.map(i => imgUrl(i)) : [];
  };

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            {isAdminArea ? (
              <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: 8 }}><FiArrowLeft /> {t('admin.dashboardTitle')}</Link>
            ) : (
              <Link to="/" className="btn btn-ghost" style={{ marginBottom: 8 }}><FiArrowLeft /> {t('reprise.homeLink')}</Link>
            )}
            <h1 style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiSmartphone size={28} style={{ color: 'var(--primary)' }} /> {t('reprise.pageTitle')}
            </h1>
          </div>
          <button onClick={load} className="btn btn-ghost" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiRefreshCw size={14} /> {t('reprise.refresh')}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="spinner" /></div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#ef4444' }}>
            <p>{t('reprise.errorLabel')} {error}</p>
            <button onClick={load} className="btn btn-ghost" style={{ marginTop: 12 }}>{t('reprise.retry')}</button>
          </div>
        ) : reprises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <FiSmartphone size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>{t('reprise.emptyTitle')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reprises.map(r => {
              const st = statusStyles[r.status] || statusStyles.en_attente;
              const photos = getPhotos(r.id);
              const hasPhotos = r.photo_count > 0;
              const pImgs = productImgs(r);

              return (
                <div key={r.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                }}>
                  {/* Product info header */}
                  {r.product_name && (
                    <div style={{
                      background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                        {pImgs.length > 0 && (
                          <img src={pImgs[0]} alt={r.product_name} style={{
                            width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)',
                          }} />
                        )}
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                          {t('reprise.article', { name: r.product_name })}
                        </div>
                      </div>
                      {pImgs.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px', overflowX: 'auto' }}>
                          {pImgs.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt="" style={{
                                width: 60, height: 60, borderRadius: 6, objectFit: 'cover',
                                border: '1px solid var(--border)', flexShrink: 0,
                              }} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Client + status row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{r.brand} {r.model}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {r.full_name || t('reprise.anonymous')}
                          {r.imei ? t('reprise.imeiInfo', { imei: r.imei }) : ''}
                        </div>
                        {isVendor && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiShoppingBag size={12} />
                            {r.vendor_store_name ? t('reprise.handledBy', { store: r.vendor_store_name }) : t('reprise.handledByNone')}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          <FiClock size={11} /> {new Date(r.created_at).toLocaleDateString('fr-FR')} {t('reprise.at')} {new Date(r.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                        background: st.bg, color: st.color,
                      }}>
                        {st.label && t(st.label)}
                      </span>
                    </div>

                    {/* Client notes */}
                    {r.client_notes && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                        {r.client_notes}
                      </div>
                    )}

                    {/* Reprise photos */}
                    {hasPhotos && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {Object.keys(photos).length > 0 ? Object.entries(photos).map(([key, url]) => (
                          <div key={key} onClick={() => setLightbox(imgUrl(url))} style={{
                            width: 64, height: 64, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                            border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                          }}>
                            <img src={imgUrl(url)} alt={key} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={() => setPhotoErrors(p => ({ ...p, [r.id + '-' + key]: true }))} />
                          </div>
                        )) : Array.from({ length: r.photo_count }).map((_, i) => (
                          <div key={i} style={{
                            width: 64, height: 64, borderRadius: 8, border: '1px solid var(--border)',
                            background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, color: 'var(--text-muted)',
                          }}>...</div>
                        ))}
                      </div>
                    )}

                    {r.status === 'refuse' && r.vendor_notes && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', padding: '4px 0' }}>
                        {t('reprise.reasonLabel')} {r.vendor_notes}
                      </div>
                    )}

                    {isVendor && r.status === 'en_attente' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => update(r.id, { status: 'accepte' })}
                          disabled={actionLoading === r.id}
                          className="btn btn-primary" style={{ fontSize: 12, padding: '8px 16px', flex: 1, justifyContent: 'center' }}>
                          {actionLoading === r.id ? '...' : <><FiCheck size={14} /> {t('reprise.accept')}</>}
                        </button>
                        <button onClick={() => { setRefuseTarget(r.id); setRefuseReason(''); }} disabled={actionLoading === r.id}
                          className="btn btn-primary" style={{ fontSize: 12, padding: '8px 16px', flex: 1, justifyContent: 'center', background: '#ef4444' }}>
                          {actionLoading === r.id ? '...' : <><FiX size={14} /> {t('reprise.refuse')}</>}
                        </button>
                      </div>
                    )}

                    {isVendor && r.status === 'accepte' && r.phone && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        background: 'rgba(16,185,129,0.08)', borderRadius: 10,
                      }}>
                        <FiPhone size={16} style={{ color: '#10b981' }} />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{r.phone}</span>
                        <a href={`tel:${r.phone}`} className="btn btn-primary" style={{
                          fontSize: 11, padding: '5px 12px', marginLeft: 'auto', textDecoration: 'none',
                        }}>
                          <FiPhone size={12} /> {t('reprise.call')}
                        </a>
                      </div>
                    )}

                    {isVendor && (r.status === 'accepte' || r.status === 'refuse' || r.status === 'converti') && (
                      <button onClick={() => del(r.id)} disabled={actionLoading === r.id}
                        className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', alignSelf: 'flex-start', background: '#ef4444' }}>
                        <FiTrash2 size={13} /> {t('reprise.delete')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {refuseTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setRefuseTarget(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)', borderRadius: 20, padding: 32, maxWidth: 380, width: '100%',
                boxShadow: '0 25px 80px rgba(0,0,0,0.35)', textAlign: 'center',
              }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FiX size={26} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('reprise.refuseTitle')}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
                {t('reprise.refuseReasonOptional')}
              </p>
              <textarea value={refuseReason} onChange={e => setRefuseReason(e.target.value)} placeholder={t('reprise.refuseReasonPlaceholder')}
                style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, resize: 'vertical', fontFamily: 'var(--font)', marginBottom: 20, textAlign: 'left', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setRefuseTarget(null)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px 0' }}>
                  {t('reprise.cancel')}
                </button>
                <button onClick={() => { update(refuseTarget, { status: 'refuse', vendor_notes: refuseReason || null }); setRefuseTarget(null); }}
                  className="form-submit" style={{ flex: 1, justifyContent: 'center', padding: '10px 0', background: '#ef4444', borderColor: '#ef4444' }}>
                  <FiX size={14} /> {t('reprise.refuse')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 20,
        }}>
          <img src={lightbox} alt="" style={{
            maxWidth: '100%', maxHeight: '100%', borderRadius: 8, objectFit: 'contain',
          }} />
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => !actionLoading && setDeleteTarget(null)}
        onConfirm={executeDelete}
        title={t('reprise.deleteConfirmTitle')}
        message={t('reprise.deleteConfirmMessage')}
        confirmText={t('reprise.deleteConfirmText')}
        confirmColor="#dc2626"
        icon={<FiTrash2 size={26} color="#dc2626" />}
      />
    </section>
  );
}
