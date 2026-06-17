import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FiShield, FiRefreshCw, FiTruck, FiArrowRight, FiSmartphone, FiHeadphones } from 'react-icons/fi';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import AnimatedBg from '../components/AnimatedBg';
import HeroSlider from '../components/HeroSlider';

export default function Home() {
  const [phones, setPhones] = useState([]);
  const [accessories, setAccessories] = useState([]);

  useEffect(() => {
    api.get('/products?category=smartphones')
      .then((res) => setPhones(res.data))
      .catch(() => {});
    api.get('/products?category=accessoires')
      .then((res) => setAccessories(res.data))
      .catch(() => {});
  }, []);

  return (
    <>
      <AnimatedBg />
      <HeroSlider />

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
              <h2 className="section-title"><FiSmartphone size={28} style={{ verticalAlign: 'middle', marginRight: 10 }} />Smartphones</h2>
              <p className="section-subtitle" style={{ marginBottom: 0 }}>Nos téléphones reconditionnés, testés et garantis.</p>
            </div>
            <Link to="/products?category=smartphones" className="btn btn-secondary">
              Voir tout <FiArrowRight size={16} />
            </Link>
          </div>
          {phones.length > 0 ? (
            <div className="products-grid">
              {phones.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon"><FiSmartphone size={48} /></div>
              <p>Aucun téléphone disponible pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      <div className="section-divider">
        <div className="divider-line" />
        <div className="divider-content">
          <FiHeadphones size={20} />
          <span>Accessoires &amp; Protections</span>
          <FiHeadphones size={20} />
        </div>
        <div className="divider-line" />
      </div>

      <section className="products-section products-section-accessories">
        <div className="container">
          <div className="products-header">
            <div>
              <h2 className="section-title">Accessoires</h2>
              <p className="section-subtitle" style={{ marginBottom: 0 }}>Chargeurs, coques, kits Bluetooth et protections.</p>
            </div>
            <Link to="/products?category=accessoires" className="btn btn-secondary">
              Voir tout <FiArrowRight size={16} />
            </Link>
          </div>
          {accessories.length > 0 ? (
            <div className="products-grid">
              {accessories.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon"><FiHeadphones size={48} /></div>
              <p>Aucun accessoire disponible pour le moment.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
