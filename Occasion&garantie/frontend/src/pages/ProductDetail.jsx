import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FiArrowLeft, FiShoppingBag, FiShield, FiCheck, FiMonitor, FiCpu, FiHardDrive, FiBattery, FiCamera, FiDroplet, FiX, FiChevronLeft, FiChevronRight, FiUser, FiMessageCircle } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const stateLabels = {
  neuf: 'Neuf',
  comme_neuf: 'Comme neuf',
  tres_bon: 'Très bon état',
  bon: 'Bon état',
  acceptable: 'État acceptable',
};

const specIcons = {
  Ecran: FiMonitor, Processeur: FiCpu, RAM: FiHardDrive,
  Stockage: FiHardDrive, Batterie: FiBattery, Appareil: FiCamera,
  Couleur: FiDroplet, GPU: FiMonitor, OS: FiMonitor,
};

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    api.get(`/products/${slug}`)
      .then((res) => setProduct(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleStartChat = async () => {
    if (!user) return navigate('/login');
    if (!product.seller_id) return;
    try {
      const { data } = await api.post('/chat/conversations', {
        sellerId: product.seller_id,
        productId: product.id,
        productName: product.name,
      });
      navigate(`/messenger/${data.id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

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
  const waMsg = encodeURIComponent(`Bonjour ! Je suis intéresse(e) par : ${product.name} (${formatPrice(product.price)})`);
  const sellerPhone = product.seller_phone ? product.seller_phone.replace(/^0+/, '') : null;
  const waUrl = sellerPhone ? `https://wa.me/${sellerPhone}?text=${waMsg}` : null;
  const specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : (product.specs || {});

  const allImages = [];
  if (product.image) allImages.push(product.image);
  if (product.gallery && Array.isArray(product.gallery)) {
    product.gallery.forEach((img) => {
      if (img !== product.image && !allImages.includes(img)) allImages.push(img);
    });
  }

  const openLightbox = (i) => { setLightboxIndex(i); setSelectedImage(allImages[i]); };
  const closeLightbox = () => setSelectedImage(null);
  const prevImage = () => setLightboxIndex((i) => (i - 1 + allImages.length) % allImages.length);
  const nextImage = () => setLightboxIndex((i) => (i + 1) % allImages.length);

  return (
    <>
      <section className="product-detail-section">
        <div className="container">
          <Link to="/products" className="btn btn-ghost" style={{ marginBottom: '24px' }}>
            <FiArrowLeft /> Retour aux produits
          </Link>

          <div className="product-detail-grid">
            <div>
              <div className="product-detail-image" style={{ cursor: allImages.length > 0 ? 'pointer' : 'default' }} onClick={() => allImages.length > 0 && openLightbox(0)}>
                {product.image ? (
                  <img src={`${API_BASE}/uploads/${product.image}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <FiShoppingBag size={80} style={{ opacity: 0.15 }} />
                )}
                <span className="product-badge badge-warranty" style={{ bottom: '12px', left: '12px', top: 'auto', right: 'auto', fontSize: '14px', padding: '8px 16px' }}>
                  <FiShield size={14} /> Garantie {product.warranty}
                </span>
              </div>
              {allImages.length > 1 && (
                <div className="product-detail-thumbs">
                  {allImages.map((img, i) => (
                    <div key={i} onClick={() => openLightbox(i)} className={`product-detail-thumb${i === 0 ? ' active' : ''}`}>
                      <img src={`${API_BASE}/uploads/${img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <span className="product-detail-tag verified"><FiCheck size={12} /> Vérifié</span>
                {product.brand && <span className="product-detail-tag brand">{product.brand}</span>}
              </div>

              <p className="product-detail-desc">{product.description}</p>

              {specs && Object.keys(specs).length > 0 && (
                <div className="product-detail-specs">
                  <h3>Fiche technique</h3>
                  <div className="product-detail-specs-grid">
                    {Object.entries(specs).map(([key, val]) => {
                      const Icon = specIcons[key] || FiCpu;
                      return (
                        <div key={key} style={{
                          padding: '12px 16px', background: 'var(--bg-card)',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                          display: 'flex', alignItems: 'center', gap: '12px',
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

              {product.seller_name && (
                <div className="product-seller-info">
                  <h4>Vendu par</h4>
                  <Link to={`/seller/${product.seller_id}`} className="seller-badge">
                    <div className="seller-avatar-mini">
                      {product.seller_logo ? <img src={`/uploads/avatars/${product.seller_logo}`} alt="" /> : <FiUser size={18} />}
                    </div>
                    <div>
                      <strong>{product.seller_name}</strong>
                      <small>Voir profil du vendeur</small>
                    </div>
                  </Link>
                </div>
              )}

              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    width: '100%', background: '#25D366', color: 'white',
                    fontSize: '18px', padding: '16px 36px', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#1da851'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#25D366'}
                >
                  <BsWhatsapp size={22} /> Contacter le vendeur
                </a>
              )}

              {product.seller_id && (
                <button
                  onClick={handleStartChat}
                  className="btn"
                  style={{
                    width: '100%', marginTop: '10px',
                    background: 'var(--gradient)', color: 'white',
                    fontSize: '16px', padding: '14px 36px', justifyContent: 'center',
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                    boxShadow: 'var(--shadow-glow)',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--gradient-hover)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--gradient)'}
                >
                  <FiMessageCircle size={20} /> Envoyer un message
                </button>
              )}

              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '10px' }}>
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
