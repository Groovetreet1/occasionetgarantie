import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone, ArrowRight, ShoppingBag, Search, MapPin, Shield, Truck, Award, Star, Check, CheckCircle, Headphones, Monitor, Tablet, Zap, Clock, ChevronRight,
} from 'lucide-react';
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
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } } };

function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
          <div className="aspect-square bg-muted" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-5 bg-muted rounded w-1/3" />
          </div>
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
      className="flex-shrink-0 flex flex-col items-center gap-1.5 transition-transform hover:scale-110">
      <div className="w-14 h-14 rounded-full bg-white border border-border shadow-sm flex items-center justify-center overflow-hidden text-lg font-extrabold text-amber-600">
        {hasError ? brand.charAt(0).toUpperCase() : (
          <img src={src} alt={brand} className="w-[68%] h-[68%] object-contain" onError={() => setHasError(true)} />
        )}
      </div>
      <span className="text-[11px] text-muted-foreground whitespace-nowrap font-semibold">{brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
    </Link>
  );
}

const SAAS_CATEGORIES = [
  { slug: 'Smartphones', label: 'Smartphones', icon: Smartphone, descKey: 'home.catSmartphonesDesc' },
  { slug: 'Tablettes', label: 'Tablettes', icon: Tablet, descKey: 'home.catTabletsDesc' },
  { slug: 'Ordinateurs', label: 'Ordinateurs', icon: Monitor, descKey: 'home.catComputersDesc' },
  { slug: 'Accessoires', label: 'Accessoires', icon: Headphones, descKey: 'home.catAccessoriesDesc' },
  { slug: 'Gaming', label: 'Gaming', icon: Zap, descKey: 'home.catGamingDesc' },
];

