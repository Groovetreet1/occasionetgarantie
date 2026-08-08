import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiSliders, FiPackage, FiX, FiArrowRight, FiShield, FiShoppingBag } from 'react-icons/fi';

import { motion } from 'framer-motion';
import api from '../api/axios';
import HomeProductCard from '../components/HomeProductCard';
import GoMobileFadeBar from '../components/GoMobileFadeBar';
import { useLanguage } from '../context/LanguageContext';

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

  return (
    <section className="products-page">
      <div className="products-page-hero">
        <div className="container">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <h1>{t('products.pageTitle')}</h1>
            <p>{productCount} {productCount > 1 ? t('products.articles') : t('products.article')} {productCount > 1 ? t('products.availablePlural') : t('products.available')}</p>
          </motion.div>
          <motion.form initial="hidden" animate="show" variants={fadeUp} onSubmit={handleSearchSubmit} className="products-page-search">
            <FiSearch size={18} />
            <input type="text" placeholder={t('products.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
            <button type="submit">{t('products.searchBtn')}</button>
          </motion.form>

          <motion.div initial="hidden" animate="show" variants={fadeUp} className="products-hero-toolbar">
            <button className={`btn ${hasFilters ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowFilters(o => !o)}>
              <FiSliders size={14} /> {t('products.filters')}{hasFilters ? ` (${[category !== 'Tous', stateFilter !== 'Tous', !!ville, !!priceMin || !!priceMax].filter(Boolean).length})` : ''}
            </button>
            {hasFilters && (
              <button className="btn-filter-reset" onClick={resetFilters}>{t('products.reset')}</button>
            )}
            <span className="products-count">{filtered.length} {filtered.length > 1 ? t('products.results') : t('products.result')}</span>
          </motion.div>

          {showFilters && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="filters-panel">
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
          )}
        </div>
      </div>

      <GoMobileFadeBar />

      <div className="products-page-body container">
        {storeProducts.length > 0 && !search && (
          <motion.div initial="hidden" animate="show" variants={fadeUp} style={{ marginBottom: 32, padding: '20px 24px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiShield style={{ color: '#d97706' }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>{t('products.storeOfficial')}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('products.storeSoldBy')}</span>
              </div>
              <Link to="/boutique" style={{ fontSize: 13, color: '#d97706', fontWeight: 600, textDecoration: 'none' }}>{t('products.viewAll')} <FiArrowRight size={14} style={{ verticalAlign: 'middle' }} /></Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {storeProducts.slice(0, 6).map(p => (
                <Link key={p.id} to={`/boutique/${p.slug}`} style={{ textDecoration: 'none', background: 'var(--bg-card)', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', transition: 'transform 0.2s', display: 'block' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ aspectRatio: '1/1', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FiShoppingBag size={32} style={{ opacity: 0.2 }} />}
                  </div>
                  <div style={{ padding: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p.price).replace('MAD', '').trim()} DH</div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        <div className="products-toolbar">
          <span className="products-count">{filtered.length} {filtered.length > 1 ? t('products.results') : t('products.result')}</span>
        </div>

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