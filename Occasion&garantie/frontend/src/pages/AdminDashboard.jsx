import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiArrowLeft } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';
import api from '../api/axios';
import AnimatedBg from '../components/AnimatedBg';

const stateLabels = { neuf: 'Neuf', comme_neuf: 'Comme neuf', tres_bon: 'Très bon', bon: 'Bon', acceptable: 'Acceptable' };
const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/products')
      .then((res) => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer "${name}" ?`)) return;
    try {
      await api.delete(`/products/${id}`);
      load();
    } catch { alert('Erreur lors de la suppression.'); }
  };

  return (
    <section style={{ paddingTop: '100px', paddingBottom: '60px', position: 'relative' }}>
      <AnimatedBg />
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> Retour au site</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Dashboard Admin</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{products.length} produit{products.length > 1 ? 's' : ''}</p>
          </div>
          <Link to="/admin/products/new" className="btn btn-primary">
            <FiPlus size={18} /> Nouveau produit
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state"><div className="icon"><FiPackage size={48} /></div><p>Aucun produit.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Nom</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Prix</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Catégorie</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>État</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Stock</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>#{p.id}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {p.featured && <span style={{ background: 'var(--gradient)', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', marginRight: '6px', fontWeight: 700 }}>TOP</span>}
                      {p.name}
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--primary)', fontWeight: 700 }}>{formatPrice(p.price)}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{p.category_name || '-'}</td>
                    <td style={{ padding: '12px 8px' }}><span style={{ padding: '2px 10px', borderRadius: '10px', background: 'var(--primary-light)', fontSize: '12px' }}>{stateLabels[p.state] || p.state}</span></td>
                    <td style={{ padding: '12px 8px' }}>{p.stock > 0 ? <span style={{ color: 'var(--success)' }}>✓ {p.stock}</span> : <span style={{ color: 'var(--error)' }}>Rupture</span>}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link to={`/admin/products/edit/${p.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}><FiEdit2 size={14} /></Link>
                        <button onClick={() => handleDelete(p.id, p.name)} className="btn" style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: 'none' }}><FiTrash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
