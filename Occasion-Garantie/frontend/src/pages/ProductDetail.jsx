import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FiArrowLeft, FiShoppingBag, FiShield, FiCheck, FiMonitor, FiCpu, FiHardDrive, FiBattery, FiCamera, FiDroplet, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';
import api from '../api/axios';

const stateLabels = {
  neuf: 'Neuf',
  comme_neuf: 'Comme neuf',
  tres_bon: 'Très bon état',
  bon: 'Bon état',
  acceptable: 'État acceptable',
};

const specIcons = {
  Ecran: FiMonitor,
  Processeur: FiCpu,
  RAM: FiHardDrive,
  Stockage: FiHardDrive,
  Batterie: FiBattery,
  Appareil: FiCamera,
  Couleur: FiDroplet,
  GPU: FiMonitor,
  OS: FiMonitor,
};

const WHATSAPP_NUMBER = '212669017295';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`)
      .then((res) => setProduct(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="auth-page"><div className="spinner" /></div>;

  if (!product) return (
    <div className="auth-page">
      <div className="empty-state">
        <div className="icon"><FiShoppingBag size={48} /></div>
        <h2>Produit introuvable</h2>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: '16px' }}>
          <FiArrowLeft /> Retour aux produits
        </Link>
      </div>
    </div>
  );

  const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const imgUrl = product.image ? `${API_BASE}/uploads/${product.image}` : null;
  const waMsg = encodeURIComponent(`Bonjour ! Je suis intéressé(e) par : ${product.name} (${formatPrice(product.price)}) - ${window.location.href}`);
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;
  const specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : (product.specs || {});

  const allImages = [];
  if (product.image) allImages.push(product.image);
  if (product.gallery && Array.isArray(product.gallery)) {
    product.gallery.forEach((img) => {
      if (img !== product.image && !allImages.includes(img)) allImages.push(img);
    });
  }

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setSelectedImage(allImages[index]);
  };

  const closeLightbox = () => setSelectedImage(null);

  const prevImage = () => {
    setLightboxIndex((i) => (i - 1 + allImages.length) % allImages.length);
  };

  const nextImage = () => {
    setLightboxIndex((i) => (i + 1) % allImages.length);
  };

  return (
    <>
      <section style={{ paddingTop: '100px', paddingBottom: '60px' }}>
        <div className="container">
          <Link to="/products" className="btn btn-ghost" style={{ marginBottom: '24px' }}>
            <FiArrowLeft /> Retour aux produits
          </Link>

          <div className="product-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>
            <div>
              <div className="product-image" style={{ aspectRatio: '1', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', cursor: allImages.length > 0 ? 'pointer' : 'default' }} onClick={() => allImages.length > 0 && openLightbox(0)}>
                {imgUrl ? (
                  <img src={`${API_BASE}/uploads/${product.image}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <FiShoppingBag size={80} style={{ opacity: 0.15 }} />
                )}
                <span className="product-badge badge-warranty" style={{ bottom: '12px', left: '12px', top: 'auto', right: 'auto', fontSize: '14px', padding: '8px 16px' }}>
                  <FiShield size={14} /> Garantie {product.warranty}
                </span>
              </div>

              {allImages.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {allImages.map((img, i) => (
                    <div key={i} onClick={() => openLightbox(i)} style={{ width: '72px', height: '72px', borderRadius: '8px', overflow: 'hidden', border: i === 0 ? '2px solid var(--primary)' : '1px solid var(--border)', cursor: 'pointer', flexShrink: 0 }}>
                      <img src={`${API_BASE}/uploads/${img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="product-category" style={{ fontSize: '14px', marginBottom: '8px' }}>{product.category_name}</div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>{product.name}</h1>

              <div className="product-price" style={{ marginBottom: '16px' }}>
                <span className="price-current" style={{ fontSize: '36px' }}>{formatPrice(product.price)}</span>
                {product.old_price && <span className="price-old" style={{ fontSize: '20px' }}>{formatPrice(product.old_price)}</span>}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <span style={{ padding: '6px 14px', borderRadius: '20px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '13px', fontWeight: 600 }}>
                  {stateLabels[product.state] || product.state}
                </span>
                <span style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', fontSize: '13px', fontWeight: 600 }}>
                  <FiCheck size={12} /> Vérifié
                </span>
                {product.brand && (
                  <span style={{ padding: '6px 14px', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 600 }}>
                    {product.brand}
                  </span>
                )}
              </div>

              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '32px', fontSize: '15px' }}>
                {product.description}
              </p>

              {specs && Object.keys(specs).length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Fiche technique</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {Object.entries(specs).map(([key, val]) => {
                      const Icon = specIcons[key] || FiCpu;
                      return (
                        <div key={key} style={{
                          padding: '12px 16px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}>
                          <Icon size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key}</div>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{val}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  background: 'var(--gradient)',
                  color: 'white',
                  fontSize: '18px',
                  padding: '16px 36px',
                  width: '100%',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--gradient-hover)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--gradient)'}
              >
                <BsWhatsapp size={22} /> Acheter via WhatsApp
              </a>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>
                Réponse sous 24h | Paiement sécurisé
              </p>
            </div>
          </div>
        </div>
      </section>

      {selectedImage && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}><FiX size={24} /></button>
          <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}><FiChevronLeft size={28} /></button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={`${API_BASE}/uploads/${allImages[lightboxIndex]}`} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }} />
          </div>
          <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}><FiChevronRight size={28} /></button>
          <div className="lightbox-counter">{lightboxIndex + 1} / {allImages.length}</div>
        </div>
      )}
    </>
  );
}
