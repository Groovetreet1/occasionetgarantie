import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSmartphone, FiHeadphones, FiTablet, FiShield, FiRefreshCw, FiTruck, FiArrowRight, FiTrendingUp, FiShoppingBag, FiStar, FiSearch, FiMonitor } from 'react-icons/fi';
import { BsPhone, BsLaptop, BsHeadphones } from 'react-icons/bs';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import TrustBar from '../components/TrustBar';
import TestimonialsSection from '../components/TestimonialsSection';
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

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?sort=newest').then(res => {
      setProducts(res.data.slice(0, 20));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const categories = [
    { to: '/products?category=Smartphones', icon: BsPhone, title: 'Smartphones', desc: 'iPhone, Samsung, Xiaomi', count: null },
    { to: '/products?category=Tablettes', icon: FiTablet, title: 'Tablettes', desc: 'iPad, Samsung Tab', count: null },
    { to: '/products?category=Ordinateurs', icon: BsLaptop, title: 'Ordinateurs', desc: 'MacBook, PC Portable', count: null },
    { to: '/products?category=Accessoires', icon: BsHeadphones, title: 'Accessoires', desc: 'Chargeurs, coques', count: null },
  ];

  return (
    <motion.div initial="hidden" animate="show">
      <PromoPopup />

      {/* Hero Search */}
      <section className="marketplace-hero">
        <div className="container">
          <motion.div className="marketplace-hero-content" variants={fadeUp}>
            <span className="hero-badge">Marketplace Officiel</span>
            <h1>Achetez et vendez des <span className="gradient-text">téléphones d'occasion</span> en toute confiance</h1>
            <p>Des milliers d'annonces vérifiées. Paiement sécurisé. Livraison rapide à Casablanca.</p>
            <form onSubmit={handleSearch} className="hero-search">
              <FiSearch size={18} />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher un téléphone, une marque..." />
              <button type="submit">Rechercher</button>
            </form>
            <div className="hero-ctas">
              <Link to="/products" className="btn btn-primary btn-lg">Parcourir les annonces <FiArrowRight size={18} /></Link>
              <Link to="/vendre" className="btn btn-outline btn-lg"><FiTrendingUp size={18} /> Vendre mon téléphone</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <motion.section className="section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <motion.div className="category-grid" variants={stagger}>
            {categories.map((cat) => (
              <motion.div key={cat.title} variants={fadeUp}>
                <Link to={cat.to} className="category-card">
                  <div className="cat-icon"><cat.icon /></div>
                  <h3>{cat.title}</h3>
                  <p>{cat.desc}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <TrustBar />

      {/* Latest products */}
      <motion.section className="section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Dernières annonces</h2>
              <p className="section-subtitle">{products.length} téléphones disponibles à la vente</p>
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

      {/* Sell CTA */}
      <motion.section className="section sell-promo" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <div className="sell-promo-grid">
            <div className="sell-promo-content">
              <h2>Vous avez un téléphone à vendre ?</h2>
              <p>Publiez votre annonce gratuitement et trouvez un acheteur rapidement. Zero commission.</p>
              <Link to="/vendre" className="btn btn-primary btn-lg">Vendre maintenant <FiArrowRight size={18} /></Link>
            </div>
            <div className="sell-promo-stats">
              <div className="stat-badge"><FiStar size={18} /> Gratuit</div>
              <div className="stat-badge"><FiShoppingBag size={18} /> Sans commission</div>
              <div className="stat-badge"><FiShield size={18} /> Paiement sécurisé</div>
            </div>
          </div>
        </div>
      </motion.section>

      <TestimonialsSection />
      <NewsletterSection />
    </motion.div>
  );
}
