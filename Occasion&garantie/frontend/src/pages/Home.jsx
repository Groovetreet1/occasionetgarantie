import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSmartphone, FiArrowRight, FiShoppingBag, FiSearch, FiMapPin, FiShield, FiTruck, FiAward, FiStar, FiCheckCircle, FiLayers, FiHeadphones, FiMonitor, FiTablet } from 'react-icons/fi';
import { TbShieldCheck, TbClockHour5 } from 'react-icons/tb';
import api from '../api/axios';
import HomeProductCard from '../components/HomeProductCard';
import TrustBar from '../components/TrustBar';
import NewsletterSection from '../components/NewsletterSection';
import PromoPopup from '../components/PromoPopup';
import GoMobileTicker from '../components/GoMobileTicker';
import GoMobileFadeBar from '../components/GoMobileFadeBar';
import { useLanguage } from '../context/LanguageContext';
import usePageMeta from '../utils/usePageMeta';

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

// SaasAble-inspired category data for IconCard grid
const SAAS_CATEGORIES = [
  { slug: 'Smartphones', label: 'Smartphones', icon: FiSmartphone, desc: 'iPhone, Samsung, Xiaomi reconditionnés' },
  { slug: 'Tablettes', label: 'Tablettes', icon: FiTablet, desc: 'iPad, Samsung Tab, Huawei' },
  { slug: 'Ordinateurs', label: 'Ordinateurs', icon: FiMonitor, desc: 'PC portables, MacBook, Gaming' },
  { slug: 'Accessoires', label: 'Accessoires', icon: FiHeadphones, desc: 'Écouteurs, chargeurs, coques' },
];

const SAAS_FEATURES = [
  { icon: FiShield, title: 'Garantie 12 mois', desc: 'Tous nos produits occasion sont testés, nettoyés et garantis 12 mois pièces et main d’œuvre.' },
  { icon: FiTruck, title: 'Livraison rapide', desc: 'Livraison partout au Maroc en 24-48h. Paiement à la livraison disponible à Casablanca, Rabat, Marrakech.' },
  { icon: FiAward, title: 'Paiement sécurisé', desc: 'Paiement sécurisé, reprise de votre ancien téléphone avec estimation instantanée et prix juste.' },
];

