import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSmartphone, FiShield, FiArrowRight, FiTrendingUp, FiShoppingBag, FiStar, FiSearch, FiMapPin, FiNavigation } from 'react-icons/fi';
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

const CITY_COORDS = {
  'Casablanca': [33.5731, -7.5898], 'Rabat': [34.0209, -6.8416], 'Marrakech': [31.6295, -7.9811],
  'Fes': [34.0333, -5.0000], 'Tanger': [35.7673, -5.7998], 'Agadir': [30.4278, -9.5981],
  'Meknes': [33.8935, -5.5473], 'Oujda': [34.6814, -1.9086], 'Kenitra': [34.2610, -6.5802],
  'Tetouan': [35.5782, -5.3684], 'Safi': [32.2994, -9.2372], 'El Jadida': [33.2318, -8.5008],
  'Beni Mellal': [32.3394, -6.3608], 'Nador': [35.1688, -2.9335], 'Taza': [34.2148, -4.0191],
  'Mohammedia': [33.6881, -7.3837], 'Laayoune': [27.1253, -13.1625], 'Khouribga': [32.8811, -6.9063],
  'Settat': [33.0010, -7.6167], 'Berrechid': [33.2656, -7.5875],
  'Bouskoura': [33.4497, -7.6484], 'Nouaceur': [33.3543, -7.6119], 'Mediouna': [33.4518, -7.5261],
  'Tit Mellil': [33.5628, -7.4874], 'Ain Harrouda': [33.6377, -7.4418],
};

function nearestCity(lat, lon) {
  let closest = 'Casablanca', minDist = Infinity;
  for (const [city, [clat, clon]] of Object.entries(CITY_COORDS)) {
    const d = (lat - clat) ** 2 + (lon - clon) ** 2;
    if (d < minDist) { minDist = d; closest = city; }
  }
  return closest;
}

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState(MOROCCAN_CITIES);
  const [userCity, setUserCity] = useState('');
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => { document.title = 'Occasion & Garantie - Achetez et vendez des produits électroniques d\'occasion au Maroc'; }, []);

  useEffect(() => {
    api.get('/products/cities').then(res => { if (res.data.length) setCities(res.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const city = nearestCity(pos.coords.latitude, pos.coords.longitude);
        setUserCity(city);
        setGeoLoading(false);
      }, () => setGeoLoading(false), { timeout: 8000 });
    } else {
      setGeoLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ sort: 'newest' });
    if (userCity) params.set('user_ville', userCity);
    api.get(`/products?${params}`).then(res => {
      setProducts(res.data.slice(0, 20));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userCity]);

  const handleSearch = (e) => {
    e.preventDefault();
    let url = '/products?';
    if (searchTerm.trim()) url += `search=${encodeURIComponent(searchTerm.trim())}&`;
    if (selectedCategory) url += `category=${selectedCategory}&`;
    if (selectedCity) url += `ville=${encodeURIComponent(selectedCity)}&`;
    navigate(url);
  };

  return (
    <motion.div initial="hidden" animate="show">
      <PromoPopup />

      <section className="avito-hero">
        <div className="container">
          <div className="avito-hero-content">
            <h1>Occasion & Garantie</h1>
            {userCity && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16, fontSize: 13, color: 'var(--text-primary)' }}>
                <FiNavigation size={14} /> Annonces proches de <strong>{userCity}</strong>
              </div>
            )}
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

      <motion.section className="section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">{userCity ? `A proximite de ${userCity}` : 'Dernieres annonces'}</h2>
              <p className="section-subtitle">{products.length} telephones disponibles a la vente{userCity ? ` pres de chez vous` : ''}</p>
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
