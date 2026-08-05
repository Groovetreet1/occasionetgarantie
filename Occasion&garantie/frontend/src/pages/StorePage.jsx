import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiShoppingBag, FiChevronRight, FiShield, FiStar } from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const stateLabels = { neuf: 'products.stateNeuf', comme_neuf: 'products.stateCommeNeuf', tres_bon: 'products.stateTresBon', bon: 'products.stateBon', acceptable: 'products.stateAcceptableFull' };
const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';

export default function StorePage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = t('shop.metaTitle'); }, [t]);
  useEffect(() => {
    api.get('/store/products?limit=50').then(r => setProducts(r.data.products)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <section className="products-section" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
      <div className="container">
        <Link to="/" className="btn btn-ghost" style={{ marginBottom: '16px' }}><FiArrowLeft /> {t('shop.backHome')}</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiShield style={{ color: '#d97706' }} /> {t('shop.pageTitle')}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>{t('shop.pageSubtitle')}</p>
          </div>
        </div>

        {loading ? <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        : products.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <FiShoppingBag size={48} />
            <p>{t('shop.noProducts')}</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(p => (
              <Link key={p.id} to={`/boutique/${p.slug}`} className="product-card" style={{ textDecoration: 'none' }}>
                <div className="product-card-image" style={{ position: 'relative', background: 'var(--bg-secondary)', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.3s' }} /> : <FiShoppingBag size={48} style={{ opacity: 0.15 }} />}
                  <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>{p.category_name}</span>
                  {p.featured && <span style={{ position: 'absolute', top: 8, right: 8, background: '#d97706', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}><FiStar size={10} style={{ marginRight: 2 }} /> {t('shop.official')}</span>}
                </div>
                <div className="product-card-info" style={{ padding: '12px' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{p.brand} &middot; {t(stateLabels[p.state] || p.state)}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', marginTop: 6 }}>
                    {formatPrice(p.price)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
