import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiArrowLeft, FiStar, FiShield, FiShoppingBag, FiDollarSign, FiEye } from 'react-icons/fi';
import api from '../api/axios';

const stateLabels = { neuf: 'Neuf', comme_neuf: 'Comme neuf', tres_bon: 'Très bon', bon: 'Bon', acceptable: 'Acceptable' };
const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';

export default function AdminStoreProducts() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total: 0, featured: 0, inStock: 0, sold: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [actionId, setActionId] = useState(null);

  const fetchProducts = (p, l) => {
    setLoading(true);
    api.get(`/admin/store-products?page=${p}&limit=${l}`)
      .then(res => { setProducts(res.data.products); setStats(res.data.stats); setTotal(res.data.total); setTotalPages(res.data.totalPages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(page, limit); }, [page, limit]);

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce produit ?')) return;
    setActionId(id);
    try {
      await api.delete(`/products/${id}`);
      fetchProducts(page, limit);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setActionId(null);
    }
  };

  const toggleFeatured = async (p) => {
    setActionId(p.id);
    try {
      await api.put(`/products/${p.id}`, { featured: !p.featured });
      fetchProducts(page, limit);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setActionId(null);
    }
  };

  const quickStatus = async (id, status) => {
    setActionId(id);
    try {
      await api.patch(`/products/${id}/status`, { status });
      fetchProducts(page, limit);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setActionId(null);
    }
  };

  const statusColors = { disponible: '#059669', en_attente: '#d97706', vendu: '#dc2626' };

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> Dashboard</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiShield style={{ color: '#d97706' }} /> Boutique Officielle
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>{total} produit{total > 1 ? 's' : ''} en boutique</p>
          </div>
          <Link to="/seller/products/new?type=store" className="btn" style={{ background: '#d97706', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiPlus size={18} /> Nouveau produit
          </Link>
        </div>

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', marginBottom: '28px' }}>
          {[
            { label: 'Total', value: stats.total, icon: FiPackage, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
            { label: 'En vedette', value: stats.featured, icon: FiStar, color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
            { label: 'En stock', value: stats.inStock, icon: FiShoppingBag, color: '#059669', bg: 'rgba(5,150,105,0.1)' },
            { label: 'Vendus', value: stats.sold, icon: FiDollarSign, color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={s.color} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{s.value}</div>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state"><FiPackage size={48} /><p>Aucun produit dans la boutique officielle.</p>
            <Link to="/seller/products/new?type=store" className="btn" style={{ marginTop: 12, background: '#d97706', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14 }}><FiPlus size={16} /> Ajouter un produit</Link>
          </div>
        ) : (
          <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px' }}>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Produit</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Prix</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Stock</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Statut</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Vedette</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={p.image || '/placeholder.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.brand} - {stateLabels[p.state] || p.state}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '8px 6px', fontWeight: 700 }}>{formatPrice(p.price)}</td>
                    <td style={{ padding: '8px 6px' }}>
                      <span style={{ color: p.stock > 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>{p.stock}</span>
                    </td>
                    <td style={{ padding: '8px 6px' }}>
                      <select value={p.status || 'disponible'} onChange={e => quickStatus(p.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: statusColors[p.status || 'disponible'] + '15', color: statusColors[p.status || 'disponible'], fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                        <option value="disponible">Disponible</option>
                        <option value="en_attente">En attente</option>
                        <option value="vendu">Vendu</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px 6px' }}>
                      <button onClick={() => toggleFeatured(p)} disabled={actionId === p.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.featured ? '#d97706' : 'var(--text-muted)', padding: 4 }}>
                        <FiStar size={18} fill={p.featured ? '#d97706' : 'transparent'} />
                      </button>
                    </td>
                    <td style={{ padding: '8px 6px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Link to={`/boutique/${p.slug}`} target="_blank" style={{ padding: 6, borderRadius: 6, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                          <FiEye size={14} />
                        </Link>
                        <Link to={`/seller/products/edit/${p.id}`} style={{ padding: 6, borderRadius: 6, background: 'rgba(5,150,105,0.1)', color: '#059669', display: 'flex', alignItems: 'center' }}>
                          <FiEdit2 size={14} />
                        </Link>
                        <button onClick={() => handleDelete(p.id)} disabled={actionId === p.id}
                          style={{ padding: 6, borderRadius: 6, background: 'rgba(220,38,38,0.1)', color: '#dc2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} produit{total > 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, fontSize: 13 }}>← Précedent</button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const start = Math.max(1, page - 5);
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: p === page ? 'none' : '1px solid var(--border)', background: p === page ? '#3b82f6' : 'var(--bg-card)', color: p === page ? '#fff' : 'var(--text)', cursor: 'pointer', fontWeight: p === page ? 700 : 400, fontSize: 13 }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, fontSize: 13 }}>Suivant →</button>
            </div>
          </div>
          </>
        )}
      </div>
    </section>
  );
}