import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCreditCard, FiPackage, FiUsers, FiArrowLeft, FiHeadphones, FiShield } from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import AdminDashboardCharts from '../components/AdminDashboardCharts';

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ credits: 0, pendingCredits: 0, premium: 0, pendingPremium: 0, products: 0, vendorProducts: 0, tickets: 0, pendingTickets: 0, repliedTickets: 0, users: 0, pendingReprises: 0, pendingProducts: 0, storeProducts: 0, storeContacts: 0 });
  const [chartStats, setChartStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/credit-purchases').catch(() => ({ data: [] })),

      api.get('/admin/premium-payments').catch(() => ({ data: [] })),
      api.get('/admin/products').catch(() => ({ data: [] })),
      api.get('/contact/tickets').catch(() => ({ data: [] })),
      api.get('/admin/users').catch(() => ({ data: [] })),
      api.get('/reprises').catch(() => ({ data: [] })),
      api.get('/admin/products/pending').catch(() => ({ data: [] })),
      api.get('/admin/store-products?limit=1').catch(() => ({ data: { stats: { total: 0 } } })),
      api.get('/admin/store-contacts?limit=1').catch(() => ({ data: { total: 0 } })),
      api.get('/admin/dashboard-stats').catch(() => ({ data: null })),
    ]).then(([credits, premium, products, tickets, users, reprises, pendingProds, store, contacts, dash]) => {
      const ticketData = tickets.data || [];
      const repriseData = reprises.data || [];
      const storeData = store.data?.stats || {};
      const contactsData = contacts.data || {};
      setStats({
        credits: credits.data.length,
        pendingCredits: credits.data.filter(c => c.status === 'en_attente').length,

        premium: premium.data.length,
        pendingPremium: premium.data.filter(p => p.status === 'en_attente').length,
        products: products.data.length,
        vendorProducts: products.data.filter(p => p.seller_id || p.user_id).length,
        tickets: ticketData.length,
        pendingTickets: ticketData.filter(t => !t.replied_at).length,
        repliedTickets: ticketData.filter(t => t.replied_at).length,
        users: users.data.length,
        pendingReprises: repriseData.filter(r => r.status === 'en_attente').length,
        pendingProducts: pendingProds.data.length,
        storeProducts: storeData.total || 0,
        storeContacts: contactsData.total || 0,
      });
      if (dash?.data) setChartStats(dash.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <section className="admin-dashboard"><div className="container" style={{ padding: '60px 0' }}><div className="spinner" /></div></section>;

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> {t('admin.backToSite')}</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>{t('admin.dashboardTitle')}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{t('admin.dashboardSubtitle')}</p>
          </div>
        </div>

        {chartStats && <AdminDashboardCharts stats={chartStats} />}

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: '32px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{t('admin.pending')}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stats.pendingProducts > 0 ? '#059669' : 'var(--text-primary)' }}>{stats.pendingProducts}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('admin.approveProducts')}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{t('admin.pending')}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stats.pendingCredits > 0 ? '#3b82f6' : 'var(--text-primary)' }}>{stats.pendingCredits}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('admin.creditPurchases')}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{t('admin.pending')}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stats.pendingPremium > 0 ? '#ec4899' : 'var(--text-primary)' }}>{stats.pendingPremium}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('admin.premiumRequests')}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{t('admin.pending')}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stats.pendingTickets > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{stats.pendingTickets}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('admin.ticketsSupport')}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{t('admin.pending')}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stats.pendingReprises > 0 ? '#10b981' : 'var(--text-primary)' }}>{stats.pendingReprises ?? '...'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('admin.reprises')}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{t('admin.totalUsers')}</div>
            <div style={{ fontSize: '28px', fontWeight: 800 }}>{stats.users}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('admin.users')}</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>{t('admin.quickActions')}</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/admin/credits" className="btn btn-outline"><FiCreditCard size={16} /> {t('admin.creditPurchases')}</Link>

            <Link to="/admin/premium" className="btn btn-outline"><FiShield size={16} /> {t('admin.premiumRequests')}</Link>
            <Link to="/admin/products" className="btn btn-outline"><FiPackage size={16} /> {t('admin.allProducts')}</Link>
            <Link to="/admin/products/pending" className="btn btn-outline"><FiShield size={16} /> {t('admin.approveProducts')}</Link>
            <Link to="/admin/store-products" className="btn btn-outline" style={{ borderColor: '#d97706', color: '#d97706' }}><FiShield size={16} /> {t('admin.officialStore')}</Link>
            <Link to="/admin/users" className="btn btn-outline"><FiUsers size={16} /> {t('admin.users')}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
