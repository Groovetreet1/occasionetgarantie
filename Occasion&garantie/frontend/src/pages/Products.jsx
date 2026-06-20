import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiSliders, FiPackage, FiX } from 'react-icons/fi';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState(searchParams.get('category') || 'Tous');
  const [stateFilter, setStateFilter] = useState('Tous');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  const STATE_LABELS = {
    neuf: t('Neuf'),
    comme_neuf: t('Comme neuf'),
    tres_bon: t('Très bon état'),
    bon: t('Bon état'),
  };

  const CATEGORIES = [t('Tous'), t('Smartphones'), t('Tablettes'), t('Ordinateurs'), t('Accessoires')];

  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) setCategory(catParam);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    api.get(`/products${search ? `?search=${search}` : ''}`)
      .then((res) => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  const filtered = products.filter((p) => {
    if (category !== t('Tous') && p.category_name !== category) return false;
    if (stateFilter !== t('Tous') && p.state !== stateFilter) return false;
    if (priceMin && Number(p.price) < Number(priceMin)) return false;
    if (priceMax && Number(p.price) > Number(priceMax)) return false;
    return true;
  });

  const resetFilters = () => {
    setCategory(t('Tous'));
    setStateFilter(t('Tous'));
    setPriceMin('');
    setPriceMax('');
  };

  const hasFilters = category !== t('Tous') || stateFilter !== t('Tous') || priceMin || priceMax;

  return (
    <section className="products-section" style={{ paddingTop: '120px' }}>
      <div className="container">
        <div className="products-header">
          <div>
            <h2 className="section-title">{t('Nos produits')}</h2>
            <p className="section-subtitle" style={{ marginBottom: 0 }}>
              {filtered.length} {filtered.length > 1 ? t('articles disponibles') : t('article disponible')}
            </p>
          </div>
        </div>

        <div className="products-toolbar">
          <div className="products-search-wrap">
            <FiSearch size={16} className="products-search-icon" />
            <input
              type="text"
              placeholder={t('Rechercher un produit...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="products-search-input"
            />
          </div>
          <button className={`btn ${hasFilters ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowFilters((o) => !o)}>
            <FiSliders size={14} /> {t('Filtres')}{hasFilters ? ' (1)' : ''}
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filters-header">
              <span className="filters-title">{t('Filtres')}</span>
              <button className="filters-close" onClick={() => setShowFilters(false)}><FiX size={18} /></button>
            </div>
            <div className="filters-body">
              <div className="filter-group">
                <label className="filter-label">{t('Catégorie')}</label>
                <div className="filter-chips">
                  {CATEGORIES.map((c) => (
                    <button key={c} className={`filter-chip${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <label className="filter-label">{t('État')}</label>
                <div className="filter-chips">
                  <button className={`filter-chip${stateFilter === t('Tous') ? ' active' : ''}`} onClick={() => setStateFilter(t('Tous'))}>{t('Tous')}</button>
                  {Object.entries(STATE_LABELS).map(([val, label]) => (
                    <button key={val} className={`filter-chip${stateFilter === val ? ' active' : ''}`} onClick={() => setStateFilter(val)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <label className="filter-label">{t('Prix (DH)')}</label>
                <div className="filter-price-row">
                  <input type="number" placeholder={t('Min')} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="filter-price-input" min="0" />
                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                  <input type="number" placeholder={t('Max')} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="filter-price-input" min="0" />
                </div>
              </div>
              {hasFilters && (
                <button className="filter-reset" onClick={resetFilters}>{t('Réinitialiser')}</button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : filtered.length > 0 ? (
          <div className="products-grid">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon"><FiPackage size={48} /></div>
            <p>{search ? t('Aucun produit trouvé pour') + ` "${search}".` : t('Aucun produit trouvé.')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
