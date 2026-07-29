import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiSliders, FiPackage, FiX, FiGrid, FiList, FiNavigation } from 'react-icons/fi';

import { motion } from 'framer-motion';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

const STATE_LABELS = {
  neuf: 'Neuf', comme_neuf: 'Comme neuf', tres_bon: 'Très bon état',
  bon: 'Bon état', acceptable: 'Acceptable',
};

const CATEGORIES = ['Tous', 'Smartphones', 'Tablettes', 'Ordinateurs', 'Accessoires', 'Gaming'];

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const MOROCCAN_CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tanger', 'Agadir', 'Meknes', 'Oujda',
  'Kenitra', 'Tetouan', 'Safi', 'El Jadida', 'Beni Mellal', 'Nador', 'Taza',
  'Mohammedia', 'Laayoune', 'Khouribga', 'Settat', 'Berrechid',
];

export default function Products() {
  const [searchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState(searchParams.get('category') || 'Tous');
  const [stateFilter, setStateFilter] = useState('Tous');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [userCity, setUserCity] = useState('');

  useEffect(() => { document.title = 'Tous les produits - Occasion & Garantie'; }, []);

  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) setCategory(catParam);
  }, [searchParams]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=fr`);
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision || '';
          if (city) {
            const found = MOROCCAN_CITIES.find(c => city.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(c.toLowerCase()));
            setUserCity(found || city);
          }
        } catch {}
      }, () => {}, { timeout: 8000 });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (userCity) params.set('user_ville', userCity);
    api.get(`/products${params.toString() ? `?${params}` : ''}`)
      .then(res => setAllProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, userCity]);

  const filtered = allProducts.filter(p => {
    if (category !== 'Tous' && p.category_name !== category) return false;
    if (stateFilter !== 'Tous' && p.state !== stateFilter) return false;
    if (priceMin && Number(p.price) < Number(priceMin)) return false;
    if (priceMax && Number(p.price) > Number(priceMax)) return false;
    return true;
  });

  const hasFilters = category !== 'Tous' || stateFilter !== 'Tous' || priceMin || priceMax;
  const resetFilters = () => { setCategory('Tous'); setStateFilter('Tous'); setPriceMin(''); setPriceMax(''); };
  const showMore = () => setVisibleCount(prev => prev + 12);
  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (userCity) params.set('user_ville', userCity);
    api.get(`/products${params.toString() ? `?${params}` : ''}`)
      .then(res => setAllProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <section className="products-page">
      <div className="products-page-hero">
        <div className="container">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <h1>Marketplace</h1>
            <p>{filtered.length} article{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}{userCity ? ` près de ${userCity}` : ''}</p>
          </motion.div>
          <motion.form initial="hidden" animate="show" variants={fadeUp} onSubmit={handleSearchSubmit} className="products-page-search">
            <FiSearch size={18} />
            <input type="text" placeholder="Rechercher par nom, marque..." value={search} onChange={e => setSearch(e.target.value)} />
            <button type="submit">Chercher</button>
          </motion.form>
        </div>
      </div>

      <div className="products-page-body container">
        <motion.div className="products-categories" initial="hidden" animate="show" variants={fadeUp}>
          {CATEGORIES.map(c => (
            <button key={c} className={`cat-pill ${category === c ? 'active' : ''}`} onClick={() => { setCategory(c); setVisibleCount(12); }}>
              {c}
            </button>
          ))}
        </motion.div>

        <div className="products-toolbar">
          {userCity && (
            <span style={{ fontSize: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--primary-light)', padding: '4px 10px', borderRadius: 8 }}>
              <FiNavigation size={14} /> {userCity}
            </span>
          )}
          <button className={`btn ${hasFilters ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowFilters(o => !o)}>
            <FiSliders size={14} /> Filtres{hasFilters ? ` (${[category !== 'Tous', stateFilter !== 'Tous', !!priceMin || !!priceMax].filter(Boolean).length})` : ''}
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