const USP_ITEMS = [
  { key: 'warranty', icon: Shield, titleKey: 'home.uspWarranty', subKey: 'home.uspWarrantySub' },
  { key: 'verified', icon: CheckCircle, titleKey: 'home.uspVerified', subKey: 'home.uspVerifiedSub' },
  { key: 'delivery', icon: Truck, titleKey: 'home.uspDelivery', subKey: 'home.uspDeliverySub' },
  { key: 'payment', icon: ShoppingBag, titleKey: 'home.uspPayment', subKey: 'home.uspPaymentSub' },
];

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
    description: "Occasion & Garantie : marketplace marocaine de produits electroniques d'occasion.",
    keywords: 'occasion, garantie, maroc, smartphone, iphone, samsung, xiaomi, tablette, pc, gaming, electronique',
    image: '/logo.png',
    canonical: 'https://www.occasionetgarantie.store/',
    jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Occasion & Garantie', url: 'https://www.occasionetgarantie.store/', inLanguage: 'fr-MA' }],
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
    <div className="min-h-screen bg-background text-foreground">
      <PromoPopup />

      {/* Brands strip */}
      {brands.length > 0 && (
        <div className="w-full bg-card border-y border-border py-3 mt-[70px]">
          <div className="max-w-7xl mx-auto px-4 overflow-hidden">
            <div className="flex gap-5 w-max animate-[brandsLoop_40s_linear_infinite] hover:[animation-play-state:paused]">
              {brands.concat(brands).concat(brands).map((brand, i) => (
                <BrandCircle key={i} brand={brand} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <HeroSlider />

      {/* USP bar */}
      <section className="bg-zinc-950 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {USP_ITEMS.map(({ icon: Icon, titleKey, subKey }) => (
            <div key={titleKey} className="flex items-center gap-3 px-2">
              <div className="w-11 h-11 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-sm font-bold leading-tight">{t(titleKey)}</strong>
                <span className="block text-xs text-white/55 mt-0.5">{t(subKey)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Welcome / Intro */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 rounded-3xl overflow-hidden bg-zinc-950 text-white">
            <div className="p-10 md:p-14 relative z-10">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold tracking-widest uppercase">
                <Award className="w-3 h-3" /> {t('home.welcomeLabel')}
              </span>
              <h2 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                {t('home.welcomeTitle')} <em className="not-italic text-amber-400">{t('home.welcomeTitleAccent')}</em>
              </h2>
              <p className="mt-4 max-w-md text-white/60 text-sm leading-relaxed">{t('home.welcomeText')}</p>
              <div className="flex gap-9 my-7">
                <div><strong className="block text-2xl font-extrabold text-amber-400">12</strong><span className="text-[11px] uppercase tracking-wider text-white/45">{t('home.statWarranty')}</span></div>
                <div><strong className="block text-2xl font-extrabold text-amber-400">40+</strong><span className="text-[11px] uppercase tracking-wider text-white/45">{t('home.statCities')}</span></div>
                <div><strong className="block text-2xl font-extrabold text-amber-400">7j/7</strong><span className="text-[11px] uppercase tracking-wider text-white/45">{t('home.statSupport')}</span></div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold uppercase tracking-wider text-xs px-6">
                  <Link to="/products">{t('home.heroExplore')} <ArrowRight className="w-4 h-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-white/25 text-white hover:border-amber-400 hover:text-amber-400 uppercase tracking-wider text-xs px-6">
                  <Link to="/boutique"><Shield className="w-4 h-4" /> {t('home.viewStore')}</Link>
                </Button>
              </div>
            </div>
            <div className="relative min-h-[320px]">
              <img src="/slides/slide2.jpg" alt="Produits vérifiés" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent" />
              <span className="absolute bottom-5 right-5 z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 text-zinc-950 text-[11px] font-bold uppercase tracking-wider">
                <CheckCircle className="w-3.5 h-3.5" /> {t('home.uspWarranty')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <span className="inline-flex items-center gap-2 text-amber-500 text-[11px] font-bold tracking-[2.4px] uppercase before:content-[''] before:w-6 before:h-0.5 before:bg-amber-500">
                {t('home.shopByCategory')}
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight uppercase">{t('home.explore')}</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">{t('home.shopByCategorySub')}</p>
            </div>
            <Link to="/products" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-b-2 border-amber-500 pb-1 hover:text-amber-500 transition-colors">
              {t('home.browseAll')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {SAAS_CATEGORIES.map(({ slug, label, icon: Icon, descKey }) => (
              <Link key={slug} to={`/products?category=${encodeURIComponent(slug)}`}
                className="group relative flex flex-col gap-3 p-6 rounded-2xl border border-border bg-card hover:border-amber-500 hover:-translate-y-1 hover:shadow-lg transition-all overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-amber-500 group-hover:text-zinc-950 text-amber-500 flex items-center justify-center transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-sm uppercase tracking-wide">{label}</h3>
                <p className="text-xs text-muted-foreground leading-snug">{t(descKey)}</p>
                <ChevronRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <motion.section className="py-12" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <span className="inline-flex items-center gap-2 text-amber-500 text-[11px] font-bold tracking-[2.4px] uppercase before:content-[''] before:w-6 before:h-0.5 before:bg-amber-500">
                {t('home.latestAds')}
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight uppercase">{t('home.newArrivals')}</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">{t('home.newArrivalsSub')}</p>
            </div>
            <Link to="/products" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-b-2 border-amber-500 pb-1 hover:text-amber-500 transition-colors">
              {t('home.viewAll')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? <SkeletonGrid count={8} /> : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p, i) => <HomeProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Smartphone className="w-12 h-12 mx-auto opacity-30" />
              <p className="mt-3">{t('home.noAds')}</p>
            </div>
          )}
        </div>
      </motion.section>

      <GoMobileFadeBar />

      {/* Store official */}
      {storeProducts.length > 0 && (
        <motion.section className="py-12 bg-muted/40 border-y border-border" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between gap-6 mb-8">
              <div>
                <span className="inline-flex items-center gap-2 text-amber-500 text-[11px] font-bold tracking-[2.4px] uppercase before:content-[''] before:w-6 before:h-0.5 before:bg-amber-500">
                  {t('home.officialBadge')}
                </span>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight uppercase">{t('home.storeOfficial')}</h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">{t('home.storeSubtitle')}</p>
              </div>
              <Link to="/boutique" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-b-2 border-amber-500 pb-1 hover:text-amber-500 transition-colors">
                {t('home.viewStore')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {storeLoad ? <SkeletonGrid count={4} /> : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {storeProducts.map(p => (
                  <Link key={p.id} to={`/boutique/${p.slug}`} className="group block">
                    <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all border-border">
                      <div className="relative aspect-square bg-muted">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain p-5" />
                        ) : (
                          <ShoppingBag className="absolute inset-0 m-auto w-12 h-12 opacity-20" />
                        )}
                        <Badge className="absolute top-3 right-3 bg-amber-500 text-zinc-950 border-0">
                          <Star className="w-3 h-3 mr-1" /> {t('home.officialBadge')}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{p.category || 'Boutique'}</span>
                        <h3 className="mt-1 text-sm font-bold leading-snug line-clamp-2">{p.name}</h3>
                        <div className="mt-2 text-lg font-extrabold text-amber-500">{formatPrice(p.price)}</div>
                        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                          <CheckCircle className="w-3.5 h-3.5" /> {t('home.uspWarranty')}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      )}

      <TrustBar />

      {/* Sell promo */}
      <motion.section className="py-12" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl font-extrabold tracking-tight">{t('home.sellPhoneTitle')}</h2>
              <p className="mt-1 text-white/60 text-sm">{t('home.sellPhoneDesc')}</p>
            </div>
            <Button asChild className="relative rounded-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold uppercase tracking-wider text-xs px-7 py-6">
              <Link to="/vendre">{t('home.sellNow')} <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </motion.section>

      <GoMobileTicker />
      <NewsletterSection />
    </div>
  );
}
