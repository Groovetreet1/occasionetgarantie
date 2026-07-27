import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSmartphone, FiHeadphones, FiTablet, FiShield, FiTruck, FiArrowRight, FiTrendingUp, FiShoppingBag, FiStar, FiSearch, FiMonitor, FiMapPin } from 'react-icons/fi';
import { BsPhone, BsLaptop, BsHeadphones } from 'react-icons/bs';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
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

const MOROCCAN_CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tanger', 'Agadir', 'Meknes', 'Oujda',
  'Kenitra', 'Tetouan', 'Safi', 'El Jadida', 'Beni Mellal', 'Nador', 'Taza',
  'Mohammedia', 'Laayoune', 'Khouribga', 'Settat', 'Berrechid',
];

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState(MOROCCAN_CITIES);

  useEffect(() => { document.title = 'Occasion & Garantie - Achetez et vendez des produits électroniques d\'occasion au Maroc'; }, []);

  useEffect(() => {
    api.get('/products/cities').then(res => { if (res.data.length) setCities(res.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/products?sort=newest').then(res => {
      setProducts(res.data.slice(0, 20));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    let url = '/products?';
    if (searchTerm.trim()) url += `search=${encodeURIComponent(searchTerm.trim())}&`;
    if (selectedCategory) url += `category=${selectedCategory}&`;
    if (selectedCity) url += `ville=${encodeURIComponent(selectedCity)}&`;
    navigate(url);
  };

  const categories = [
    { to: '/products?category=Smartphones', icon: BsPhone, title: 'Smartphones', desc: 'iPhone, Samsung, Xiaomi' },
    { to: '/products?category=Tablettes', icon: FiTablet, title: 'Tablettes', desc: 'iPad, Samsung Tab' },
    { to: '/products?category=Ordinateurs', icon: BsLaptop, title: 'Ordinateurs', desc: 'MacBook, PC Portable' },
    { to: '/products?category=Accessoires', icon: BsHeadphones, title: 'Accessoires', desc: 'Chargeurs, coques' },
  ];

  return (
    <motion.div initial="hidden" animate="show">
      <PromoPopup />

      <section className="avito-hero">
        <div className="container">
          <div className="avito-hero-content">
            <h1>Occasion & Garantie</h1>
            <p className="avito-hero-sub">Des milliers d'annonces. Achetez et vendez en toute confiance.</p>
            <form onSubmit={handleSearch} className="avito-search-bar">
              <div className="avito-search-input-wrap">
                <FiSearch size={18} className="avito-search-icon" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Que cherchez-vous ?" />
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
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="avito-categories">
            {categories.map((cat) => (
              <Link key={cat.title} to={cat.to} className="avito-cat-card">
                <div className="avito-cat-icon"><cat.icon size={28} /></div>
                <span>{cat.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <motion.section className="section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Dernieres annonces</h2>
              <p className="section-subtitle">{products.length} telephones disponibles a la vente</p>
            </div>
            <Link to="/products" className="btn btn-secondary">Voir tout <FiArrowRight size={16} /></Link>
          </div>
          {loading ? <SkeletonGrid count={8} /> : products.length > 0 ? (
            <div className="products-grid">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : (
            <div className="empty-state"><FiSmartphone size={48} /><p>Aucune annonce pour le moment.</p></div>
          )}
        </div>
      </motion.section>

      <TrustBar />

      <motion.section className="section sell-promo" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <div className="sell-promo-grid">
            <div className="sell-promo-content">
              <h2>Vous avez un telephone a vendre ?</h2>
              <p>Publiez votre annonce gratuitement et trouvez un acheteur rapidement. Zero commission.</p>
              <Link to="/vendre" className="btn btn-primary btn-lg">Vendre maintenant <FiArrowRight size={18} /></Link>
            </div>
            <div className="sell-promo-stats">
              <div className="stat-badge"><FiStar size={18} /> Gratuit</div>
              <div className="stat-badge"><FiShoppingBag size={18} /> Sans commission</div>
              <div className="stat-badge"><FiShield size={18} /> Paiement securise</div>
            </div>
          </div>
        </div>
      </motion.section>

      <NewsletterSection />
    </motion.div>
  );
}
