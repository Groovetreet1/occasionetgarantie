import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiSliders, FiPackage, FiX, FiArrowRight, FiShield, FiShoppingBag } from 'react-icons/fi';

import { motion } from 'framer-motion';
import api from '../api/axios';
import HomeProductCard from '../components/HomeProductCard';
import GoMobileFadeBar from '../components/GoMobileFadeBar';
import { useLanguage } from '../context/LanguageContext';
import usePageMeta from '../utils/usePageMeta';

const STATE_LABELS = {
  neuf: 'products.stateNeuf', comme_neuf: 'products.stateCommeNeuf', tres_bon: 'products.stateTresBon',
  bon: 'products.stateBon', acceptable: 'products.stateAcceptable',
};

const CATEGORIES = ['Tous', 'Smartphones', 'Tablettes', 'Ordinateurs', 'Accessoires', 'Gaming'];

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Products() {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState(searchParams.get('category') || 'Tous');
  const [stateFilter, setStateFilter] = useState('Tous');
  const [ville, setVille] = useState(searchParams.get('ville') || '');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [storeProducts, setStoreProducts] = useState([]);
  const [storeLoad, setStoreLoad] = useState(true);
  const [cities, setCities] = useState([]);

  useEffect(() => { document.title = t('products.metaTitle'); }, [t]);

  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) setCategory(catParam);
    const searchParam = searchParams.get('search');
    const brandParam = searchParams.get('brand');
    if (brandParam) setSearch(brandParam);
    else if (searchParam) setSearch(searchParam);
    const villeParam = searchParams.get('ville');
    if (villeParam) setVille(villeParam);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) {
      const brandParam = searchParams.get('brand');
      if (brandParam && search === brandParam) params.set('brand', brandParam);
      else params.set('search', search);
    }
    if (ville) params.set('ville', ville);
    api.get(`/products${params.toString() ? `?${params}` : ''}`)
      .then(res => setAllProducts(res.data.products || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, searchParams, ville]);

  useEffect(() => {
    api.get('/products/cities').then(res => { if (res.data.length) setCities(res.data); }).catch(() => {});
    api.get('/store/products/featured').then(r => setStoreProducts(r.data)).catch(() => {}).finally(() => setStoreLoad(false));
  }, []);

  const filtered = (Array.isArray(allProducts) ? allProducts : []).filter(p => {
    if (category !== 'Tous' && p.category_name !== category) return false;
    if (stateFilter !== 'Tous' && p.state !== stateFilter) return false;
    if (priceMin && Number(p.price) < Number(priceMin)) return false;
    if (priceMax && Number(p.price) > Number(priceMax)) return false;
    return true;
  });

  const hasFilters = category !== 'Tous' || stateFilter !== 'Tous' || ville || priceMin || priceMax;
  const resetFilters = () => { setCategory('Tous'); setStateFilter('Tous'); setVille(''); setPriceMin(''); setPriceMax(''); };
  const showMore = () => setVisibleCount(prev => prev + 12);
  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const productCount = Array.isArray(allProducts) ? allProducts.length : 0;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (ville) params.set('ville', ville);
    api.get(`/products${params.toString() ? `?${params}` : ''}`)
      .then(res => setAllProducts(res.data.products || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const metaCategory = category !== 'Tous' ? category : null;
  const metaSearch = !metaCategory && search ? search : null;
  const metaLabel = metaCategory || metaSearch || null;
  usePageMeta({
    title: metaLabel
      ? `${metaLabel.charAt(0).toUpperCase() + metaLabel.slice(1)} d'occasion au Maroc - Occasion & Garantie`
      : "Tous les produits electroniques d'occasion au Maroc - Occasion & Garantie",
    description: metaLabel
      ? `Achetez des ${metaLabel.toLowerCase()} d'occasion au Maroc avec garantie sur Occasion & Garantie.`
      : "Parcourez des centaines de smartphones, tablettes, PC et accessoires d'occasion au Maroc. Achetez en toute securite avec garantie.",
    keywords: metaLabel ? `${metaLabel}, occasion, maroc, garantie, electronique` : 'occasion, maroc, smartphone, tablette, pc, accessoires, gaming',
    canonical: `https://www.occasionetgarantie.store/products${window.location.search}`,
  });

  return (
    <section className="products-page">
      <div className="products-page-hero" style={{ background: 'var(--bg-secondary)', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, border: '1px solid var(--border-light)', borderTop: 'none', backgroundImage: 'radial-gradient(var(--border-light) 1.4px, transparent 1.4px)', backgroundSize: '22px 22px', padding: '90px 0 36px', textAlign: 'center' }}>
        <div className="container">
          <motion.div initial="hidden" animate="show" variants={fadeUp} style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
            <span className="section-label-premium" style={{ marginBottom: 12 }}>Catalogue • {productCount}+ annonces</span>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.8, marginBottom: 8 }}>{t('products.pageTitle')}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 20 }}>{productCount} {productCount > 1 ? t('products.articles') : t('products.article')} {productCount > 1 ? t('products.availablePlural') : t('products.available')} — vérifiés & garantis</p>
          </motion.div>
          <motion.form initial="hidden" animate="show" variants={fadeUp} onSubmit={handleSearchSubmit} className="products-page-search" style={{ maxWidth: 560, margin: '0 auto', borderRadius: 999, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.06)', border: '1px solid var(--border-light)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center' }}>
            <FiSearch size={18} style={{ marginLeft: 16, color: 'var(--text-muted)', flexShrink: 0 }} />
            <input type="text" placeholder={t('products.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 12px', fontSize: 15, background: 'transparent', fontFamily: 'var(--font)' }} />
            <button type="submit" style={{ margin: 4, padding: '10px 22px', borderRadius: 999, background: 'var(--primary)', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>{t('products.searchBtn')}</button>
          </motion.form>
        </div>
      </div>

      <GoMobileFadeBar />

      <div className="products-page-body container">
        {storeProducts.length > 0 && !search && (
          <motion.div initial="hidden" animate="show" variants={fadeUp} style={{ marginBottom: 32, padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', border: '1px solid rgba(245,158,11,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><FiShield size={16} /></span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.2 }}>{t('products.storeOfficial')}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('products.storeSoldBy')}</div>
                </div>
              </div>
              <Link to="/boutique" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'var(--primary-light)', border: '1px solid rgba(245,158,11,0.18)' }}>{t('products.viewAll')} <FiArrowRight size={14} /></Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {storeProducts.slice(0, 6).map(p => (
                <Link key={p.id} to={`/boutique/${p.slug}`} className="saas-preview-card" style={{ textDecoration: 'none', background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-light)', display: 'block' }}>
                  <div style={{ aspectRatio: '1/1', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                    {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FiShoppingBag size={32} style={{ opacity: 0.2 }} />}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p.price).replace('MAD', '').trim()} DH</div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        <div className="products-toolbar" style={{ gap: 10, alignItems: 'center' }}>
          <button className={`btn ${hasFilters ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowFilters(true)} style={{ borderRadius: 999, padding: '9px 16px', fontWeight: 600 }}>
            <FiSliders size={14} /> {t('products.filters')}{hasFilters ? ` (${[category !== 'Tous', stateFilter !== 'Tous', !!ville, !!priceMin || !!priceMax].filter(Boolean).length})` : ''}
          </button>
          {hasFilters && (
            <button className="btn-filter-reset" onClick={resetFilters} style={{ fontWeight: 600 }}>{t('products.reset')}</button>
          )}
          <span className="products-count" style={{ marginLeft: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{filtered.length} {filtered.length > 1 ? t('products.results') : t('products.result')}</span>
        </div>

        {showFilters && (
          <div className="filters-overlay" onClick={() => setShowFilters(false)}>
            <motion.div
              className="filters-popup"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="filters-header">
                <span className="filters-title">{t('products.filtersTitle')}</span>
                <button className="filters-close" onClick={() => setShowFilters(false)}><FiX size={18} /></button>
              </div>
              <div className="filters-body">
                <div className="filter-group">
                  <label className="filter-label">{t('products.filterCategory')}</label>
                  <div className="filter-chips">
                    {CATEGORIES.map(c => (
                      <button key={c} className={`filter-chip${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>{c === 'Tous' ? t('products.all') : c}</button>
                    ))}
                  </div>
                </div>
                <div className="filter-group">
                  <label className="filter-label">{t('products.filterState')}</label>
                  <div className="filter-chips">
                    <button className={`filter-chip${stateFilter === 'Tous' ? ' active' : ''}`} onClick={() => setStateFilter('Tous')}>{t('products.all')}</button>
                    {Object.entries(STATE_LABELS).map(([val, label]) => (
                      <button key={val} className={`filter-chip${stateFilter === val ? ' active' : ''}`} onClick={() => setStateFilter(val)}>{t(label)}</button>
                    ))}
                  </div>
                </div>
                <div className="filter-group">
                  <label className="filter-label">{t('products.filterCity')}</label>
                  <div className="filter-chips">
                    <button className={`filter-chip${ville === '' ? ' active' : ''}`} onClick={() => setVille('')}>{t('products.allCities')}</button>
                    {cities.map(c => (
                      <button key={c} className={`filter-chip${ville === c ? ' active' : ''}`} onClick={() => setVille(c)}>{c}</button>
                    ))}
                  </div>
                </div>
                <div className="filter-group">
                  <label className="filter-label">{t('products.filterPrice')}</label>
                  <div className="filter-price-row">
                    <input type="number" placeholder={t('products.priceMin')} value={priceMin} onChange={e => setPriceMin(e.target.value)} className="filter-price-input" min="0" />
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                    <input type="number" placeholder={t('products.priceMax')} value={priceMax} onChange={e => setPriceMax(e.target.value)} className="filter-price-input" min="0" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {loading ? (
          <div className="products-loading"><div className="spinner" /></div>
        ) : filtered.length > 0 ? (
          <>
            <div className="product-grid-modern">
              {displayed.map((p, i) => <HomeProductCard key={p.id} product={p} index={i} />)}
            </div>
            {hasMore && (
              <div className="products-load-more">
                <button className="btn btn-outline btn-lg" onClick={showMore}>
                  {t('products.showMore')} ({filtered.length - visibleCount} {t('products.remaining')})
                </button>
              </div>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state">
            <FiPackage size={48} />
            <h3>{t('products.noResults')}</h3>
            <p>{t('products.noResultsDesc')}</p>
            {hasFilters && <button className="btn btn-outline" onClick={resetFilters}>{t('products.resetFilters')}</button>}
          </motion.div>
        )}
      </div>
    </section>
  );
}