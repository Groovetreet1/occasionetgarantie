import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiSmartphone, FiClock, FiRefreshCw, FiCheck, FiX, FiPhone, FiMessageCircle, FiDollarSign, FiTrash2 } from 'react-icons/fi';
import ConfirmModal from '../components/ConfirmModal';
import api from '../api/axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [photoErrors, setPhotoErrors] = useState({});
  const [lightbox, setLightbox] = useState(null);

  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isVendor = user.role === 'seller' || user.role === 'admin';

  const load = () => {
    setLoading(true);
    setError(null);
    api.get('/reprises').then(res => setReprises(res.data)).catch(e => setError(e?.response?.data?.message || e.message || 'Erreur de chargement')).finally(() => setLoading(false));
  };

  const [photosReady, setPhotosReady] = useState(false);

  useEffect(() => { load(); }, []);

  useEffect(() => { if (reprises.length > 0) { const t = setTimeout(() => setPhotosReady(true), 300); return () => clearTimeout(t); } }, [reprises]);

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

  const parsePhotos = (r) => {
    if (!r.photos) return {};
    if (typeof r.photos === 'object') return r.photos;
    try { return JSON.parse(r.photos); } catch { return {}; }
  };

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
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#ef4444' }}>
            <p>Erreur: {error}</p>
            <button onClick={load} className="btn btn-ghost" style={{ marginTop: 12 }}>Reessayer</button>
          </div>
        ) : reprises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <FiSmartphone size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>Aucune demande de reprise pour le moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reprises.map(r => {
              const st = statusStyles[r.status] || statusStyles.en_attente;
              const photos = parsePhotos(r);
              const hasPhotos = Object.keys(photos).length > 0;
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
                          Article: {r.product_name}
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
                          {r.full_name || 'Anonyme'}
                          {r.imei ? ` | IMEI: ${r.imei}` : ''}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          <FiClock size={11} /> {new Date(r.created_at).toLocaleDateString('fr-FR')} a {new Date(r.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                        background: st.bg, color: st.color,
                      }}>
                        {st.label}
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
                        {Object.entries(photos).map(([key, url]) => (
                          <div key={key} onClick={() => setLightbox(imgUrl(url))} style={{
                            width: 64, height: 64, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                            border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                          }}>
                            {photosReady ? (
                              <img src={imgUrl(url)} alt={key} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={() => setPhotoErrors(p => ({ ...p, [r.id + '-' + key]: true }))} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-muted)' }}>...</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {r.status === 'refuse' && r.vendor_notes && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', padding: '4px 0' }}>
                        Raison: {r.vendor_notes}
                      </div>
                    )}

                    {isVendor && r.status === 'en_attente' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => update(r.id, { status: 'accepte' })}
                          disabled={actionLoading === r.id}
                          className="btn btn-primary" style={{ fontSize: 12, padding: '8px 16px', flex: 1, justifyContent: 'center' }}>
                          {actionLoading === r.id ? '...' : <><FiCheck size={14} /> Accepter</>}
                        </button>
                        <button onClick={() => {
                          const reason = prompt('Raison du refus (optionnel) :');
                          update(r.id, { status: 'refuse', vendor_notes: reason || null });
                        }} disabled={actionLoading === r.id}
                          className="btn btn-primary" style={{ fontSize: 12, padding: '8px 16px', flex: 1, justifyContent: 'center', background: '#ef4444' }}>
                          {actionLoading === r.id ? '...' : <><FiX size={14} /> Refuser</>}
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
                          <FiPhone size={12} /> Appeler
                        </a>
                        <a href={`https://wa.me/${r.phone.replace(/^0+/, '')}`} target="_blank" rel="noopener noreferrer"
                          className="btn btn-primary" style={{
                            fontSize: 11, padding: '5px 12px', background: '#25D366', textDecoration: 'none',
                          }}>
                          <FiMessageCircle size={12} /> WhatsApp
                        </a>
                      </div>
                    )}

                    {isVendor && (r.status === 'accepte' || r.status === 'refuse' || r.status === 'converti') && (
                      <button onClick={() => del(r.id)} disabled={actionLoading === r.id}
                        className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', alignSelf: 'flex-start', background: '#ef4444' }}>
                        <FiTrash2 size={13} /> Supprimer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
        title="Supprimer cette demande ?"
        message="Cette action est irreversible."
        confirmText="Supprimer"
        confirmColor="#dc2626"
        icon={<FiTrash2 size={26} color="#dc2626" />}
      />
    </section>
  );
}
