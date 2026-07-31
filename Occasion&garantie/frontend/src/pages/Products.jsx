import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiSliders, FiPackage, FiX, FiArrowRight, FiShield, FiShoppingBag } from 'react-icons/fi';

import { motion } from 'framer-motion';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

const STATE_LABELS = {
  neuf: 'Neuf', comme_neuf: 'Comme neuf', tres_bon: 'Très bon état',
  bon: 'Bon état', acceptable: 'Acceptable',
};

const CATEGORIES = ['Tous', 'Smartphones', 'Tablettes', 'Ordinateurs', 'Accessoires', 'Gaming'];

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Products() {
  const [searchParams] = useSearchParams();
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

  useEffect(() => { document.title = 'Tous les produits - Occasion & Garantie'; }, []);

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
            <h1>Marketplace</h1>
            <p>{Array.isArray(allProducts) ? allProducts.length : 0} article{Array.isArray(allProducts) && allProducts.length > 1 ? 's' : ''} disponible{Array.isArray(allProducts) && allProducts.length > 1 ? 's' : ''}</p>
          </motion.div>
          <motion.form initial="hidden" animate="show" variants={fadeUp} onSubmit={handleSearchSubmit} className="products-page-search">
            <FiSearch size={18} />
            <input type="text" placeholder="Rechercher par nom, marque..." value={search} onChange={e => setSearch(e.target.value)} />
            <button type="submit">Chercher</button>
          </motion.form>
        </div>
      </div>

      <div className="products-page-body container">
        {storeProducts.length > 0 && !search && (
          <motion.div initial="hidden" animate="show" variants={fadeUp} style={{ marginBottom: 32, padding: '20px 24px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiShield style={{ color: '#d97706' }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Boutique Officielle</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— Vendu par Occasion & Garantie</span>
              </div>
              <Link to="/boutique" style={{ fontSize: 13, color: '#d97706', fontWeight: 600, textDecoration: 'none' }}>Voir tout <FiArrowRight size={14} style={{ verticalAlign: 'middle' }} /></Link>
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

        <motion.div className="products-categories" initial="hidden" animate="show" variants={fadeUp}>
          {CATEGORIES.map(c => (
            <button key={c} className={`cat-pill ${category === c ? 'active' : ''}`} onClick={() => { setCategory(c); setVisibleCount(12); }}>
              {c}
            </button>
          ))}
        </motion.div>

        <div className="products-toolbar">
          <button className={`btn ${hasFilters ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowFilters(o => !o)}>
            <FiSliders size={14} /> Filtres{hasFilters ? ` (${[category !== 'Tous', stateFilter !== 'Tous', !!ville, !!priceMin || !!priceMax].filter(Boolean).length})` : ''}
          </button>
          {hasFilters && (
            <button className="btn-filter-reset" onClick={resetFilters}>Réinitialiser</button>
          )}
          <span className="products-count">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
        </div>

        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="filters-panel">
            <div className="filters-header">
              <span className="filters-title">Filtres</span>
              <button className="filters-close" onClick={() => setShowFilters(false)}><FiX size={18} /></button>
            </div>
            <div className="filters-body">
              <div className="filter-group">
                <label className="filter-label">Catégorie</label>
                <div className="filter-chips">
                  {CATEGORIES.map(c => (
                    <button key={c} className={`filter-chip${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <label className="filter-label">État</label>
                <div className="filter-chips">
                  <button className={`filter-chip${stateFilter === 'Tous' ? ' active' : ''}`} onClick={() => setStateFilter('Tous')}>Tous</button>
                  {Object.entries(STATE_LABELS).map(([val, label]) => (
                    <button key={val} className={`filter-chip${stateFilter === val ? ' active' : ''}`} onClick={() => setStateFilter(val)}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <label className="filter-label">Ville</label>
                <div className="filter-chips">
                  <button className={`filter-chip${ville === '' ? ' active' : ''}`} onClick={() => setVille('')}>Toutes les villes</button>
                  {cities.map(c => (
                    <button key={c} className={`filter-chip${ville === c ? ' active' : ''}`} onClick={() => setVille(c)}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <label className="filter-label">Prix (DH)</label>
                <div className="filter-price-row">
                  <input type="number" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)} className="filter-price-input" min="0" />
                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                  <input type="number" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)} className="filter-price-input" min="0" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="products-loading"><div className="spinner" /></div>
        ) : filtered.length > 0 ? (
          <>
            <div className="product-grid-modern">
              {displayed.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
            {hasMore && (
              <div className="products-load-more">
                <button className="btn btn-outline btn-lg" onClick={showMore}>
                  Voir plus ({filtered.length - visibleCount} restants)
                </button>
              </div>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state">
            <FiPackage size={48} />
            <h3>Aucun résultat</h3>
            <p>Essayez de modifier vos filtres ou votre recherche.</p>
            {hasFilters && <button className="btn btn-outline" onClick={resetFilters}>Réinitialiser les filtres</button>}
          </motion.div>
        )}
      </div>
    </section>
  );
}