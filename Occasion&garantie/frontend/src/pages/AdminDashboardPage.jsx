import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCreditCard, FiClock, FiPackage, FiUsers, FiArrowLeft, FiTrendingUp, FiPlus } from 'react-icons/fi';
import api from '../api/axios';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ credits: 0, pendingCredits: 0, installments: 0, pendingInstallments: 0, products: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/credit-purchases').catch(() => ({ data: [] })),
      api.get('/admin/installments').catch(() => ({ data: [] })),
      api.get('/admin/products').catch(() => ({ data: [] })),
      api.get('/admin/users').catch(() => ({ data: [] })),
    ]).then(([credits, installments, products, users]) => {
      setStats({
        credits: credits.data.length,
        pendingCredits: credits.data.filter(c => c.status === 'en_attente').length,
        installments: installments.data.length,
        pendingInstallments: installments.data.filter(i => i.status === 'en_attente').length,
        products: products.data.length,
        users: users.data.length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const sections = [
    { title: 'Credits', icon: FiCreditCard, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', items: [
      { label: 'Total demandes', value: stats.credits },
      { label: 'En attente', value: stats.pendingCredits, highlight: true },
    ], link: '/admin/credits' },
    { title: 'Echelonnement', icon: FiClock, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', items: [
      { label: 'Total demandes', value: stats.installments },
      { label: 'En attente', value: stats.pendingInstallments, highlight: true },
    ], link: '/admin/installments' },
    { title: 'Produits', icon: FiPackage, color: '#059669', bg: 'rgba(5,150,105,0.1)', items: [
      { label: 'Total produits', value: stats.products },
    ], link: '/admin/products' },
    { title: 'Utilisateurs', icon: FiUsers, color: '#dc2626', bg: 'rgba(220,38,38,0.1)', items: [
      { label: 'Total utilisateurs', value: stats.users },
    ], link: '/admin/users' },
  ];

  if (loading) return <section className="admin-dashboard"><div className="container" style={{ padding: '60px 0' }}><div className="spinner" /></div></section>;

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> Retour au site</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Gerez toutes les operations en un coup d'oeil</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <Link key={section.title} to={section.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: section.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} color={section.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700 }}>{section.title}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {section.items.map(item => (
                      <div key={item.label} style={{ flex: 1, minWidth: 80 }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: item.highlight && item.value > 0 ? section.color : 'var(--text-primary)' }}>{item.value}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ marginTop: '32px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Actions rapides</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/admin/products/new" className="btn btn-primary"><FiPlus size={16} /> Nouveau produit</Link>
            <Link to="/admin/credits" className="btn btn-outline"><FiCreditCard size={16} /> Achats de credits</Link>
            <Link to="/admin/installments" className="btn btn-outline"><FiClock size={16} /> Paiements echelonnes</Link>
            <Link to="/admin/products" className="btn btn-outline"><FiPackage size={16} /> Tous les produits</Link>
            <Link to="/admin/users" className="btn btn-outline"><FiUsers size={16} /> Utilisateurs</Link>
          </div>
        </div>
      </div>
    </section>
  );
}