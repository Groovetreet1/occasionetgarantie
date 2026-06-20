import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiArrowLeft } from 'react-icons/fi';
import api from '../api/axios';
const stateLabels = { neuf: 'Neuf', comme_neuf: 'Comme neuf', tres_bon: 'Très bon', bon: 'Bon', acceptable: 'Acceptable' };
const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';

export default function AdminDashboard() {
  const { t } = useTranslation();
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
    if (!window.confirm(`${t('Supprimer')} "${name}" ?`)) return;
    try {
      await api.delete(`/products/${id}`);
      load();
    } catch { alert(t('Erreur lors de la suppression.')); }
  };

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> {t('Retour au site')}</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>{t('Dashboard Admin')}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{products.length} {products.length > 1 ? t('produits') : t('produit')}</p>
          </div>
          <Link to="/admin/products/new" className="btn btn-primary">
            <FiPlus size={18} /> {t('Nouveau produit')}
          </Link>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span><strong style={{ color: 'var(--text-primary)' }}>{t('Catégories disponibles :')}</strong> Smartphones, Tablettes, Ordinateurs, Accessoires, Gaming</span>
          <span><strong style={{ color: 'var(--text-primary)' }}>{t('États :')}</strong> {t('Neuf')}, {t('Comme neuf')}, {t('Très bon état')}, {t('Bon état')}</span>
          <span><strong style={{ color: 'var(--text-primary)' }}>{t('Astuce :')}</strong> {t('Cochez')} <strong style={{ color: 'var(--primary)' }}>{t('Produit à la une')}</strong> {t('pour mettre un produit en avant')}</span>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state"><div className="icon"><FiPackage size={48} /></div><p>{t('Aucun produit. Cliquez sur "Nouveau produit" pour commencer.')}</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('Nom')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('Prix')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('Catégorie')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('État')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('Stock')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('Actions')}</th>
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
                    <td style={{ padding: '12px 8px' }}><span style={{ padding: '2px 10px', borderRadius: '10px', background: 'var(--primary-light)', fontSize: '12px' }}>{t(stateLabels[p.state]) || p.state}</span></td>
                    <td style={{ padding: '12px 8px' }}>{p.stock > 0 ? <span style={{ color: 'var(--success)' }}>✓ {p.stock}</span> : <span style={{ color: 'var(--error)' }}>{t('Rupture')}</span>}</td>
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
