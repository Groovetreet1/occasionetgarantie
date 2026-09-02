import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSmartphone, FiArrowRight, FiShoppingBag, FiSearch, FiMapPin, FiShield, FiTruck, FiAward, FiStar, FiCheck, FiCheckCircle, FiLayers, FiHeadphones, FiMonitor, FiTablet, FiZap, FiClock } from 'react-icons/fi';
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

const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };

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
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '1px solid var(--border-light)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 18, fontWeight: 800, color: '#d97706' }}>
        {hasError ? brand.charAt(0).toUpperCase() : (
          <img src={src} alt={brand} style={{ width: '68%', height: '68%', objectFit: 'contain' }} onError={() => setHasError(true)} />
        )}
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>{brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
    </Link>
  );
}

const SAAS_CATEGORIES = [
  { slug: 'Smartphones', label: 'Smartphones', icon: FiSmartphone, desc: 'iPhone, Samsung, Xiaomi reconditionnés', count: '2 400+' },
  { slug: 'Tablettes', label: 'Tablettes', icon: FiTablet, desc: 'iPad, Samsung Tab, Huawei', count: '860+' },
  { slug: 'Ordinateurs', label: 'Ordinateurs', icon: FiMonitor, desc: 'MacBook, PC portables, Gaming', count: '1 100+' },
  { slug: 'Accessoires', label: 'Accessoires', icon: FiHeadphones, desc: 'Écouteurs, chargeurs, coques', count: '3 200+' },
];

