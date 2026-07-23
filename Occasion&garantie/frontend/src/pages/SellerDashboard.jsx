import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiTrendingUp, FiEye, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/seller/me'),
      api.get('/seller/me/products'),
    ]).then(([p, pr]) => {
      setProfile(p.data);
      setProducts(pr.data);
      setStoreName(p.data.store_name || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await api.put(`/products/${product.id}`, { ...product, active: !product.active });
      setProducts(products.map(p => p.id === product.id ? { ...p, active: !p.active } : p));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="seller-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Tableau de Bord</h1>
            <p className="text-secondary">Bienvenue, {user?.full_name || user?.fullName}</p>
          </div>
          <Link to="/seller/products/new" className="btn btn-primary">
            <FiPlus size={16} /> Nouveau produit
          </Link>
        </div>

        {/* Store info */}
        {storeName && (
          <div className="card dashboard-store-section">
            <h3><FiTrendingUp size={18} /> Boutique</h3>
            <p style={{ marginTop: 8 }}><strong>{storeName}</strong></p>
            <small className="text-secondary">Pour modifier le nom de votre boutique, contactez le support.</small>
          </div>
        )}

        {/* Stats */}
        {profile && (
          <div className="dashboard-stats">
            <div className="stat-card">
              <FiPackage size={20} />
              <span className="stat-value">{profile.stats?.total || 0}</span>
              <span className="stat-label">Total produits</span>
            </div>
            <div className="stat-card">
              <FiCheckCircle size={20} />
              <span className="stat-value">{profile.stats?.active_count || 0}</span>
              <span className="stat-label">Annonces actives</span>
            </div>
          </div>
        )}

        {/* Products */}
        <div className="dashboard-products">
          <h3>Mes annonces ({products.length})</h3>
          {products.length === 0 ? (
            <div className="empty-state">
              <FiPackage size={48} />
              <p>Vous n'avez aucune annonce. Créez votre premier produit !</p>
              <Link to="/seller/products/new" className="btn btn-primary">
                <FiPlus size={16} /> Publier une annonce
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Prix</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="product-cell">
                          {p.image && <img src={`/uploads/products/${p.image}`} alt="" className="product-thumb" />}
                          <div>
                            <strong>{p.name}</strong>
                            <small className="text-secondary">{p.category_name}</small>
                          </div>
                        </div>
                      </td>
                      <td>{p.price} DH</td>
                      <td>
                        <span className={`badge ${p.active ? 'badge-active' : 'badge-inactive'}`}>
                          {p.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon" onClick={() => handleToggleActive(p)} title={p.active ? 'Désactiver' : 'Activer'}>
                            {p.active ? <FiXCircle size={16} /> : <FiCheckCircle size={16} />}
                          </button>
                          <Link to={`/seller/products/edit/${p.id}`} className="btn-icon" title="Modifier">
                            <FiEdit2 size={16} />
                          </Link>
                          <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(p.id)} title="Supprimer">
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
