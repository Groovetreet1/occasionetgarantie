import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSmartphone, FiArrowRight, FiShoppingBag, FiSearch, FiShield, FiTruck, FiAward, FiStar, FiCheckCircle, FiHeadphones, FiMonitor, FiTablet, FiZap } from 'react-icons/fi';
import api from '../api/axios';
import HomeProductCard from '../components/HomeProductCard';
import TrustBar from '../components/TrustBar';
import NewsletterSection from '../components/NewsletterSection';
import PromoPopup from '../components/PromoPopup';
import GoMobileTicker from '../components/GoMobileTicker';
import GoMobileFadeBar from '../components/GoMobileFadeBar';
import HeroSlider from '../components/HeroSlider';
import { useLanguage } from '../context/LanguageContext';
import usePageMeta from '../utils/usePageMeta';

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

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
      style={{ flexShrink: 0, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'transform 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '1px solid var(--border-light)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 18, fontWeight: 800, color: '#0a0a0a' }}>
        {hasError ? brand.charAt(0).toUpperCase() : (
          <img src={src} alt={brand} style={{ width: '66%', height: '66%', objectFit: 'contain', filter: 'grayscale(1)', opacity: 0.75 }} onError={() => setHasError(true)} />
        )}
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>{brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
    </Link>
  );
}

const CATEGORIES = [
  { slug: 'Smartphones', label: 'Smartphones', icon: FiSmartphone, descKey: 'home.catSmartphonesDesc' },
  { slug: 'Tablettes', label: 'Tablettes', icon: FiTablet, descKey: 'home.catTabletsDesc' },
  { slug: 'Ordinateurs', label: 'Ordinateurs', icon: FiMonitor, descKey: 'home.catComputersDesc' },
  { slug: 'Accessoires', label: 'Accessoires', icon: FiHeadphones, descKey: 'home.catAccessoriesDesc' },
  { slug: 'Gaming', label: 'Gaming', icon: FiZap, descKey: 'home.catGamingDesc' },
];

