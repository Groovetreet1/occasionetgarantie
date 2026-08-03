import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingBag } from 'react-icons/fi';
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb';

const API_BASE = import.meta.env.VITE_API_URL || '';

const toUrl = (img) => (img ? (img.startsWith('http') ? img : `${API_BASE}/uploads/${img}`) : null);

export default function HomeProductCard({ product, index = 0 }) {
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Link to={detailLink} className={`product-card product-card-compact ${isSold ? 'product-sold' : ''}`}>
        <div className="product-card-image">
          {discount > 0 && <span className="badge-discount">-{discount}%</span>}
          {isSold && <div className="product-sold-overlay">Vendu</div>}
          {isPending && <span className="badge-pending">Réservé</span>}
          {isStore && <span className="badge-store">Boutique Officielle</span>}
          <div className="product-card-img-wrap">
            {currentImg ? (
              <img src={currentImg} alt={product.name} loading="lazy" />
            ) : (
              <FiShoppingBag size={40} style={{ opacity: 0.25 }} />
            )}
          </div>
          {photos.length > 1 && (
            <>
              <button className="photo-nav-btn photo-prev" onClick={goPrev} aria-label="Photo précédente">
                <TbChevronLeft size={16} />
              </button>
              <button className="photo-nav-btn photo-next" onClick={goNext} aria-label="Photo suivante">
                <TbChevronRight size={16} />
              </button>
              <span className="photo-count">{photoIndex + 1}/{photos.length}</span>
            </>
          )}
        </div>

        <div className="product-card-body">
          <h3 className="product-card-title">{product.name}</h3>
          <div className="product-card-price-row">
            <span className="product-card-price">{formatPrice(product.price)}</span>
            {product.old_price > product.price && (
              <span className="product-card-old">{formatPrice(product.old_price)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
