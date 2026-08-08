import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiPackage, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import DeleteButton from '../components/DeleteButton';
import CircleIconButton from '../components/CircleIconButton';
import { useLanguage } from '../context/LanguageContext';
const stateLabels = { neuf: 'Neuf', comme_neuf: 'Comme neuf', tres_bon: 'Très bon', bon: 'Bon', acceptable: 'Acceptable' };
const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/products')
      .then((res) => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.delete(`/products/${id}`);
      load();
    } catch { alert(t('admin.deleteError')); }
  };

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> {t('admin.dashboardTitle')}</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>{t('admin.dashboardAdminTitle')}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{products.length} {products.length > 1 ? t('admin.productPlural') : t('admin.productSingular')}</p>
          </div>
          <Link to="/admin/products/new" className="btn btn-primary">
            <FiPlus size={18} /> {t('admin.newProduct')}
          </Link>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span><strong style={{ color: 'var(--text-primary)' }}>{t('admin.categoriesAvailable')}</strong> Smartphones, Tablettes, Ordinateurs, Accessoires, Gaming</span>
          <span><strong style={{ color: 'var(--text-primary)' }}>{t('admin.states')}</strong> Neuf, Comme neuf, Très bon état, Bon état</span>
          <span><strong style={{ color: 'var(--text-primary)' }}>{t('admin.tip')}</strong> {t('admin.tipFeaturedPrefix')} <strong style={{ color: 'var(--primary)' }}>{t('admin.featuredProduct')}</strong> {t('admin.tipFeaturedSuffix')}</span>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state"><div className="icon"><FiPackage size={48} /></div><p>{t('admin.noProducts')}</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thId')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thName')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thPrice')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thCategory')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thState')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thStock')}</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>{t('admin.thActions')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>#{p.id}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {!!p.featured && <span style={{ background: 'var(--gradient)', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', marginRight: '6px', fontWeight: 700 }}>TOP</span>}
                      {p.name}
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--primary)', fontWeight: 700 }}>{formatPrice(p.price)}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{p.category_name || '-'}</td>
                    <td style={{ padding: '12px 8px' }}><span style={{ padding: '2px 10px', borderRadius: '10px', background: 'var(--primary-light)', fontSize: '12px' }}>{stateLabels[p.state] || p.state}</span></td>
                    <td style={{ padding: '12px 8px' }}>{p.stock > 0 ? <span style={{ color: 'var(--success)' }}>✓ {p.stock}</span> : <span style={{ color: 'var(--error)' }}>{t('admin.outOfStock')}</span>}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link to={`/admin/products/edit/${p.id}`} title={t('admin.edit')} style={{ display: 'inline-flex' }}>
                          <CircleIconButton color="#059669" size="md" title={t('admin.edit')}><FiEdit2 size={14} /></CircleIconButton>
                        </Link>
                        <DeleteButton onClick={() => setDeleteTarget(p.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title={t('admin.deleteProductTitle')}
        message={t('admin.irreversible')}
        confirmText={t('admin.delete')}
        confirmColor="#dc2626"
        icon={<FiTrash2 size={26} color="#dc2626" />}
      />
    </section>
  );
}