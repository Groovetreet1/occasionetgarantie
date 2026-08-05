import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCreditCard, FiClock, FiPackage, FiUsers, FiArrowLeft, FiTrendingUp, FiPlus, FiHeadphones, FiShield, FiMonitor, FiSmartphone, FiUserCheck } from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

function CardWrapper({ link, children, ...rest }) {
  return link ? <Link to={link} {...rest}>{children}</Link> : <div {...rest}>{children}</div>;
}

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ credits: 0, pendingCredits: 0, premium: 0, pendingPremium: 0, products: 0, vendorProducts: 0, tickets: 0, pendingTickets: 0, repliedTickets: 0, users: 0, pendingReprises: 0, pendingProducts: 0, storeProducts: 0, storeContacts: 0 });
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
    ]).then(([credits, premium, products, tickets, users, reprises, pendingProds, store, contacts]) => {
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
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const sections = [
    { title: t('admin.creditPurchases'), icon: FiCreditCard, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', items: [
      { label: t('admin.totalRequests'), value: stats.credits },
      { label: t('admin.pending'), value: stats.pendingCredits, highlight: true },
    ], link: '/admin/credits' },

    { title: t('admin.premiumRequests'), icon: FiShield, color: '#ec4899', bg: 'rgba(236,72,153,0.1)', items: [
      { label: t('admin.totalRequests'), value: stats.premium },
      { label: t('admin.pending'), value: stats.pendingPremium, highlight: true },
    ], link: '/admin/premium' },
    { title: t('admin.products'), icon: FiPackage, color: '#059669', bg: 'rgba(5,150,105,0.1)', items: [
      { label: t('admin.totalProducts'), value: stats.products },
      { label: t('admin.vendorProducts'), value: stats.vendorProducts, highlight: true },
      { label: t('admin.pending'), value: stats.pendingProducts, highlight: stats.pendingProducts > 0 },
    ], link: '/admin/products/pending' },
    { title: t('admin.officialStore'), icon: FiShield, color: '#d97706', bg: 'rgba(217,119,6,0.1)', items: [
      { label: t('admin.storeProducts'), value: stats.storeProducts },
      { label: t('admin.storeRequests'), value: stats.storeContacts, highlight: stats.storeContacts > 0 },
    ], link: '/admin/store-products' },
    { title: t('admin.ticketsSupport'), icon: FiHeadphones, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', items: [
      { label: t('admin.total'), value: stats.tickets },
      { label: t('admin.pending'), value: stats.pendingTickets, highlight: true },
      { label: t('admin.replied'), value: stats.repliedTickets },
    ], link: '/admin/tickets' },
    { title: t('admin.reprises'), icon: FiSmartphone, color: '#10b981', bg: 'rgba(16,185,129,0.1)', items: [
      { label: t('admin.pending'), value: stats.pendingReprises ?? '...' },
    ], link: '/reprise/list' },
    { title: t('admin.vendorAccounts'), icon: FiUserCheck, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', items: [
      { label: t('admin.manageAccounts'), value: t('admin.createDelete') },
    ], link: '/admin/managed-vendors' },
    { title: t('admin.vendorJournal'), icon: FiMonitor, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', items: [
      { label: t('admin.activity'), value: t('admin.ipIspUa') },
    ], link: '/admin/vendor-logs' },
    { title: t('admin.users'), icon: FiUsers, color: '#dc2626', bg: 'rgba(220,38,38,0.1)', items: [
      { label: t('admin.totalUsers'), value: stats.users },
    ], link: '/admin/users' },
  ];

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

        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <CardWrapper key={section.title} link={section.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: section.link ? 'pointer' : 'default',
                }}
                  onMouseEnter={e => { if (section.link) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; } }}
                  onMouseLeave={e => { if (section.link) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; } }}>
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
              </CardWrapper>
            );
          })}
        </div>

        <div style={{ marginTop: '32px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
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
