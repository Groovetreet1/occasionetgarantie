import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiRefreshCw, FiTruck, FiArrowRight, FiSmartphone, FiHeadphones, FiTablet } from 'react-icons/fi';
import { BsPhone, BsLaptop, BsHeadphones } from 'react-icons/bs';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import PromoPopup from '../components/PromoPopup';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

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
    <motion.div initial="hidden" animate="show">
      <HeroSlider />
      <PromoPopup />

      <motion.section variants={fadeUp} className="container">
        <motion.div className="category-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {[
            { to: '/products?category=Smartphones', icon: BsPhone, title: 'Smartphones', desc: 'iPhone, Samsung, Xiaomi' },
            { to: '/products?category=Tablettes', icon: FiTablet, title: 'Tablettes', desc: 'iPad, Samsung Tab' },
            { to: '/products?category=Ordinateurs', icon: BsLaptop, title: 'Ordinateurs', desc: 'MacBook, PC Portable' },
            { to: '/products?category=Accessoires', icon: BsHeadphones, title: 'Accessoires', desc: 'Chargeurs, coques, etc.' },
          ].map((cat, i) => (
            <motion.div key={cat.title} variants={fadeUp}>
              <Link to={cat.to} className="category-card">
                <div>
                  <div className="cat-icon"><cat.icon /></div>
                  <h3>{cat.title}</h3>
                  <p>{cat.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section className="products-section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
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
              {phones.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon"><FiSmartphone size={48} /></div>
              <p>Aucun téléphone disponible pour le moment.</p>
            </div>
          )}
        </div>
      </motion.section>

      <div className="section-divider">
        <div className="divider-line" />
        <div className="divider-content">
          <FiHeadphones size={20} />
          <span>Accessoires &amp; Protections</span>
          <FiHeadphones size={20} />
        </div>
        <div className="divider-line" />
      </div>

      <motion.section className="products-section products-section-accessories" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
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
              {accessories.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon"><FiHeadphones size={48} /></div>
              <p>Aucun accessoire disponible pour le moment.</p>
            </div>
          )}
        </div>
      </motion.section>

      <motion.section className="features" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="section-title">Pourquoi nous choisir ?</h2>
            <p className="section-subtitle">La qualité au meilleur prix, c'est notre promesse.</p>
          </div>
          <motion.div className="features-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {[
              { icon: FiShield, title: 'Garantie incluse', desc: 'Chaque produit est couvert par une garantie minimum de 15 jours pour votre tranquilité.' },
              { icon: FiRefreshCw, title: 'Testé et vérifié', desc: 'Nos experts vérifient chaque article avant mise en vente. Qualité irréprochable.' },
              { icon: FiTruck, title: 'Livraison rapide', desc: 'Après la confirmation, Expédition sur Casablanca Gratuit sous 24h. Suivi de commande en temps réel et retour facile.' },
            ].map((feat, i) => (
              <motion.div key={feat.title} className="feature-card" variants={fadeUp}>
                <div className="feature-icon"><feat.icon size={24} /></div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  );
}
