import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSmartphone, FiArrowRight, FiShoppingBag, FiSearch, FiMapPin } from 'react-icons/fi';
import { TbShieldCheck, TbClockHour5 } from 'react-icons/tb';
import api from '../api/axios';
import HomeProductCard from '../components/HomeProductCard';
import TrustBar from '../components/TrustBar';
import NewsletterSection from '../components/NewsletterSection';
import PromoPopup from '../components/PromoPopup';

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

function SkeletonGrid({ count = 4 }) {
  return (
    <div className="products-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-img" /><div className="skeleton-text" /><div className="skeleton-text-short" /><div className="skeleton-price" />
        </div>
      ))}
    </div>
  );
}



const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';

const BRAND_LOGO_FALLBACKS = {
  infinix: 'https://commons.wikimedia.org/wiki/Special:FilePath/Infinix_logo.svg',
  poco: 'https://commons.wikimedia.org/wiki/Special:FilePath/POCO_logo.svg',
};

function BrandCircle({ brand }) {
  const [hasError, setHasError] = useState(false);
  const slug = brand.toLowerCase().replace(/[^a-z0-9]/g, '');
  const fallback = BRAND_LOGO_FALLBACKS[slug];
  const src = fallback ? fallback : `https://cdn.simpleicons.org/${slug}`;
  return (
    <Link to={`/products?brand=${encodeURIComponent(brand)}`}
      style={{ flexShrink: 0, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'transform 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '2px solid rgba(217,119,6,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 18, fontWeight: 800, color: '#d97706' }}>
        {hasError ? brand.charAt(0).toUpperCase() : (
          <img src={src} alt={brand}
            style={{ width: '70%', height: '70%', objectFit: 'contain' }}
            onError={() => setHasError(true)} />
        )}
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 500 }}>{brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
    </Link>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);
  const [storeLoad, setStoreLoad] = useState(true);
  const [brands, setBrands] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const searchWrapRef = useRef(null);

  useEffect(() => { document.title = 'Occasion & Garantie - Achetez et vendez des produits électroniques d\'occasion au Maroc'; }, []);

  useEffect(() => {
    api.get('/products/cities').then(res => { if (res.data.length) setCities(res.data); }).catch(() => {});
    api.get('/products/brands/list').then(res => setBrands(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/products?sort=newest').then(res => {
      const items = res.data.products || res.data;
      setProducts(items.slice(0, 20));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/store/products/featured').then(r => setStoreProducts(r.data)).catch(() => {}).finally(() => setStoreLoad(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) setSuggestOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmed = searchTerm.trim();
  useEffect(() => {
    if (trimmed.length < 2) { setSuggestions([]); setSuggestOpen(false); return; }
    setSuggestLoading(true);
    const t = setTimeout(() => {
      api.get(`/products?search=${encodeURIComponent(trimmed)}&limit=6`)
        .then(res => { setSuggestions(res.data.products || []); setSuggestOpen(true); })
        .catch(() => {})
        .finally(() => setSuggestLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    let url = '/products?';
    if (trimmed) url += `search=${encodeURIComponent(trimmed)}&`;
    if (selectedCategory) url += `category=${selectedCategory}&`;
    if (selectedCity) url += `ville=${encodeURIComponent(selectedCity)}&`;
    setSuggestOpen(false);
    navigate(url);
  };

  return (
    <motion.div initial="hidden" animate="show">
      <PromoPopup />

      <section className="avito-hero">
        <div className="container">
          <div className="avito-hero-content">
            <h1>Occasion & Garantie</h1>
            <form onSubmit={handleSearch} className="avito-search-bar">
              <div className="avito-search-input-wrap" ref={searchWrapRef}>
                <FiSearch size={18} className="avito-search-icon" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Que cherchez-vous ?" />
                {suggestOpen && trimmed.length >= 2 && (
                  <div className="avito-search-dropdown">
                    {suggestLoading ? (
                      <div className="avito-search-dropdown-loading"><div className="spinner spinner-sm" /></div>
                    ) : suggestions.length > 0 ? (
                      <>
                        {suggestions.map(p => (
                          <Link key={p.id} to={p.product_type === 'store' ? `/boutique/${p.slug}` : `/products/${p.slug}`} className="avito-search-item" onClick={() => setSuggestOpen(false)}>
                            <div className="avito-search-item-img">
                              {p.image ? <img src={p.image.startsWith('http') ? p.image : `${import.meta.env.VITE_API_URL || ''}/uploads/${p.image}`} alt={p.name} loading="lazy" /> : <FiShoppingBag size={18} style={{ opacity: 0.3 }} />}
                            </div>
                            <div className="avito-search-item-body">
                              <span className="avito-search-item-name">{p.name}</span>
                              <span className="avito-search-item-price">{formatPrice(p.price)}</span>
                            </div>
                          </Link>
                        ))}
                        <Link to={`/products?search=${encodeURIComponent(trimmed)}`} className="avito-search-all" onClick={() => setSuggestOpen(false)}>
                          Voir tous les résultats <FiArrowRight size={14} />
                        </Link>
                      </>
                    ) : (
                      <div className="avito-search-empty">Aucun résultat pour « {trimmed} »</div>
                    )}
                  </div>
                )}
              </div>
              <div className="avito-search-select">
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  <option value="">Toutes les categories</option>
                  <option value="Smartphones">Smartphones</option>
                  <option value="Tablettes">Tablettes</option>
                  <option value="Ordinateurs">Ordinateurs</option>
                  <option value="Accessoires">Accessoires</option>
                </select>
              </div>
              <div className="avito-search-select">
                <FiMapPin size={16} className="avito-search-icon-inside" />
                <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                  <option value="">Toutes les villes</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" className="avito-search-btn">Rechercher</button>
            </form>
            {brands.length > 0 && (
              <div className="brands-scroll-wrapper" style={{ marginTop: 28 }}>
                <div className="brands-scroll-track">
                  {brands.concat(brands).concat(brands).map((brand, i) => (
                    <BrandCircle key={i} brand={brand} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {storeProducts.length > 0 && (
        <motion.section className="section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ background: 'rgba(245,158,11,0.03)', borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
          <div className="container">
            <div className="section-header home-section-header">
              <div className="home-heading">
                <span className="home-heading-icon home-heading-icon-store"><TbShieldCheck size={22} /></span>
                <div>
                  <h2 className="home-section-title home-section-title-store">Boutique Officielle</h2>
                  <p className="home-section-subtitle">Produits vendus directement par Occasion & Garantie</p>
                </div>
              </div>
              <Link to="/boutique" className="btn btn-secondary">Voir la boutique <FiArrowRight size={16} /></Link>
            </div>
            {storeLoad ? <SkeletonGrid count={4} /> : (
              <div className="products-grid">
                {storeProducts.map(p => (
                  <Link key={p.id} to={`/boutique/${p.slug}`} className="product-card" style={{ textDecoration: 'none' }}>
                    <div className="product-card-image" style={{ position: 'relative', background: 'var(--bg-secondary)', aspectRatio: '1/1' }}>
                      {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FiShoppingBag size={48} style={{ opacity: 0.15 }} />}
                      <span style={{ position: 'absolute', top: 8, right: 8, background: '#d97706', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>Officiel</span>
                    </div>
                    <div className="product-card-info" style={{ padding: 12 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginTop: 6 }}>{formatPrice(p.price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      )}

      <motion.section className="section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <div className="section-header home-section-header">
            <div className="home-heading">
              <span className="home-heading-icon home-heading-icon-latest"><TbClockHour5 size={22} /></span>
              <div>
                <h2 className="home-section-title">Dernieres annonces</h2>
                <p className="home-section-subtitle">{products.length} telephones disponibles a la vente.</p>
              </div>
            </div>
            <Link to="/products" className="btn btn-secondary">Voir tout <FiArrowRight size={16} /></Link>
          </div>
          {loading ? <SkeletonGrid count={8} /> : products.length > 0 ? (
            <div className="products-grid">
              {products.map((p, i) => <HomeProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : (
            <div className="empty-state"><FiSmartphone size={48} /><p>Aucune annonce pour le moment.</p></div>
          )}
        </div>
      </motion.section>

      <TrustBar />

      <motion.section className="section sell-promo" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <div className="sell-promo-bar">
            <div className="sell-promo-content">
              <h2>Un telephone a vendre ?</h2>
              <p>Annonce gratuite, zero commission, paiement securise.</p>
            </div>
            <Link to="/vendre" className="btn btn-primary">
              Vendre maintenant <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </motion.section>

      <NewsletterSection />
    </motion.div>
  );
}
