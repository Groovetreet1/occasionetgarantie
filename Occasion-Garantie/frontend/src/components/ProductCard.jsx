import { Link } from 'react-router-dom';
import { FiShoppingBag, FiShield } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function ProductCard({ product }) {
  const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';
  const imgUrl = product.image ? `${API_BASE}/uploads/${product.image}` : null;
  const discount = product.old_price && product.old_price > product.price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : 0;

  return (
    <Link to={`/products/${product.slug}`} className="product-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div className="product-image">
        {product.featured && <span className="product-badge badge-featured">Top</span>}
        <span className="product-badge badge-warranty" style={{ top: '44px', left: '12px', right: 'auto' }}>
          <FiShield size={10} /> {product.warranty || '6 mois'}
        </span>
        {discount > 0 && (
          <span className="product-discount-badge">-{discount}%</span>
        )}
        {imgUrl ? (
          <img src={imgUrl} alt={product.name} />
        ) : (
          <FiShoppingBag size={48} style={{ opacity: 0.3 }} />
        )}
      </div>
      <div className="product-info">
        <div className="product-category">{product.category_name || 'Non classé'}</div>
        <h3>{product.name}</h3>
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
  );
}