function WaveDivider() {
  return (
    <svg className="saas-wave" viewBox="0 0 120 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M2 12 Q 15 2 30 12 T 60 12 T 90 12 T 118 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9" />
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  useEffect(() => { document.title = t('home.metaTitle'); }, [t]);

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

  usePageMeta({
    title: "Occasion & Garantie - Acheter et vendre de l'electronique d'occasion au Maroc",
    description: "Occasion & Garantie : marketplace marocaine de produits electroniques d'occasion. Achetez et vendez smartphones, tablettes, PC, gaming et accessoires tech en toute securite.",
    keywords: 'occasion, garantie, maroc, casablanca, smartphone, iphone, samsung, xiaomi, tablette, pc, gaming, electronique, reconditionne',
    image: '/logo.png',
    canonical: 'https://www.occasionetgarantie.store/',
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Occasion & Garantie',
      url: 'https://www.occasionetgarantie.store/',
      inLanguage: 'fr-MA',
    }],
  });

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

      {/* SaasAble-inspired Hero: offer chip + centered heading + wave + pill search */}
      <section className="avito-hero saas-hero">
        <div className="container">
          <div className="avito-hero-content">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', justifyContent: 'center' }}>
              <span className="saas-offer-chip">
                <FiStar size={12} style={{ color: '#f59e0b' }} />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>5000+ annonces vérifiées</span>
                <strong><FiCheckCircle size={12} /> Garantie 12 mois</strong>
              </span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}>{t('home.heroTitle')}</motion.h1>
            <motion.p className="avito-hero-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 640, margin: '0 auto 8px' }}>
              Marketplace marocaine de l’électronique d’occasion — smartphones reconditionnés, tablettes et PC garantis.
            </motion.p>
            <WaveDivider />
            <motion.form onSubmit={handleSearch} className="avito-search-bar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ marginTop: 20 }}>
              <div className="avito-search-input-wrap" ref={searchWrapRef}>
                <FiSearch size={18} className="avito-search-icon" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('home.searchPlaceholder')} />
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
                          {t('home.seeAllResults')} <FiArrowRight size={14} />
                        </Link>
                      </>
                    ) : (
                      <div className="avito-search-empty">{t('home.noResult', { query: trimmed })}</div>
                    )}
                  </div>
                )}
              </div>
              <div className="avito-search-select">
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  <option value="">{t('home.allCategories')}</option>
                  <option value="Smartphones">Smartphones</option>
                  <option value="Tablettes">Tablettes</option>
                  <option value="Ordinateurs">Ordinateurs</option>
                  <option value="Accessoires">Accessoires</option>
                </select>
              </div>
              <div className="avito-search-select">
                <FiMapPin size={16} className="avito-search-icon-inside" />
                <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                  <option value="">{t('home.allCities')}</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" className="avito-search-btn">{t('home.searchBtn')}</button>
            </motion.form>
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

      {/* SaasAble IconCard grid for categories */}
      <section className="section" style={{ paddingTop: 32, paddingBottom: 8 }}>
        <div className="container">
          <motion.div className="saas-icon-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {SAAS_CATEGORIES.map(cat => (
              <motion.div key={cat.slug} variants={fadeUp}>
                <Link to={`/products?category=${cat.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="saas-icon-card">
                    <div className="saas-icon-avatar"><cat.icon size={26} /></div>
                    <div>
                      <h3>{cat.label}</h3>
                      <p>{cat.desc}</p>
                    </div>
                    <div className="saas-card-footer">Explorer <FiArrowRight size={14} /></div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {storeProducts.length > 0 && (
        <motion.section className="section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ background: 'rgba(245,158,11,0.03)', borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
          <div className="container">
            <div className="section-header home-section-header">
              <div className="home-heading">
                <span className="home-heading-icon home-heading-icon-store"><TbShieldCheck size={22} /></span>
                <div>
                  <h2 className="home-section-title home-section-title-store">{t('home.storeOfficial')}</h2>
                  <p className="home-section-subtitle">{t('home.storeSubtitle')}</p>
                </div>
              </div>
              <Link to="/boutique" className="btn btn-secondary">{t('home.viewStore')} <FiArrowRight size={16} /></Link>
            </div>
            {storeLoad ? <SkeletonGrid count={4} /> : (
              <div className="products-grid">
                {storeProducts.map(p => (
                  <Link key={p.id} to={`/boutique/${p.slug}`} className="product-card saas-preview-card" style={{ textDecoration: 'none' }}>
                    <div className="product-card-image" style={{ position: 'relative', background: 'var(--bg-secondary)', aspectRatio: '1/1' }}>
                      {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 16 }} /> : <FiShoppingBag size={48} style={{ opacity: 0.15 }} />}
                      <span style={{ position: 'absolute', top: 8, right: 8, background: '#d97706', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}><FiStar size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />{t('home.officialBadge')}</span>
                      <span className="saas-preview-arrow"><FiArrowRight size={14} /></span>
                    </div>
                    <div className="product-card-body" style={{ padding: 14 }}>
                      <h3 className="product-card-title" style={{ fontSize: 14 }}>{p.name}</h3>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginTop: 6 }}>{formatPrice(p.price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      )}

      <GoMobileFadeBar />

      <motion.section className="section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <div className="section-header home-section-header">
            <div className="home-heading">
              <span className="home-heading-icon home-heading-icon-latest"><TbClockHour5 size={22} /></span>
              <div>
                <h2 className="home-section-title">{t('home.latestAds')}</h2>
                <p className="home-section-subtitle">{t('home.latestSubtitle', { count: products.length })}</p>
              </div>
            </div>
            <Link to="/products" className="btn btn-secondary">{t('home.viewAll')} <FiArrowRight size={16} /></Link>
          </div>
          {loading ? <SkeletonGrid count={8} /> : products.length > 0 ? (
            <div className="products-grid">
              {products.map((p, i) => <HomeProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : (
            <div className="empty-state"><FiSmartphone size={48} /><p>{t('home.noAds')}</p></div>
          )}
        </div>
      </motion.section>

      {/* SaasAble IconCard features */}
      <section className="section" style={{ paddingTop: 8 }}>
        <div className="container">
          <motion.div className="saas-icon-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {SAAS_FEATURES.map(f => (
              <motion.div key={f.title} variants={fadeUp}>
                <div className="saas-icon-card" style={{ minHeight: 220 }}>
                  <div className="saas-icon-avatar"><f.icon size={26} /></div>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <TrustBar />

      <motion.section className="section sell-promo" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <div className="sell-promo-bar">
            <div className="sell-promo-content">
              <h2>{t('home.sellPhoneTitle')}</h2>
              <p>{t('home.sellPhoneDesc')}</p>
            </div>
            <Link to="/vendre" className="btn btn-primary">
              {t('home.sellNow')} <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* SaasAble CTA block */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <motion.div className="saas-cta" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2>Vous avez un téléphone à vendre ?</h2>
            <p>Estimation instantanée, reprise garantie et paiement rapide. Rejoignez les vendeurs qui font confiance à Occasion & Garantie.</p>
            <Link to="/reprise" className="btn">Demander une reprise <FiArrowRight size={16} /></Link>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, opacity: 0.8, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCheckCircle size={12} /> Estimation gratuite</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCheckCircle size={12} /> Paiement en 48h</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCheckCircle size={12} /> Suivi sécurisé</span>
            </div>
          </motion.div>
        </div>
      </section>

      <GoMobileTicker />

      <NewsletterSection />
    </motion.div>
  );
}
