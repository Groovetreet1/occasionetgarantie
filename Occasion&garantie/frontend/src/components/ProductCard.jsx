import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiUser, FiShield, FiStar } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_URL || '';

const stateLabels = {
  neuf: 'Neuf', comme_neuf: 'Comme neuf', tres_bon: 'Très bon état',
  bon: 'Bon état', acceptable: 'Acceptable',
};

export default function ProductCard({ product, index = 0 }) {
  const formatPrice = (p) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' })
      .format(p).replace('MAD', '').trim() + ' DH';
  const imgUrl = product.image ? `${API_BASE}/uploads/${product.image}` : null;
  const discount = product.old_price && product.old_price > product.price
    ? Math.round((1 - product.price / product.old_price) * 100) : 0;
  const isSold = product.status === 'vendu';
  const isPending = product.status === 'en_attente';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Link to={`/products/${product.slug}`} className={`product-card ${isSold ? 'product-sold' : ''}`}>
        <div className="product-card-image">
          {discount > 0 && <span className="badge-discount">-{discount}%</span>}
          {isSold && <div className="product-sold-overlay">Vendu</div>}
          {isPending && <span className="badge-pending">Réservé</span>}
          <div className="product-card-img-wrap">
            {imgUrl ? (
              <img src={imgUrl} alt={product.name} loading="lazy" />
            ) : (
              <FiShoppingBag size={40} style={{ opacity: 0.25 }} />
            )}
          </div>
        </div>

        <div className="product-card-body">
          <span className="product-card-cat">{product.category_name || 'Non classé'}</span>
          <h3 className="product-card-title">{product.name}</h3>

          {product.seller_name && (
            <span className="product-card-seller"><FiUser size={11} /> {product.seller_name} {product.seller_premium ? <FiStar size={11} style={{ color: 'var(--warning)', marginLeft: 3 }} /> : null}</span>
          )}

          <div className="product-card-price-row">
            <span className="product-card-price">{formatPrice(product.price)}</span>
            {product.old_price > product.price && (
              <span className="product-card-old">{formatPrice(product.old_price)}</span>
            )}
          </div>

          <div className="product-card-meta">
            {product.state && (
              <span className="meta-chip">{stateLabels[product.state] || product.state}</span>
            )}
            {product.warranty && product.warranty !== 'Sans garantie' && (
              <span className="meta-chip meta-chip-warranty"><FiShield size={10} /> {product.warranty}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