function WaveDivider() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 0' }}>
      <svg width="120" height="18" viewBox="0 0 120 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden style={{ color: 'var(--primary)', opacity: 0.9 }}>
        <path d="M2 12 Q 15 2 30 12 T 60 12 T 90 12 T 118 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_URL || '';

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

  // Prepare 4 mockup phones from real products for premium hero mockup
  const mockupPhones = (products && products.length >= 4 ? products.slice(0, 4) : [
    { id: 1, name: 'iPhone 14 Pro 128GB', price: 7890, image: '', ville: 'Casablanca' },
    { id: 2, name: 'Samsung S23 Ultra', price: 8990, image: '', ville: 'Rabat' },
    { id: 3, name: 'MacBook Air M1', price: 7490, image: '', ville: 'Marrakech' },
    { id: 4, name: 'iPad Air 5', price: 5490, image: '', ville: 'Tanger' },
  ]);

  return (
    <motion.div initial="hidden" animate="show">
      <PromoPopup />

      {/* PREMIUM HERO - SaasAble Hero17 inspired */}
      <div className="hero-premium-wrap">
        <div className="hero-premium-bg" aria-hidden />
        <section className="hero-premium">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="hero-chip-premium">
                <span>Marketplace #1 au Maroc</span>
                <span className="hero-chip-badge"><FiStar size={12} /> 4.8/5 • 12 000 avis</span>
              </div>
            </motion.div>

            <motion.h1 className="hero-title-premium" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.06 }}>
              L’électronique d’occasion<br /><em>enfin sans risque.</em>
            </motion.h1>

            <WaveDivider />

            <motion.p className="hero-caption-premium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }}>
              Smartphones reconditionnés, tablettes et PC garantis 12 mois. Testés, nettoyés, livrés en 24h partout au Maroc.
            </motion.p>

            <motion.div className="hero-actions-premium" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <Link to="/products" className="btn-hero-primary">Explorer les annonces <FiArrowRight size={16} /></Link>
              <Link to="/vendre" className="btn-hero-secondary"><FiZap size={16} /> Vendre mon téléphone</Link>
            </motion.div>

            <motion.div className="hero-chips-premium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}>
              <span className="hero-chip-item"><FiShield size={14} /> Garantie 12 mois</span>
              <span className="hero-chip-item"><FiTruck size={14} /> Livraison 24/48h</span>
              <span className="hero-chip-item"><FiCheckCircle size={14} /> Paiement sécurisé</span>
              <span className="hero-chip-item"><FiAward size={14} /> Reprise express</span>
            </motion.div>

            {/* Pill search bar inside hero - SaasAble autocomplete style */}
            <motion.form onSubmit={handleSearch} className="avito-search-bar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} style={{ maxWidth: 760, margin: '0 auto 36px', borderRadius: 999, boxShadow: '0 16px 40px rgba(0,0,0,0.08)', border: '1px solid var(--border-light)' }}>
              <div className="avito-search-input-wrap" ref={searchWrapRef} style={{ borderRadius: '999px 0 0 999px' }}>
                <FiSearch size={18} className="avito-search-icon" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('home.searchPlaceholder')} style={{ fontSize: 15 }} />
                {suggestOpen && trimmed.length >= 2 && (
                  <div className="avito-search-dropdown" style={{ borderRadius: 16 }}>
                    {suggestLoading ? (
                      <div className="avito-search-dropdown-loading"><div className="spinner spinner-sm" /></div>
                    ) : suggestions.length > 0 ? (
                      <>
                        {suggestions.map(p => (
                          <Link key={p.id} to={p.product_type === 'store' ? `/boutique/${p.slug}` : `/products/${p.slug}`} className="avito-search-item" onClick={() => setSuggestOpen(false)}>
                            <div className="avito-search-item-img">
                              {p.image ? <img src={p.image.startsWith('http') ? p.image : `${API_BASE}/uploads/${p.image}`} alt={p.name} loading="lazy" /> : <FiShoppingBag size={18} style={{ opacity: 0.3 }} />}
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
              <button type="submit" className="avito-search-btn" style={{ borderRadius: 999, margin: 4, padding: '12px 24px', background: 'linear-gradient(135deg, var(--primary), #d97706)', color: '#000', fontWeight: 700 }}>{t('home.searchBtn')}</button>
            </motion.form>

            {/* Hero mockup - GraphicsCard with 5px border like SaasAble Hero17 video */}
            <motion.div className="hero-mockup-premium" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              <div className="hero-mockup-bar">
                <span className="hero-mockup-dot r" /><span className="hero-mockup-dot y" /><span className="hero-mockup-dot g" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginLeft: 8 }}>occasionetgarantie.store — Marketplace</span>
                <span className="hero-mockup-search"><FiSearch size={12} /> Rechercher iPhone 14...</span>
              </div>
              <div className="hero-mockup-grid">
                {mockupPhones.map(p => {
                  const imgSrc = p.image ? (p.image.startsWith('http') ? p.image : `${API_BASE}/uploads/${p.image}`) : null;
                  return (
                    <div key={p.id} className="hero-mockup-phone">
                      <div className="hero-mockup-phone-img">
                        {imgSrc ? <img src={imgSrc} alt={p.name} /> : <FiSmartphone size={28} style={{ opacity: 0.2 }} />}
                      </div>
                      <div className="hero-mockup-phone-title">{p.name}</div>
                      <div className="hero-mockup-phone-price">{formatPrice(p.price)}</div>
                      <div className="hero-mockup-phone-meta"><FiMapPin size={10} /> {p.ville || 'Casablanca'} <span className="hero-mockup-badge" style={{ marginLeft: 'auto' }}><FiCheck size={10} /> Garantie</span></div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

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
        </section>
      </div>

      {/* CATEGORIES - SaasAble IconCard premium */}
      <section className="section" style={{ paddingTop: 32, paddingBottom: 12 }}>
        <div className="container">
          <div className="section-header-premium">
            <span className="section-label-premium"><FiLayers size={12} /> Explorer par catégorie</span>
            <h2>Trouvez votre prochain appareil</h2>
            <p>Des milliers d’annonces vérifiées, triées par experts et garanties 12 mois.</p>
          </div>
          <motion.div className="saas-icon-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {SAAS_CATEGORIES.map(cat => (
              <motion.div key={cat.slug} variants={fadeUp}>
                <Link to={`/products?category=${cat.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="saas-icon-card" style={{ minHeight: 210 }}>
                    <div className="saas-icon-avatar" style={{ background: 'var(--primary-light)', borderColor: 'rgba(245,158,11,0.18)' }}><cat.icon size={26} /></div>
                    <div>
                      <h3>{cat.label} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12, marginLeft: 6 }}>{cat.count}</span></h3>
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

      {/* STORE OFFICIAL */}
      {storeProducts.length > 0 && (
        <motion.section className="section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
          <div className="container">
            <div className="section-header home-section-header" style={{ marginBottom: 28 }}>
              <div className="home-heading">
                <span className="home-heading-icon home-heading-icon-store" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', width: 46, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TbShieldCheck size={22} /></span>
                <div>
                  <h2 className="home-section-title home-section-title-store" style={{ fontSize: 22 }}>{t('home.storeOfficial')}</h2>
                  <p className="home-section-subtitle">{t('home.storeSubtitle')}</p>
                </div>
              </div>
              <Link to="/boutique" className="btn btn-secondary" style={{ borderRadius: 999 }}>{t('home.viewStore')} <FiArrowRight size={16} /></Link>
            </div>
            {storeLoad ? <SkeletonGrid count={4} /> : (
              <div className="products-grid">
                {storeProducts.map(p => (
                  <Link key={p.id} to={`/boutique/${p.slug}`} className="product-card saas-preview-card" style={{ textDecoration: 'none', borderRadius: 16 }}>
                    <div className="product-card-image" style={{ position: 'relative', background: 'var(--bg-secondary)', aspectRatio: '1/1' }}>
                      {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 18 }} /> : <FiShoppingBag size={48} style={{ opacity: 0.15 }} />}
                      <span style={{ position: 'absolute', top: 10, right: 10, background: 'var(--primary)', color: '#000', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}><FiStar size={10} /> {t('home.officialBadge')}</span>
                      <span className="saas-preview-arrow"><FiArrowRight size={14} /></span>
                    </div>
                    <div className="product-card-body" style={{ padding: 14 }}>
                      <h3 className="product-card-title" style={{ fontSize: 14 }}>{p.name}</h3>
                      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--primary)', marginTop: 6 }}>{formatPrice(p.price)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><FiCheckCircle size={11} style={{ color: '#10b981' }} /> Garantie 12 mois</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      )}

      <GoMobileFadeBar />

      {/* LATEST ADS */}
      <motion.section className="section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <div className="section-header-premium" style={{ marginBottom: 28 }}>
            <span className="section-label-premium"><TbClockHour5 size={12} /> Dernières annonces</span>
            <h2>Les bonnes affaires du moment</h2>
            <p>{products.length} téléphones disponibles à la vente — vérifiés et garantis.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Link to="/products" className="btn btn-secondary" style={{ borderRadius: 999 }}>{t('home.viewAll')} <FiArrowRight size={16} /></Link>
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

      {/* FEATURE PREMIUM - Why us */}
      <section className="section" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <div className="feature-premium">
            <div className="feature-premium-content">
              <span className="section-label-premium"><FiShield size={12} /> Pourquoi nous choisir</span>
              <h2>Achetez serein. <span style={{ color: 'var(--primary)' }}>Vendez au juste prix.</span></h2>
              <p>Chaque appareil passe 32 points de contrôle. Batterie, écran, capteurs, IMEI — tout est vérifié par nos experts.</p>
              <div className="feature-premium-list">
                <div className="feature-premium-item"><div className="feature-premium-check"><FiCheck size={14} /></div><div><strong>Garantie 12 mois écrite</strong><span>Échange ou remboursement si panne — support WhatsApp 7j/7.</span></div></div>
                <div className="feature-premium-item"><div className="feature-premium-check"><FiCheck size={14} /></div><div><strong>Paiement à la livraison</strong><span>Payez quand vous recevez. Virement instantané pour les vendeurs.</span></div></div>
                <div className="feature-premium-item"><div className="feature-premium-check"><FiCheck size={14} /></div><div><strong>Reprise en 5 minutes</strong><span>Estimation photo immédiate, enlèvement gratuit à domicile.</span></div></div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
                <Link to="/products" className="btn-hero-primary" style={{ padding: '12px 22px' }}>Voir les annonces <FiArrowRight size={14} /></Link>
                <Link to="/about" className="btn-hero-secondary" style={{ padding: '12px 22px' }}>Comment ça marche</Link>
              </div>
            </div>
            <div className="feature-premium-visual">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><FiShield size={20} /></span>
                <div><strong style={{ fontSize: 15 }}>Contrôle qualité 32 points</strong><br /><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Certifié Occasion & Garantie</span></div>
                <span style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 999, background: '#10b981', color: '#fff', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCheckCircle size={12} /> Certifié</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 14, textAlign: 'center' }}><FiSmartphone size={20} style={{ color: 'var(--primary)' }} /><div style={{ fontWeight: 700, marginTop: 6 }}>Écran</div><div style={{ fontSize: 11, color: '#10b981' }}>● Parfait</div></div>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 14, textAlign: 'center' }}><FiZap size={20} style={{ color: 'var(--primary)' }} /><div style={{ fontWeight: 700, marginTop: 6 }}>Batterie 92%</div><div style={{ fontSize: 11, color: '#10b981' }}>● Excellente</div></div>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 14, textAlign: 'center' }}><FiLayers size={20} style={{ color: 'var(--primary)' }} /><div style={{ fontWeight: 700, marginTop: 6 }}>Châssis</div><div style={{ fontSize: 11, color: '#10b981' }}>● Impeccable</div></div>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 14, textAlign: 'center' }}><FiClock size={20} style={{ color: 'var(--primary)' }} /><div style={{ fontWeight: 700, marginTop: 6 }}>Garantie</div><div style={{ fontSize: 11, color: 'var(--primary)' }}>12 mois</div></div>
              </div>
              <div style={{ background: 'var(--primary-light)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                <FiStar size={16} style={{ color: 'var(--primary)' }} /><strong>Livré avec certificat + facture + boîte</strong> <span style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--primary)' }}>→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS PREMIUM */}
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="container">
          <div className="metrics-premium">
            <div className="metrics-premium-card"><div className="metrics-premium-value">5 200+</div><div className="metrics-premium-label">Produits vendus</div><div className="metrics-premium-sub">Depuis 2024, avec suivi et garantie.</div></div>
            <div className="metrics-premium-card"><div className="metrics-premium-value">12 000+</div><div className="metrics-premium-label">Clients satisfaits</div><div className="metrics-premium-sub">Note moyenne 4.8/5 sur 3 400 avis vérifiés.</div></div>
            <div className="metrics-premium-card"><div className="metrics-premium-value">98%</div><div className="metrics-premium-label">Avis positifs</div><div className="metrics-premium-sub">Taux de satisfaction — SAV en moins de 24h.</div></div>
          </div>
        </div>
      </section>

      <TrustBar />

      <motion.section className="section sell-promo" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <div className="sell-promo-bar" style={{ borderRadius: 20, background: 'linear-gradient(135deg, #fff 0%, #fef3c7 100%)', border: '1px solid #fde68a', color: '#92400e', padding: '28px 24px' }}>
            <div className="sell-promo-content">
              <h2 style={{ color: '#92400e' }}>{t('home.sellPhoneTitle')}</h2>
              <p style={{ color: '#a16207' }}>{t('home.sellPhoneDesc')}</p>
            </div>
            <Link to="/vendre" className="btn btn-primary" style={{ background: '#f59e0b', color: '#000', borderRadius: 999, boxShadow: '0 8px 20px rgba(245,158,11,0.3)' }}>
              {t('home.sellNow')} <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* CTA PREMIUM */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <motion.div className="saas-cta" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', border: '1px solid #1e293b' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: 11, fontWeight: 700, marginBottom: 14 }}><FiZap size={12} /> REPRISE EXPRESS</div>
            <h2 style={{ color: '#fff' }}>Vous avez un téléphone à vendre ?</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Estimation photo en 5 minutes, enlèvement gratuit à domicile et paiement en 48h. Zéro commission.</p>
            <Link to="/reprise" className="btn" style={{ background: '#f59e0b', color: '#000', borderRadius: 999, padding: '14px 28px', fontWeight: 800 }}>Demander une reprise <FiArrowRight size={16} /></Link>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.6)', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCheckCircle size={11} /> Estimation gratuite</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCheckCircle size={11} /> Paiement 48h</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiCheckCircle size={11} /> Enlèvement gratuit</span>
            </div>
          </motion.div>
        </div>
      </section>

      <GoMobileTicker />

      <NewsletterSection />
    </motion.div>
  );
}
