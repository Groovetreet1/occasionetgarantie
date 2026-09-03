import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useLanguage } from '../context/LanguageContext';

export default function AdminDashboardCharts({ stats }) {
  const { t } = useLanguage();
  if (!stats) return null;
  const { users, products, sales } = stats;

  // 3D-like pie with shadow and depth via echarts graphic
  const pie3D = (data, colors) => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11, color: '#64748b' } },
    series: [{
      type: 'pie',
      radius: ['42%', '72%'],
      center: ['50%', '46%'],
      roseType: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2,
        shadowBlur: 18,
        shadowColor: 'rgba(0,0,0,0.12)',
        shadowOffsetY: 6
      },
      label: { show: false },
      labelLine: { show: false },
      emphasis: { scale: true, scaleSize: 8, itemStyle: { shadowBlur: 22 } },
      data: data.map((d,i) => ({
        ...d,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0,0,0,1, [
            { offset: 0, color: colors[i] },
            { offset: 1, color: colors[i]+'CC' }
          ]),
          shadowColor: colors[i]+'66',
          shadowBlur: 14
        }
      })),
      animationType: 'scale',
      animationEasing: 'elasticOut',
      animationDelay: idx => idx * 120
    }]
  });

  const roleData = [
    { value: users.byRole.client, name: t('admin.chartClients') },
    { value: users.byRole.seller, name: t('admin.chartSellers') },
    { value: users.byRole.admin, name: t('admin.chartAdmins') }
  ];
  const premiumData = [
    { value: users.byPremium.premium, name: t('admin.chartPremiumLabel') },
    { value: users.byPremium.nonPremium, name: t('admin.chartNonPremium') }
  ];
  const statusData = [
    { value: users.byStatus.actif, name: t('admin.chartActive') },
    { value: users.byStatus.suspended, name: t('admin.chartSuspended') }
  ];

  const bar3D = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 12, right: 12, top: 12, bottom: 28, containLabel: true },
    xAxis: {
      type: 'category',
      data: sales.monthly.map(m=>m.month),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    series: [
      {
        name: 'Commandes',
        type: 'bar',
        barWidth: 14,
        data: sales.monthly.map(m=>m.orders),
        itemStyle: {
          borderRadius: [8,8,0,0],
          color: new echarts.graphic.LinearGradient(0,0,0,1, [
            { offset: 0, color: '#38bdf8' },
            { offset: 1, color: '#0284c7' }
          ]),
          shadowColor: 'rgba(56,189,248,0.45)',
          shadowBlur: 12,
          shadowOffsetY: 4
        },
        emphasis: { itemStyle: { shadowBlur: 18 } },
        animationDelay: i=> i*80
      },
      {
        name: 'Revenu (DH)',
        type: 'bar',
        barWidth: 14,
        data: sales.monthly.map(m=>m.revenue),
        yAxisIndex: 0,
        itemStyle: {
          borderRadius: [8,8,0,0],
          color: new echarts.graphic.LinearGradient(0,0,0,1, [
            { offset: 0, color: '#fbbf24' },
            { offset: 1, color: '#d97706' }
          ]),
          shadowColor: 'rgba(245,158,11,0.45)',
          shadowBlur: 12,
          shadowOffsetY: 4
        },
        animationDelay: i=> i*80+120
      }
    ]
  };

  const monthlyUsersOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 12, right: 12, top: 12, bottom: 28, containLabel: true },
    xAxis: { type: 'category', data: users.monthly.map(m=>m.month), axisTick:{show:false}, axisLine:{lineStyle:{color:'#e2e8f0'}}, axisLabel:{color:'#64748b', fontSize:11} },
    yAxis: { type: 'value', splitLine:{lineStyle:{color:'#f1f5f9', type:'dashed'}}, axisLabel:{color:'#94a3b8', fontSize:11} },
    series: [{
      data: users.monthly.map(m=>m.count),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 3, color: '#10b981', shadowColor: 'rgba(16,185,129,0.35)', shadowBlur: 10 },
      itemStyle: { color: '#10b981', borderColor: '#fff', borderWidth: 2, shadowBlur: 8 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0,0,0,1, [
          { offset: 0, color: 'rgba(16,185,129,0.22)' },
          { offset: 1, color: 'rgba(16,185,129,0)' }
        ])
      },
      animationDelay: i=>i*90
    }]
  };

  const cardStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px',
    padding: '18px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden'
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div style={cardStyle} className="admin-chart-card">
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'radial-gradient(circle, rgba(56,189,248,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: 0.4, textTransform: 'uppercase' }}>{t('admin.chartClientsVsSellers')}</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{t('admin.chartTotalUsers', { count: users.total })}</p>
          <ReactECharts option={pie3D(roleData, ['#38bdf8','#f59e0b','#94a3b8'])} style={{ height: 220 }} opts={{ renderer: 'canvas' }} className="admin-chart-3d" />
        </div>

        <div style={cardStyle} className="admin-chart-card">
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'radial-gradient(circle, rgba(245,158,11,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: 0.4, textTransform: 'uppercase' }}>{t('admin.chartPremium')}</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{t('admin.chartPremiumSub', { premium: users.byPremium.premium, nonPremium: users.byPremium.nonPremium })}</p>
          <ReactECharts option={pie3D(premiumData, ['#f59e0b','#0ea5e9'])} style={{ height: 220 }} className="admin-chart-3d" />
        </div>

        <div style={cardStyle} className="admin-chart-card">
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: 0.4, textTransform: 'uppercase' }}>{t('admin.chartStatus')}</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{t('admin.chartStatusSub', { actif: users.byStatus.actif, suspended: users.byStatus.suspended })}</p>
          <ReactECharts option={pie3D(statusData, ['#10b981','#ef4444'])} style={{ height: 220 }} className="admin-chart-3d" />
        </div>
      </div>

      <div className="admin-charts-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={cardStyle} className="admin-chart-card admin-chart-large">
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: 0.4, textTransform: 'uppercase' }}>{t('admin.chartSales')}</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{t('admin.chartSalesSub', { orders: sales.totalOrders, revenue: sales.totalRevenue.toLocaleString() })}</p>
          <ReactECharts option={bar3D} style={{ height: 260 }} className="admin-chart-3d" />
        </div>

        <div style={cardStyle} className="admin-chart-card admin-chart-large">
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: 0.4, textTransform: 'uppercase' }}>{t('admin.chartGrowth')}</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{t('admin.chartGrowthSub', { total: users.total, max: Math.max(...users.monthly.map(m=>m.count)) })}</p>
          <ReactECharts option={monthlyUsersOpt} style={{ height: 260 }} className="admin-chart-3d" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...cardStyle, display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', padding: '16px 18px' }}>
        <div style={{ flex: '1 1 200px', background: 'var(--bg-secondary)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Produits</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{products.total} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>total</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{products.approved} approuvés • {products.pending} en attente • {products.vendu} vendus</div>
        </div>
        <div style={{ flex: '1 1 200px', background: 'var(--bg-secondary)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Boutique Officielle</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{products.store} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>produits</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{products.vendor} vendeur • {products.vendu} vendus</div>
        </div>
        <div style={{ flex: '1 1 160px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 12, padding: '14px 16px', color: '#fff' }}>
          <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vérification</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{users.byVerified.verified} vérifiés</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{users.byVerified.unverified} non vérifiés</div>
        </div>
        </div>
      </div>
    </>
  );
}
