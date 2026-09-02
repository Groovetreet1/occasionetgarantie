import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiArrowUpRight, FiMapPin, FiShield, FiStar } from 'react-icons/fi';
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb';
import { useLanguage } from '../context/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

const toUrl = (img) => (img ? (img.startsWith('http') ? img : `${API_BASE}/uploads/${img}`) : null);

export default function HomeProductCard({ product, index = 0 }) {
  const { t } = useLanguage();
  const [photoIndex, setPhotoIndex] = useState(0);

  const formatPrice = (p) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' })
      .format(p).replace('MAD', '').trim() + ' DH';

  let gallery = [];
  if (product.gallery) {
    try { gallery = typeof product.gallery === 'string' ? JSON.parse(product.gallery) : product.gallery; }
    catch (e) { gallery = []; }
  }
  if (!Array.isArray(gallery)) gallery = [];

  const photos = [];
  if (product.image) photos.push(product.image);
  gallery.forEach((img) => { if (img !== product.image && !photos.includes(img)) photos.push(img); });

  const isSold = product.status === 'vendu';
  const isPending = product.status === 'en_attente';
  const isStore = product.product_type === 'store';
  const discount = product.old_price && product.old_price > product.price
    ? Math.round((1 - product.price / product.old_price) * 100) : 0;
  const detailLink = isStore ? `/boutique/${product.slug}` : `/products/${product.slug}`;
  const currentImg = toUrl(photos[photoIndex] || null);
  const ville = product.ville || product.city || 'Casablanca';
  const warranty = product.warranty || '12 mois';

  const goPrev = (e) => {
    e.preventDefault(); e.stopPropagation();
    setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
  };
  const goNext = (e) => {
    e.preventDefault(); e.stopPropagation();
    setPhotoIndex((i) => (i + 1) % photos.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.38, delay: index * 0.045, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={detailLink} className={`product-card product-card-compact saas-preview-card ${isSold ? 'product-sold' : ''}`} style={{ borderRadius: 16, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div className="product-card-image" style={{ background: 'var(--bg-secondary)', position: 'relative' }}>
          {discount > 0 && <span className="badge-discount" style={{ background: '#ef4444', color: '#fff', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 800, top: 10, right: 10 }}>-{discount}%</span>}
          {isSold && <div className="product-sold-overlay" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)' }}>{t('home.sold')}</div>}
          {isPending && <span className="badge-pending" style={{ borderRadius: 999 }}>{t('home.reserved')}</span>}
          {isStore && <span className="badge-store" style={{ borderRadius: 999, background: 'var(--primary)', color: '#000' }}><FiStar size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />Officiel</span>}
          <span className="saas-preview-arrow" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}><FiArrowUpRight size={15} /></span>
          <div className="product-card-img-wrap" style={{ padding: 16 }}>
            {currentImg ? (
              <img src={currentImg} alt={product.name} loading="lazy" style={{ transition: 'transform 0.5s' }} />
            ) : (
              <FiShoppingBag size={40} style={{ opacity: 0.22 }} />
            )}
          </div>
          {photos.length > 1 && (
            <>
              <button className="photo-nav-btn photo-prev" onClick={goPrev} aria-label={t('home.photoPrev')} style={{ width: 30, height: 30 }}>
                <TbChevronLeft size={16} />
              </button>
              <button className="photo-nav-btn photo-next" onClick={goNext} aria-label={t('home.photoNext')} style={{ width: 30, height: 30 }}>
                <TbChevronRight size={16} />
              </button>
              <span className="photo-count" style={{ background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', fontSize: 11 }}>{photoIndex + 1}/{photos.length}</span>
            </>
          )}
        </div>

        <div className="product-card-body" style={{ padding: '13px 14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{product.category || product.category_name || 'Smartphone'}</span>
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#f59e0b' }}><FiStar size={11} style={{ fill: '#f59e0b', color: '#f59e0b' }} /> 4.8</span>
          </div>
          <h3 className="product-card-title" style={{ fontSize: 14, lineHeight: 1.35, minHeight: 38, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</h3>
          <div className="product-card-price-row" style={{ margin: '8px 0 10px', alignItems: 'baseline' }}>
            <span className="product-card-price" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>{formatPrice(product.price)}</span>
            {product.old_price > product.price && (
              <span className="product-card-old" style={{ fontSize: 12, marginLeft: 8 }}>{formatPrice(product.old_price)}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border-light)', paddingTop: 10, marginTop: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}><FiMapPin size={11} /> {ville}</span>
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.10)', color: '#059669', border: '1px solid rgba(16,185,129,0.15)' }}><FiShield size={10} /> {warranty}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
