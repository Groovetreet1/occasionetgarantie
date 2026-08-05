import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiUser, FiShield, FiStar, FiMapPin } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

const stateLabels = {
  neuf: 'products.stateNeuf', comme_neuf: 'products.stateCommeNeuf', tres_bon: 'products.stateTresBon',
  bon: 'products.stateBon', acceptable: 'products.stateAcceptable',
};

export default function ProductCard({ product, index = 0 }) {
  const { t } = useLanguage();
  const formatPrice = (p) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' })
      .format(p).replace('MAD', '').trim() + ' DH';
  const imgUrl = product.image ? (product.image.startsWith('http') ? product.image : `${API_BASE}/uploads/${product.image}`) : null;
  const discount = product.old_price && product.old_price > product.price
    ? Math.round((1 - product.price / product.old_price) * 100) : 0;
  const isSold = product.status === 'vendu';
  const isPending = product.status === 'en_attente';
  const isStore = product.product_type === 'store';
  const detailLink = isStore ? `/boutique/${product.slug}` : `/products/${product.slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Link to={detailLink} className={`product-card ${isSold ? 'product-sold' : ''}`}>
        <div className="product-card-image">
          {discount > 0 && <span className="badge-discount">-{discount}%</span>}
          {isSold && <div className="product-sold-overlay">{t('products.sold')}</div>}
          {isPending && <span className="badge-pending">{t('products.reserved')}</span>}
          {isStore && <span className="badge-store">{t('products.officialStore')}</span>}
          <div className="product-card-img-wrap">
            {imgUrl ? (
              <img src={imgUrl} alt={product.name} loading="lazy" />
            ) : (
              <FiShoppingBag size={40} style={{ opacity: 0.25 }} />
            )}
          </div>
        </div>

        <div className="product-card-body">
          <span className="product-card-cat">{product.category_name || t('products.uncategorized')}</span>
          <h3 className="product-card-title">{product.name}</h3>

          {product.seller_name && !isStore && (
            <span className="product-card-seller">
              {product.seller_avatar ? (
                <img src={product.seller_avatar.startsWith('http') ? product.seller_avatar : `${API_BASE}/uploads/avatars/${product.seller_avatar}`} alt="" className="product-card-seller-avatar" />
              ) : <FiUser size={11} />}
              {product.seller_name} {product.seller_premium ? <FiStar size={14} style={{ color: '#FFD700', marginLeft: 3, verticalAlign: 'middle' }} /> : null}
            </span>
          )}

          <div className="product-card-price-row">
            <span className="product-card-price">{formatPrice(product.price)}</span>
            {product.old_price > product.price && (
              <span className="product-card-old">{formatPrice(product.old_price)}</span>
            )}
          </div>

          <div className="product-card-meta">
            {product.state && (
              <span className="meta-chip">{t(stateLabels[product.state] || product.state)}</span>
            )}
            {product.ville && (
              <span className="meta-chip meta-chip-location"><FiMapPin size={10} /> {product.ville}</span>
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
