import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiShoppingBag, FiChevronRight, FiShield, FiStar } from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import usePageMeta from '../utils/usePageMeta';

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
  usePageMeta({
    title: "Boutique Officielle - Electronique d'occasion - Occasion & Garantie",
    description: "La Boutique Officielle Occasion & Garantie : produits electroniques d'occasion verifies, testes et garantis, disponibles au Maroc.",
    keywords: 'boutique officielle, occasion, garantie, maroc, smartphone, electronique',
    canonical: 'https://www.occasionetgarantie.store/boutique',
  });

  return (
    <section className="products-section" style={{ paddingBottom: '60px' }}>
      <div style={{ background: 'var(--bg-secondary)', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, border: '1px solid var(--border-light)', borderTop: 'none', backgroundImage: 'radial-gradient(var(--border-light) 1.4px, transparent 1.4px)', backgroundSize: '22px 22px', padding: '100px 0 32px', textAlign: 'center', marginBottom: 24 }}>
        <div className="container" style={{ maxWidth: 720, margin: '0 auto' }}>
          <Link to="/" className="btn btn-ghost" style={{ marginBottom: 12, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 999, padding: '8px 14px', fontWeight: 600 }}><FiArrowLeft /> {t('shop.backHome')}</Link>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><span className="section-label-premium" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiShield size={12} /> {t('home.storeLabel')}</span></div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.7, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><FiShield style={{ color: '#d97706' }} /> {t('shop.pageTitle')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{t('shop.pageSubtitle')}</p>
        </div>
      </div>
      <div className="container">

        {loading ? <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        : products.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <FiShoppingBag size={48} />
            <p>{t('shop.noProducts')}</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(p => (
              <Link key={p.id} to={`/boutique/${p.slug}`} className="product-card saas-preview-card" style={{ textDecoration: 'none', borderRadius: 16, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                <div className="product-card-image" style={{ position: 'relative', background: 'var(--bg-secondary)', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 12 }}>
                  {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FiShoppingBag size={48} style={{ opacity: 0.15 }} />}
                  <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>{p.category_name}</span>
                  {!!p.featured && <span style={{ position: 'absolute', top: 10, right: 10, background: '#d97706', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}><FiStar size={10} /> {t('shop.official')}</span>}
                  <span className="saas-preview-arrow"><FiChevronRight size={14} /></span>
                </div>
                <div className="product-card-body" style={{ padding: 13 }}>
                  <h3 className="product-card-title" style={{ fontSize: 14, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>{p.brand} • {t(stateLabels[p.state] || p.state)}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', marginTop: 8 }}>{formatPrice(p.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
