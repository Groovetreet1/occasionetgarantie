import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FiArrowLeft, FiShoppingBag, FiCheck, FiMonitor, FiCpu, FiHardDrive, FiBattery, FiCamera, FiDroplet, FiX, FiChevronLeft, FiChevronRight, FiSend, FiCheckCircle, FiShield } from 'react-icons/fi';
import api from '../api/axios';

const stateLabels = { neuf: 'Neuf', comme_neuf: 'Comme neuf', tres_bon: 'Très bon état', bon: 'Bon état', acceptable: 'État acceptable' };
const specIcons = { Ecran: FiMonitor, Processeur: FiCpu, RAM: FiHardDrive, Stockage: FiHardDrive, Batterie: FiBattery, Appareil: FiCamera, Couleur: FiDroplet, GPU: FiMonitor, OS: FiMonitor };

export default function StoreProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); setLoading(true); api.get(`/store/products/${slug}`).then(r => setProduct(r.data)).catch(() => {}).finally(() => setLoading(false)); }, [slug]);

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
  if (!product) return <div className="auth-page"><div className="empty-state"><div className="icon"><FiShoppingBag size={48} /></div><h2>Produit introuvable</h2><Link to="/boutique" className="btn btn-primary" style={{ marginTop: 16 }}><FiArrowLeft /> Retour a la boutique</Link></div></div>;

  return (
    <section className="product-detail-section" style={{ paddingTop: '100px' }}>
      <div className="container">
        <Link to="/boutique" className="btn btn-ghost" style={{ marginBottom: '24px' }}><FiArrowLeft /> Retour a la boutique</Link>
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#d97706', fontWeight: 600 }}>
          <FiShield size={16} /> Boutique Officielle Occasion & Garantie
        </div>
        <div className="product-detail-grid">
          <div>
            <div className="product-detail-image" style={{ cursor: allImages.length > 0 ? 'pointer' : 'default' }} onClick={() => allImages.length > 0 && openLightbox(0)}>
              {product.image ? <img src={product.image.startsWith('http') ? product.image : `${API_BASE}/uploads/${product.image}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FiShoppingBag size={80} style={{ opacity: 0.15 }} />}
            </div>
            {allImages.length > 1 && (
              <div className="product-detail-thumbs">
                {allImages.map((img, i) => (
                  <div key={i} onClick={() => openLightbox(i)} className={`product-detail-thumb${i === 0 ? ' active' : ''}`}>
                    <img src={img.startsWith('http') ? img : `${API_BASE}/uploads/${img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
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
              <span className="product-detail-tag state">{stateLabels[product.state] || product.state}</span>
              <span className="product-detail-tag verified"><FiCheck size={12} /> Verifie</span>
              {product.brand && <span className="product-detail-tag brand">{product.brand}</span>}
            </div>
            <p className="product-detail-desc">{product.description}</p>

            {specs && Object.keys(specs).length > 0 && (
              <div className="product-detail-specs">
                <h3>Fiche technique</h3>
                <div className="product-detail-specs-grid">
                  {Object.entries(specs).map(([key, val]) => {
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
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Vous etes interesse ?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Laissez vos coordonnees, nous vous contacterons.</p>
              {done ? (
                <div style={{ textAlign: 'center', padding: 24, background: 'rgba(16,185,129,0.1)', borderRadius: 12 }}>
                  <FiCheckCircle size={40} style={{ color: '#10b981', marginBottom: 8 }} />
                  <div style={{ fontSize: 14, color: '#10b981', fontWeight: 600 }}>Message envoye ! Nous vous contacterons dans les plus brefs delais.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Votre nom *" required style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }} />
                  <input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="Votre telephone *" required style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }} />
                  <textarea value={formMsg} onChange={e => setFormMsg(e.target.value)} placeholder="Message (optionnel)" rows={2} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)', resize: 'vertical' }} />
                  <button type="submit" disabled={submitting || !formName || !formPhone} className="btn btn-primary" style={{ justifyContent: 'center', padding: '14px', fontSize: 15 }}>
                    <FiSend size={16} /> {submitting ? 'Envoi...' : 'Envoyer ma demande'}
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
