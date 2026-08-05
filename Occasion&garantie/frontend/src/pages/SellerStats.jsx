import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiTrendingUp, FiClock, FiCheckCircle, FiDownload } from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import SellerNav from '../components/SellerNav';

const statusColors = { disponible: '#059669', en_attente: '#d97706', vendu: '#dc2626' };

export default function SellerStats() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const statsRef = useRef(null);

  const statusLabels = { disponible: t('seller.available'), en_attente: t('seller.pending'), vendu: t('seller.sold') };

  useEffect(() => {
    api.get('/seller/me/products').then(res => {
      setProducts(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: products.length,
    disponible: products.filter(p => p.status === 'disponible').length,
    en_attente: products.filter(p => p.status === 'en_attente').length,
    vendu: products.filter(p => p.status === 'vendu').length,
  };

  const totalRevenue = products
    .filter(p => p.status === 'vendu')
    .reduce((sum, p) => sum + Number(p.price), 0);

  const handlePrint = () => window.print();

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="seller-page">
      <div className="seller-page-header">
        <h1>{t('seller.statsTitle')}</h1>
        <button className="btn btn-outline" onClick={handlePrint}>
          <FiDownload size={16} /> {t('seller.exportPdf')}
        </button>
      </div>

      <SellerNav />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="seller-page-content" ref={statsRef}>
          <div className="stats-report">
            <div className="stats-overview">
              <div className="stat-card large" style={{ borderTop: '3px solid var(--primary)' }}>
                <FiPackage size={24} />
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">{t('seller.totalAds')}</span>
              </div>
              <div className="stat-card large" style={{ borderTop: '3px solid #059669' }}>
                <FiCheckCircle size={24} />
                <span className="stat-value">{stats.disponible}</span>
                <span className="stat-label">{t('seller.statsAvailable')}</span>
              </div>
              <div className="stat-card large" style={{ borderTop: '3px solid #d97706' }}>
                <FiClock size={24} />
                <span className="stat-value">{stats.en_attente}</span>
                <span className="stat-label">{t('seller.statsPending')}</span>
              </div>
              <div className="stat-card large" style={{ borderTop: '3px solid #dc2626' }}>
                <FiTrendingUp size={24} />
                <span className="stat-value">{stats.vendu}</span>
                <span className="stat-label">{t('seller.statsSold')}</span>
              </div>
            </div>

            <div className="stats-chart-section">
              <div className="stats-revenue-card">
                <h3>{t('seller.totalRevenue')}</h3>
                <div className="revenue-amount">{totalRevenue.toLocaleString()} DH</div>
                <p>{t(stats.vendu > 1 ? 'seller.basedOnMany' : 'seller.basedOnOne', { count: stats.vendu })}</p>
              </div>
              <div className="stats-bar-chart">
                <h3>{t('seller.distribution')}</h3>
                <div className="bar-chart">
                  <div className="bar-item">
                    <span className="bar-label">{t('seller.available')}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: stats.total > 0 ? `${(stats.disponible / stats.total) * 100}%` : '0%', background: '#059669' }} />
                    </div>
                    <span className="bar-value">{stats.disponible}</span>
                  </div>
                  <div className="bar-item">
                    <span className="bar-label">{t('seller.pending')}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: stats.total > 0 ? `${(stats.en_attente / stats.total) * 100}%` : '0%', background: '#d97706' }} />
                    </div>
                    <span className="bar-value">{stats.en_attente}</span>
                  </div>
                  <div className="bar-item">
                    <span className="bar-label">{t('seller.sold')}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: stats.total > 0 ? `${(stats.vendu / stats.total) * 100}%` : '0%', background: '#dc2626' }} />
                    </div>
                    <span className="bar-value">{stats.vendu}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stats-table-section">
              <h3>{t('seller.detailSales')}</h3>
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('seller.productCol')}</th>
                      <th>{t('seller.priceCol')}</th>
                      <th>{t('seller.statusCol')}</th>
                      <th>{t('seller.categoryCol')}</th>
                      <th>{t('seller.dateCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>{t('seller.noProducts')}</td></tr>
                    ) : products.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td>{Number(p.price).toLocaleString()} DH</td>
                        <td>
                          <span className="status-dot" style={{ background: statusColors[p.status || 'disponible'] }} />
                          {statusLabels[p.status] || t('seller.available')}
                        </td>
                        <td>{p.category_name || '-'}</td>
                        <td>{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      </motion.div>
    </div>
  );
}