const USP = [
  { icon: FiShield, titleKey: 'home.uspWarranty', subKey: 'home.uspWarrantySub' },
  { icon: FiCheckCircle, titleKey: 'home.uspVerified', subKey: 'home.uspVerifiedSub' },
  { icon: FiTruck, titleKey: 'home.uspDelivery', subKey: 'home.uspDeliverySub' },
  { icon: FiShoppingBag, titleKey: 'home.uspPayment', subKey: 'home.uspPaymentSub' },
];

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

  const FALLBACK_CITIES = ['Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir','Oujda','Meknès','Kenitra','Tétouan','Salé','Mohammedia'];
  useEffect(() => {
    api.get('/products/cities').then(res => {
      if (res.data && res.data.length) setCities(res.data);
      else setCities(FALLBACK_CITIES);
    }).catch(() => setCities(FALLBACK_CITIES));
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
    jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Occasion & Garantie', url: 'https://www.occasionetgarantie.store/', inLanguage: 'fr-MA' }],
  });

  const trimmed = searchTerm.trim();
  useEffect(() => {
    if (trimmed.length < 2) { setSuggestions([]); setSuggestOpen(false); return; }
    setSuggestLoading(true);
    const timer = setTimeout(() => {
      api.get(`/products?search=${encodeURIComponent(trimmed)}&limit=6`)
        .then(res => { setSuggestions(res.data.products || []); setSuggestOpen(true); })
        .catch(() => {})
        .finally(() => setSuggestLoading(false));
    }, 300);
    return () => clearTimeout(timer);
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

      {/* Mobile search */}
      <div className="navbar-search-mobile" style={{ display: 'none', padding: '12px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 999, padding: '4px 4px 4px 12px', gap: 6 }}>
          <FiSearch size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('home.searchPlaceholder')} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font)', minWidth: 0 }} />
          <button type="submit" style={{ background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t('common.search')}</button>
        </form>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', background: '#fff', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '14px 0', marginTop: 'var(--nav-height)', position: 'relative', zIndex: 1 }}>
          <div className="brands-scroll-wrapper" style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <div className="brands-scroll-track">
              {brands.concat(brands).concat(brands).map((brand, i) => (
                <BrandCircle key={i} brand={brand} />
              ))}
            </div>
          </div>
        </div>
      )}

      <HeroSlider />

      {/* USP */}
      <section className="pm-usp">
        <div className="container">
          <div className="pm-usp-grid">
            {USP.map(({ icon: Icon, titleKey, subKey }) => (
              <div className="pm-usp-item" key={titleKey}>
                <span className="pm-usp-icon"><Icon size={19} /></span>
                <div>
                  <strong>{t(titleKey)}</strong>
                  <span>{t(subKey)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="pm-section">
        <div className="container">
          <div className="pm-head">
            <div>
              <span className="pm-kicker">{t('home.shopByCategory')}</span>
              <h2 className="pm-title">{t('home.explore')}</h2>
              <p className="pm-sub">{t('home.shopByCategorySub')}</p>
            </div>
            <Link to="/products" className="pm-link">{t('home.browseAll')} <FiArrowRight size={14} /></Link>
          </div>
          <div className="pm-cats">
            {CATEGORIES.map(({ slug, label, icon: Icon, descKey }) => (
              <Link key={slug} to={`/products?category=${encodeURIComponent(slug)}`} className="pm-cat">
                <span className="pm-cat-icon"><Icon size={23} /></span>
                <h3>{label}</h3>
                <p>{t(descKey)}</p>
                <span className="pm-cat-arrow"><FiArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <motion.section className="pm-section" style={{ paddingTop: 0 }} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <div className="pm-head">
            <div>
              <span className="pm-kicker">{t('home.latestAds')}</span>
              <h2 className="pm-title">{t('home.newArrivals')}</h2>
              <p className="pm-sub">{t('home.newArrivalsSub')}</p>
            </div>
            <Link to="/products" className="pm-link">{t('home.viewAll')} <FiArrowRight size={14} /></Link>
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

      <GoMobileFadeBar />

      {/* Store official */}
      {storeProducts.length > 0 && (
        <motion.section className="pm-section pm-store" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <div className="container">
            <div className="pm-head">
              <div>
                <span className="pm-kicker">{t('home.officialBadge')}</span>
                <h2 className="pm-title">{t('home.storeOfficial')}</h2>
                <p className="pm-sub">{t('home.storeSubtitle')}</p>
              </div>
              <Link to="/boutique" className="pm-link">{t('home.viewStore')} <FiArrowRight size={14} /></Link>
            </div>
            {storeLoad ? <SkeletonGrid count={4} /> : (
              <div className="products-grid">
                {storeProducts.map(p => (
                  <Link key={p.id} to={`/boutique/${p.slug}`} className="product-card" style={{ textDecoration: 'none' }}>
                    <div className="product-card-image" style={{ position: 'relative' }}>
                      {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 18 }} /> : <FiShoppingBag size={48} style={{ opacity: 0.15 }} />}
                      <span style={{ position: 'absolute', top: 10, right: 10, background: '#0a0a0a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: 0.4 }}><FiStar size={10} /> {t('home.officialBadge')}</span>
                    </div>
                    <div className="product-card-body" style={{ padding: 16 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{p.category || 'Boutique'}</span>
                      <h3 className="product-card-title" style={{ fontSize: 15, marginTop: 4 }}>{p.name}</h3>
                      <div className="product-card-price-row" style={{ margin: '8px 0 10px' }}>
                        <span className="product-card-price" style={{ fontSize: 19 }}>{formatPrice(p.price)}</span>
                      </div>
                      <span className="pm-cta">{t('home.viewProduct')} <FiArrowRight size={13} /></span>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}><FiCheckCircle size={11} /> {t('home.uspWarranty')}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      )}

      <TrustBar />

      {/* Sell promo */}
      <motion.section className="pm-section pm-sell" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
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

      <GoMobileTicker />
      <NewsletterSection />
    </motion.div>
  );
}
