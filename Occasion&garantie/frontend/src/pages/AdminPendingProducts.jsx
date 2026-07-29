import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiPackage, FiCheck, FiX, FiClock, FiDollarSign, FiMapPin, FiTag, FiShield, FiBox, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';

const API_BASE = import.meta.env.VITE_API_URL || '';

const imgSrc = (path) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_BASE}/uploads/${path.replace(/^uploads\//, '')}`;
};

const stateLabels = {
  neuf: 'Neuf',
  tres_bon: 'Très bon',
  bon: 'Bon',
  satisfaisant: 'Satisfaisant',
};

export default function AdminPendingProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [approveDone, setApproveDone] = useState(null);
  const [rejectReasons, setRejectReasons] = useState([]);
  const [rejectConfirming, setRejectConfirming] = useState(false);
  const [rejectSubmitted, setRejectSubmitted] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [quickApprove, setQuickApprove] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/products/pending').then(res => setProducts(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openProduct = (p) => {
    setSelectedProduct(p);
    setApproveDone(null);
    setRejectReasons([]);
    setRejectConfirming(false);
    setRejectSubmitted(false);
    setGalleryIndex(0);
  };

  const closeProduct = () => {
    setSelectedProduct(null);
    setApproveDone(null);
    setRejectReasons([]);
    setRejectConfirming(false);
    setRejectSubmitted(false);
    setGalleryIndex(0);
  };

  const handleApprove = async () => {
    if (!selectedProduct) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/products/${selectedProduct.id}/approve`);
      setApproveDone(true);
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
    } catch (e) {
      alert(e?.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleReason = (reason) => {
    setRejectReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const handleReject = async () => {
    if (!selectedProduct || rejectReasons.length === 0) return;
    setActionLoading(true);
    const reason = rejectReasons.join(' ; ');
    try {
      await api.put(`/admin/products/${selectedProduct.id}/reject`, { reason });
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      setRejectSubmitted(true);
    } catch (e) {
      alert(e?.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const getGallery = (p) => {
    if (!p) return [];
    const imgs = [];
    if (p.image) imgs.push(p.image);
    if (p.gallery) {
      try {
        const g = typeof p.gallery === 'string' ? JSON.parse(p.gallery) : p.gallery;
        if (Array.isArray(g)) imgs.push(...g);
      } catch {}
    }
    return imgs;
  };

  const rejectOptions = [
    { value: 'اسم المنتج غير مناسب', label: 'اسم المنتج (Nom)' },
    { value: 'الثمن غير مناسب', label: 'الثمن (Prix)' },
    { value: 'الصور غير واضحة', label: 'الصور (Photos)' },
    { value: 'الوصف غير كافٍ', label: 'الوصف (Description)' },
  ];

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: 8 }}><FiArrowLeft /> Dashboard</Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiPackage size={28} style={{ color: 'var(--primary)' }} /> Produits en attente
          </h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <FiPackage size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>Aucun produit en attente d'approbation.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {products.map(p => (
              <div key={p.id}
                onClick={() => openProduct(p)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', cursor: 'pointer' }}>
                {p.image && (
                  <img src={imgSrc(p.image)} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {p.store_name || p.seller_name} | {p.price} DH | {new Date(p.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button onClick={(e) => { e.stopPropagation(); setQuickApprove(p.id); }}
                    className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                    <FiCheck size={13} /> Approuver
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); openProduct(p); }} className="btn btn-outline" style={{ fontSize: 12, padding: '6px 14px', color: 'var(--error)', borderColor: 'var(--error)' }}>
                    <FiX size={13} /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!quickApprove}
        onClose={() => setQuickApprove(null)}
        onConfirm={async () => {
          const id = quickApprove;
          setQuickApprove(null);
          try { await api.put(`/admin/products/${id}/approve`); setProducts(prev => prev.filter(x => x.id !== id)); } catch {}
        }}
        title="Approuver ce produit ?"
        message="Le produit sera visible sur le site."
        confirmText="Approuver"
        confirmColor="#059669"
      />
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}
          onClick={closeProduct}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, maxWidth: 640, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>

            {approveDone ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <FiCheck size={32} color="#059669" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Merci!</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                  L'annonce "{selectedProduct.name}" a été approuvée avec succès.
                </p>
                <button className="btn btn-primary" onClick={closeProduct}>Fermer</button>
              </div>
            ) : rejectSubmitted ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <FiX size={32} color="#dc2626" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Annonce refusée</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
                  L'annonce "{selectedProduct.name}" a été refusée.
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, background: 'var(--bg-secondary)', padding: 12, borderRadius: 10 }}>
                  Raison envoyée au vendeur :<br/><strong>{rejectReasons.join(' ; ')}</strong>
                </p>
                <button className="btn btn-primary" onClick={closeProduct}>Fermer</button>
              </div>
            ) : rejectConfirming && !rejectSubmitted ? (
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>سبب الرفض :</h3>
                  <button onClick={() => { setRejectConfirming(false); setRejectReasons([]); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                    <FiX size={18} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {rejectOptions.map(opt => (
                    <label key={opt.value} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      borderRadius: 10, cursor: 'pointer', fontSize: 14,
                      background: rejectReasons.includes(opt.value) ? 'rgba(239,68,68,0.1)' : 'var(--bg-secondary)',
                      border: rejectReasons.includes(opt.value) ? '1px solid var(--error)' : '1px solid var(--border)',
                    }}>
                      <input type="checkbox" checked={rejectReasons.includes(opt.value)}
                        onChange={() => toggleReason(opt.value)}
                        style={{ accentColor: 'var(--error)' }} />
                      <span>{opt.value}</span>
                    </label>
                  ))}
                </div>
                <button onClick={handleReject} disabled={rejectReasons.length === 0 || actionLoading}
                  className="form-submit" style={{ width: '100%', justifyContent: 'center', background: 'var(--error)', borderColor: 'var(--error)', padding: 12 }}>
                  <FiX size={14} /> {actionLoading ? '...' : 'تأكيد الرفض (Confirmer)'}
                </button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', background: 'var(--bg-secondary)' }}>
                  {(() => {
                    const gallery = getGallery(selectedProduct);
                    const currentImg = gallery[galleryIndex] || '';
                    return currentImg ? (
                      <img src={imgSrc(currentImg)} alt="" style={{ width: '100%', height: 320, objectFit: 'contain', display: 'block', background: '#f1f5f9' }} />
                    ) : (
                      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <FiPackage size={48} />
                      </div>
                    );
                  })()}
                  {(() => {
                    const gallery = getGallery(selectedProduct);
                    if (gallery.length > 1) {
                      return (
                        <>
                          <button onClick={() => setGalleryIndex(i => Math.max(0, i - 1))}
                            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <FiChevronLeft size={18} />
                          </button>
                          <button onClick={() => setGalleryIndex(i => Math.min(gallery.length - 1, i + 1))}
                            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <FiChevronRight size={18} />
                          </button>
                          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, padding: '2px 10px', borderRadius: 10 }}>
                            {galleryIndex + 1}/{gallery.length}
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
                  <button onClick={closeProduct} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                    <FiX size={18} />
                  </button>
                </div>

                {(() => {
                  const gallery = getGallery(selectedProduct);
                  if (gallery.length > 1) {
                    return (
                      <div style={{ display: 'flex', gap: 6, padding: '8px 16px', overflowX: 'auto' }}>
                        {gallery.map((img, i) => (
                          <img key={i} src={imgSrc(img)} alt=""
                            onClick={() => setGalleryIndex(i)}
                            style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: i === galleryIndex ? '2px solid var(--primary)' : '2px solid transparent', flexShrink: 0 }} />
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}

                <div style={{ padding: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{selectedProduct.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{selectedProduct.price} DH</span>
                    {selectedProduct.old_price && (
                      <span style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{selectedProduct.old_price} DH</span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 6 }}>
                      {new Date(selectedProduct.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {selectedProduct.category_name && (
                      <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiTag size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Catégorie:</span> {selectedProduct.category_name}
                      </div>
                    )}
                    {selectedProduct.brand && (
                      <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiBox size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Marque:</span> {selectedProduct.brand}
                      </div>
                    )}
                    {selectedProduct.state && (
                      <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiShield size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>État:</span> {stateLabels[selectedProduct.state] || selectedProduct.state}
                      </div>
                    )}
                    {selectedProduct.warranty && (
                      <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiClock size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Garantie:</span> {selectedProduct.warranty}
                      </div>
                    )}
                    {selectedProduct.ville && (
                      <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiMapPin size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Ville:</span> {selectedProduct.ville}
                      </div>
                    )}
                    {selectedProduct.stock !== undefined && (
                      <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiPackage size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Stock:</span> {selectedProduct.stock}
                      </div>
                    )}
                    <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiDollarSign size={13} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Vendeur:</span> {selectedProduct.store_name || selectedProduct.seller_name}
                    </div>
                  </div>

                  {selectedProduct.description && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Description</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{selectedProduct.description}</p>
                    </div>
                  )}

                  {selectedProduct.specs && (() => {
                    try {
                      const specs = typeof selectedProduct.specs === 'string' ? JSON.parse(selectedProduct.specs) : selectedProduct.specs;
                      if (specs && typeof specs === 'object' && Object.keys(specs).length > 0) {
                        return (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Spécifications</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                              {Object.entries(specs).map(([k, v]) => (
                                <div key={k} style={{ fontSize: 12, padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 6 }}>
                                  <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                                  <span style={{ fontWeight: 600 }}>{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    } catch {}
                    return null;
                  })()}

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', gap: 10 }}>
                    <button onClick={handleApprove} disabled={actionLoading} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '12px 16px' }}>
                      <FiCheck size={16} /> {actionLoading ? '...' : 'Approuver'}
                    </button>
                    <button onClick={() => setRejectConfirming(true)} disabled={actionLoading} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '12px 16px', color: 'var(--error)', borderColor: 'var(--error)' }}>
                      <FiX size={16} /> Refuser
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
