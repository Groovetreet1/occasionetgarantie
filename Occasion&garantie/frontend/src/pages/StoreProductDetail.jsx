import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FiArrowLeft, FiShoppingBag, FiCheck, FiMonitor, FiCpu, FiHardDrive, FiBattery, FiCamera, FiDroplet, FiX, FiChevronLeft, FiChevronRight, FiSend, FiCheckCircle, FiShield, FiLock, FiGrid } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const stateLabels = { neuf: 'products.stateNeuf', comme_neuf: 'products.stateCommeNeuf', tres_bon: 'products.stateTresBon', bon: 'products.stateBon', acceptable: 'products.stateAcceptableFull' };
const specIcons = { Ecran: FiMonitor, Processeur: FiCpu, RAM: FiHardDrive, Stockage: FiHardDrive, Batterie: FiBattery, Appareil: FiCamera, Couleur: FiDroplet, GPU: FiMonitor, OS: FiMonitor };

export default function StoreProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [similar, setSimilar] = useState([]);

  useEffect(() => { window.scrollTo(0, 0); setLoading(true); api.get(`/store/products/${slug}`).then(r => setProduct(r.data)).catch(() => {}).finally(() => setLoading(false)); }, [slug]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    api.get('/store/products', { params: { category: product.category_name, limit: 6 } })
      .then(res => {
        if (cancelled) return;
        const list = (res.data.products || []).filter(p => String(p.id) !== String(product.id)).slice(0, 4);
        setSimilar(list);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formPhone) return;
    setSubmitting(true);
    try {
      await api.post('/store/contact', { productId: product.id, name: formName, phone: formPhone, message: formMsg, productName: product.name });
      setDone(true);
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
    setSubmitting(false);
  };

  const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';
  const API_BASE = import.meta.env.VITE_API_URL || '';
  let specs = {};
  try { specs = typeof product?.specs === 'string' ? JSON.parse(product.specs) : (product?.specs || {}); } catch {}

  const allImages = [];
  if (product?.image) allImages.push(product.image);
  if (product?.gallery && Array.isArray(product.gallery)) { product.gallery.forEach(img => { if (img !== product.image && !allImages.includes(img)) allImages.push(img); }); }

  const openLightbox = (i) => { setLightboxIndex(i); setSelectedImage(allImages[i]); };
  const closeLightbox = () => setSelectedImage(null);
  const prevImage = () => setLightboxIndex(i => (i - 1 + allImages.length) % allImages.length);
  const nextImage = () => setLightboxIndex(i => (i + 1) % allImages.length);

  if (loading) return <div className="auth-page"><div className="spinner" /></div>;
  if (!product) return <div className="auth-page"><div className="empty-state"><div className="icon"><FiShoppingBag size={48} /></div><h2>{t('shop.notFound')}</h2><Link to="/boutique" className="btn btn-primary" style={{ marginTop: 16 }}><FiArrowLeft /> {t('shop.backToStore')}</Link></div></div>;

  return (
    <section className="product-detail-section" style={{ paddingTop: '100px' }}>
      <div className="container">
        <Link to="/boutique" className="btn btn-ghost" style={{ marginBottom: '24px' }}><FiArrowLeft /> {t('shop.backToStore')}</Link>
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#d97706', fontWeight: 600 }}>
          <FiShield size={16} /> {t('shop.storeBanner')}
        </div>
        <div className="product-detail-grid">
          <div>
            <div className="product-detail-image" style={{ cursor: allImages.length > 0 ? 'pointer' : 'default' }} onClick={() => allImages.length > 0 && openLightbox(0)}>
              {product.image ? <img src={product.image.startsWith('http') ? product.image : `${API_BASE}/uploads/${product.image}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FiShoppingBag size={80} style={{ opacity: 0.15 }} />}
            </div>
            {allImages.length > 1 && (
              <div className="product-detail-thumbs">
                {allImages.slice(0, 3).map((img, i) => (
                  <div key={i} onClick={() => openLightbox(i)} className={`product-detail-thumb${i === 0 ? ' active' : ''}`}>
                    <img src={img.startsWith('http') ? img : `${API_BASE}/uploads/${img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {allImages.length > 3 && i === 2 && (
                      <div className="product-detail-thumb-more">+{allImages.length - 3}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {similar.length > 0 && (
              <div style={{ marginTop: 24, border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, background: 'var(--bg-card)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiGrid size={16} style={{ color: 'var(--primary)' }} /> {t('shop.similarProducts')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {similar.map(p => (
                    <Link key={p.id} to={`/boutique/${p.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 10, background: 'var(--bg-secondary)', textDecoration: 'none', color: 'var(--text)', border: '1px solid transparent', transition: 'all .2s' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                      <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.image ? <img src={p.image.startsWith('http') ? p.image : `${API_BASE}/uploads/${p.image}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FiShoppingBag size={22} style={{ opacity: 0.2 }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>
                          {formatPrice(p.price)}
                          {p.old_price && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: 6 }}>{formatPrice(p.old_price)}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="product-detail-category">{product.category_name}</div>
            <h1 className="product-detail-name">{product.name}</h1>
            <div className="product-detail-price">
              <span className="price-current">{formatPrice(product.price)}</span>
              {product.old_price && <span className="price-old">{formatPrice(product.old_price)}</span>}
            </div>
            <div className="product-detail-tags">
              <span className="product-detail-tag state">{t(stateLabels[product.state] || product.state)}</span>
              <span className="product-detail-tag verified"><FiCheck size={12} /> {t('shop.verified')}</span>
              {product.brand && <span className="product-detail-tag brand">{product.brand}</span>}
            </div>
            <p className="product-detail-desc">{product.description}</p>

            {specs && Object.keys(specs).length > 0 && Object.entries(specs).some(([, v]) => v !== null && v !== undefined && String(v).trim() !== '') && (
              <div className="product-detail-specs">
                <h3>{t('shop.techSpecs')}</h3>
                <div className="product-detail-specs-grid">
                  {Object.entries(specs).filter(([, val]) => val !== null && val !== undefined && String(val).trim() !== '').map(([key, val]) => {
                    const Icon = specIcons[key] || FiCpu;
                    return <div key={key} style={{ padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <div><div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key}</div><div style={{ fontSize: '13px', fontWeight: 600 }}>{val}</div></div>
                    </div>;
                  })}
                </div>
              </div>
            )}

            <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{t('shop.interestedTitle')}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{t('shop.interestedDesc')}</p>
              {!user ? (
                <div
                  style={{
                    width: '100%', marginTop: 24, textAlign: 'center',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '24px 20px',
                  }}
                >
                  <FiLock size={28} style={{ color: 'var(--primary)', opacity: 0.9 }} />
                  <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '10px' }}>
                    {t('shop.loginToContact')}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px auto 16px', maxWidth: '280px' }}>
                    {t('shop.loginToContactDesc')}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/login" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
                      {t('shop.login')}
                    </Link>
                    <Link to="/signup" className="btn" style={{ padding: '10px 24px', fontSize: '14px' }}>
                      {t('shop.signup')}
                    </Link>
                  </div>
                </div>
              ) : done ? (
                <div style={{ textAlign: 'center', padding: 24, background: 'rgba(16,185,129,0.1)', borderRadius: 12 }}>
                  <FiCheckCircle size={40} style={{ color: '#10b981', marginBottom: 8 }} />
                  <div style={{ fontSize: 14, color: '#10b981', fontWeight: 600 }}>{t('shop.messageSent')}</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder={t('shop.namePlaceholder')} required style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }} />
                  <input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder={t('shop.phonePlaceholder')} required style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }} />
                  <textarea value={formMsg} onChange={e => setFormMsg(e.target.value)} placeholder={t('shop.msgPlaceholder')} rows={2} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)', resize: 'vertical' }} />
                  <button type="submit" disabled={submitting || !formName || !formPhone} className="btn btn-primary" style={{ justifyContent: 'center', padding: '14px', fontSize: 15 }}>
                    <FiSend size={16} /> {submitting ? t('shop.sending') : t('shop.sendRequest')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}><FiX size={24} /></button>
          <button className="lightbox-nav lightbox-prev" onClick={e => { e.stopPropagation(); prevImage(); }}><FiChevronLeft size={28} /></button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={allImages[lightboxIndex].startsWith('http') ? allImages[lightboxIndex] : `${API_BASE}/uploads/${allImages[lightboxIndex]}`} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
          </div>
          <button className="lightbox-nav lightbox-next" onClick={e => { e.stopPropagation(); nextImage(); }}><FiChevronRight size={28} /></button>
          <div className="lightbox-counter">{lightboxIndex + 1} / {allImages.length}</div>
        </div>
      )}
    </section>
  );
}
