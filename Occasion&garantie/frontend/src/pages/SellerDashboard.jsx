import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiCheckCircle, FiPercent, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SellerNav from '../components/SellerNav';

const statusColors = {
  disponible: '#059669',
  en_attente: '#d97706',
  vendu: '#dc2626',
};

export default function SellerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('');
  const [commissions, setCommissions] = useState({ commissions: [], summary: { total_commission: 0, count: 0 } });
  const [creditBalance, setCreditBalance] = useState(0);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [buyAmount, setBuyAmount] = useState(100);
  const [buyLoading, setBuyLoading] = useState(false);
  useEffect(() => {
    Promise.all([
      api.get('/seller/me'),
      api.get('/seller/me/products'),
      api.get('/seller/me/commissions'),
      api.get('/auth/my-credits'),
    ]).then(([p, pr, c, cr]) => {
      setProfile(p.data);
      setProducts(pr.data);
      setStoreName(p.data.store_name || '');
      setCommissions(c.data);
      setCreditBalance(cr.data.credit_balance);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleBuyCredits = async () => {
    setBuyLoading(true);
    try {
      const { data } = await api.post('/auth/buy-credits', { amount: buyAmount });
      setCreditBalance(data.credit_balance);
      setShowBuyCredits(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setBuyLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const cycleStatus = async (product) => {
    const order = ['disponible', 'en_attente', 'vendu'];
    const currentIdx = order.indexOf(product.status || 'disponible');
    const nextStatus = order[(currentIdx + 1) % order.length];
    try {
      await api.patch(`/products/${product.id}/status`, { status: nextStatus });
      setProducts(products.map(p => p.id === product.id ? { ...p, status: nextStatus } : p));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="seller-page">
      <div className="seller-page-header">
        <div>
          <h1>Tableau de Bord</h1>
          <p className="text-secondary">{user?.full_name || user?.fullName}</p>
        </div>
        <Link to="/seller/products/new" className="btn btn-primary">
          <FiPlus size={16} /> Nouveau produit
        </Link>
      </div>

      <SellerNav />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="seller-page-content">
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
            <div className="stat-card">
              <FiPercent size={20} />
              <span className="stat-value">{commissions.summary.total_commission} DH</span>
              <span className="stat-label">Commission ({commissions.summary.count} ventes)</span>
            </div>
          </div>
          )}
          {profile.created_at && new Date(profile.created_at).getTime() + 3 * 30 * 24 * 60 * 60 * 1000 > Date.now() && (
            <div style={{ fontSize: 13, color: 'var(--primary)', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginTop: 12 }}>
              <FiCheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Periode gratuite — 0% deduction pendant vos 3 premiers mois !
            </div>
          )}

          <div className="seller-credits-box" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Solde credits</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>{creditBalance} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-secondary)' }}>crédits</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>1 credit = 0.10 DH — 5% du prix déduit par annonce</div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowBuyCredits(true)} style={{ whiteSpace: 'nowrap' }}>
              <FiCreditCard size={16} /> Acheter des credits
            </button>
          </div>

          {showBuyCredits && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowBuyCredits(false)}>
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>Acheter des credits</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>1000 credits = 100 DH. Le credit est deduit automatiquement (5% du prix) a chaque creation d'annonce apres la periode gratuite de 3 mois.</p>
                <div className="form-group">
                  <label>Montant (DH)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[50, 100, 200, 500].map(a => (
                      <button key={a} type="button" onClick={() => setBuyAmount(a)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', border: buyAmount === a ? '2px solid var(--primary)' : '1px solid var(--border)', background: buyAmount === a ? 'var(--bg-secondary)' : 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: buyAmount === a ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {a} DH
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vous recevrez</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{buyAmount * 10} credits</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowBuyCredits(false)} style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
                  <button className="form-submit" onClick={handleBuyCredits} disabled={buyLoading} style={{ flex: 1, justifyContent: 'center' }}>
                    <FiDollarSign size={16} /> {buyLoading ? '...' : `Payer ${buyAmount} DH`}
                  </button>
                </div>
              </div>
            </div>
          )}
        )}

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
                          {p.image && <img src={`/uploads/${p.image}`} alt="" className="product-thumb" />}
                          <div>
                            <strong>{p.name}</strong>
                            <small className="text-secondary">{p.category_name}</small>
                          </div>
                        </div>
                      </td>
                      <td>{p.price} DH</td>
                      <td>
                        <button className="status-toggle" onClick={() => cycleStatus(p)}
                          style={{ background: statusColors[p.status || 'disponible'] }}>
                          {p.status === 'disponible' ? 'Disponible' : p.status === 'en_attente' ? 'En attente' : 'Vendu'}
                        </button>
                      </td>
                      <td>
                        <div className="action-btns">
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
      </motion.div>
    </div>
  );
}
