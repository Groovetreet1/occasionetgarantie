import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FiShield, FiRefreshCw, FiTruck, FiArrowRight } from 'react-icons/fi';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import AnimatedBg from '../components/AnimatedBg';
import HeroSlider from '../components/HeroSlider';
import AboutSlider from '../components/AboutSlider';

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/products/featured')
      .then((res) => setProducts(res.data))
      .catch(() => {});
  }, []);

  return (
    <>
      <AnimatedBg />
      <HeroSlider />
      <AboutSlider />

      <section className="features">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="section-title">Pourquoi nous choisir ?</h2>
            <p className="section-subtitle">La qualité au meilleur prix, c&rsquo;est notre promesse.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><FiShield size={24} /></div>
              <h3>Garantie incluse</h3>
              <p>Chaque produit est couvert par une garantie minimum de 15 jours pour votre tranquillité.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FiRefreshCw size={24} /></div>
              <h3>Testé et vérifié</h3>
              <p>Nos experts vérifient chaque article avant mise en vente. Qualité irréprochable.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FiTruck size={24} /></div>
              <h3>Livraison rapide</h3>
              <p>Après la confirmation, Expédition sur Casablanca Gratuit sous 24h. Suivi de commande en temps réel et retour facile.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="products-section">
        <div className="container">
          <div className="products-header">
            <div>
              <h2 className="section-title">Produits à la une</h2>
              <p className="section-subtitle" style={{ marginBottom: 0 }}>Nos meilleures offres du moment.</p>
            </div>
            <Link to="/products" className="btn btn-secondary">
              Voir tout <FiArrowRight size={16} />
            </Link>
          </div>
          {products.length > 0 ? (
            <div className="products-grid">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon"><FiShield size={48} /></div>
              <p>Aucun produit à la une pour le moment. Revenez bientôt !</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
