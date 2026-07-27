import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiPackage, FiCheck, FiX } from 'react-icons/fi';
import api from '../api/axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminPendingProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/products/pending').then(res => setProducts(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    try {
      await api.put(`/admin/products/${id}/approve`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  const approveAll = async () => {
    try {
      const res = await api.post('/admin/products/approve-existing');
      alert(res.data.message);
      load();
    } catch {}
  };

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: 8 }}><FiArrowLeft /> Dashboard</Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiPackage size={28} style={{ color: 'var(--primary)' }} /> Produits en attente
          </h1>
          <button onClick={approveAll} className="btn btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>
            <FiCheck size={14} /> Approuver tous les anciens
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <FiPackage size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>Aucun produit en attente d'approbation.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {products.map(p => (
              <div key={p.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {p.image && (
                  <img src={p.image.startsWith('http') ? p.image : `${API_BASE}/uploads/${p.image}`} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {p.store_name || p.seller_name} | {p.price} DH | {new Date(p.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => approve(p.id)} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                    <FiCheck size={13} /> Approuver
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
