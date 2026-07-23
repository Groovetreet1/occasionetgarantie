import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiUser } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_URL || '';

const statusLabels = {
  disponible: 'Disponible',
  en_attente: 'En attente',
  vendu: 'Vendu',
};

export default function ProductCard({ product, index = 0 }) {
  const formatPrice = (p) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' })
      .format(p).replace('MAD', '').trim() + ' DH';
  const imgUrl = product.image ? `${API_BASE}/uploads/${product.image}` : null;
  const discount = product.old_price && product.old_price > product.price
    ? Math.round((1 - product.price / product.old_price) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link to={`/products/${product.slug}`} className={`product-card ${product.status === 'vendu' ? 'product-sold' : ''}`}>
        <div className="product-card-image">
          {product.featured && <span className="product-badge badge-featured">Top</span>}
          {discount > 0 && <span className="product-discount-badge">-{discount}%</span>}
          {product.status && product.status !== 'disponible' && (
            <span className={`product-badge badge-${product.status}`}>{statusLabels[product.status]}</span>
          )}
          {imgUrl ? <img src={imgUrl} alt={product.name} /> : <FiShoppingBag size={48} style={{ opacity: 0.3 }} />}
          {product.status === 'vendu' && <div className="product-sold-overlay">Vendu</div>}
        </div>
        <div className="product-info">
          <div className="product-category">{product.category_name || 'Non classé'}</div>
          <h3>{product.name}</h3>
          {product.seller_name && (
            <div className="product-seller"><FiUser size={10} /> {product.seller_name}</div>
          )}
          <div className="product-price">
            <span className="price-current">{formatPrice(product.price)}</span>
            {product.old_price && <span className="price-old">{formatPrice(product.old_price)}</span>}
          </div>
          <div className="product-meta">
            <span className="product-state">{product.state?.replace(/_/g, ' ')}</span>
            <span className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '13px', pointerEvents: 'none' }}>
              Voir
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
