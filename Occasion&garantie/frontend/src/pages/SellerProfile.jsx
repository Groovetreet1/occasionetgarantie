import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiPackage, FiCalendar, FiArrowLeft } from 'react-icons/fi';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

export default function SellerProfile() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/seller/${id}`),
      api.get(`/seller/${id}/products`),
    ]).then(([s, p]) => {
      setSeller(s.data);
      setProducts(p.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-spinner" />;
  if (!seller) return <div className="container" style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-secondary)' }}><h2>Vendeur introuvable</h2></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="container seller-profile-page">
        <Link to="/products" className="back-link"><FiArrowLeft size={14} /> Retour aux produits</Link>

        <div className="seller-profile-card">
          <div className="seller-avatar">
            {seller.store_logo ? <img src={`/uploads/avatars/${seller.store_logo}`} alt="" /> : <FiUser size={40} />}
          </div>
          <div className="seller-info">
            <h1>{seller.store_name || seller.full_name}</h1>
            <p className="seller-meta">
              <FiCalendar size={14} /> Membre depuis {new Date(seller.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
            <p className="seller-meta">
              <FiPackage size={14} /> {seller.productCount} produit{seller.productCount > 1 ? 's' : ''} actif{seller.productCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <h2 className="section-title">Produits du vendeur</h2>
        {products.length === 0 ? (
          <div className="empty-state">
            <FiPackage size={48} />
            <p>Aucun produit disponible pour le moment.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </motion.div>
  );
}
