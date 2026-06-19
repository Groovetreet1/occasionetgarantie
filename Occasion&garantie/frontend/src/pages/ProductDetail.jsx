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
    window.scrollTo(0, 0);
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

          <div className="product-detail-grid">
            <div>
              <div className="product-detail-image" onClick={() => allImages.length > 0 && openLightbox(0)}>
                {imgUrl ? (
                  <img src={`${API_BASE}/uploads/${product.image}`} alt={product.name} />
                ) : (
                  <FiShoppingBag size={80} style={{ opacity: 0.15 }} />
                )}
                <span className="badge-warranty-inline" style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.85)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, backdropFilter: 'blur(8px)' }}>
                  <FiShield size={14} /> Garantie {product.warranty}
                </span>
              </div>

              {allImages.length > 1 && (
                <div className="product-detail-thumbs">
                  {allImages.map((img, i) => (
                    <div key={i} className={`product-detail-thumb${lightboxIndex === i ? ' active' : ''}`} onClick={() => openLightbox(i)}>
                      <img src={`${API_BASE}/uploads/${img}`} alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="product-detail-info">
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
                  <div className="specs-grid">
                    {Object.entries(specs).map(([key, val]) => {
                      const Icon = specIcons[key] || FiCpu;
                      return (
                        <div key={key} className="spec-item">
                          <span className="spec-icon"><Icon size={18} /></span>
                          <div>
                            <div className="spec-label">{key}</div>
                            <div className="spec-value">{val}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="product-detail-whatsapp">
                <BsWhatsapp size={22} /> Acheter via WhatsApp
              </a>
              <p className="product-detail-response">Réponse sous 24h | Paiement sécurisé</p>
            </div>
          </div>
        </div>
      </section>

      {selectedImage && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}><FiX size={24} /></button>
          <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}><FiChevronLeft size={28} /></button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={`${API_BASE}/uploads/${allImages[lightboxIndex]}`} alt="" />
          </div>
          <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}><FiChevronRight size={28} /></button>
          <div className="lightbox-counter">{lightboxIndex + 1} / {allImages.length}</div>
        </div>
      )}
    </>
  );
}
