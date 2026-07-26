import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiUser, FiMonitor, FiGlobe, FiClock, FiSearch, FiRefreshCw } from 'react-icons/fi';
import api from '../api/axios';

const actionLabels = {
  connexion: 'Connexion',
  produit_ajoute: 'Produit ajouté',
  statut_disponible: 'Marqué disponible',
  statut_en_attente: 'Marqué en attente',
  statut_vendu: 'Vendu',
};

export default function AdminVendorLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [reindexing, setReindexing] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/admin/vendor-logs')
      .then(res => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const reindex = async () => {
    if (reindexing) return;
    setReindexing(true);
    try {
      await api.post('/admin/vendor-logs/reindex');
      load();
    } catch {}
    setReindexing(false);
  };

  const filtered = search
    ? logs.filter(l =>
        (l.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.store_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.ip_address || '').includes(search) ||
        (l.action || '').includes(search.toLowerCase())
      )
    : logs;

  const formatDate = (d) => new Date(d).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> Dashboard</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiShield size={28} style={{ color: 'var(--primary)' }} /> Journal des vendeurs
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Activite des vendeurs : IP, operateur, localisation, appareil</p>
          </div>
          <button onClick={reindex} disabled={reindexing} className="btn btn-ghost" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiRefreshCw size={14} className={reindexing ? 'spin' : ''} /> {reindexing ? 'Analyse...' : 'Re-analyser tout'}
          </button>
        </div>

        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <FiSearch size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Rechercher par nom, email, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <FiShield size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Aucune activite enregistree.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(log => (
              <div key={log.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '16px', cursor: 'pointer',
              }}
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiUser size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{log.store_name || log.full_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.email} | {log.phone || 'Tel inconnu'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                      background: log.action === 'connexion' ? 'rgba(59,130,246,0.1)' :
                                   log.action === 'produit_ajoute' ? 'rgba(16,185,129,0.1)' :
                                   log.action === 'statut_vendu' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      color: log.action === 'connexion' ? '#3b82f6' :
                             log.action === 'produit_ajoute' ? '#10b981' :
                             log.action === 'statut_vendu' ? '#ef4444' : '#f59e0b',
                    }}>
                      {actionLabels[log.action] || log.action}
                    </span>
                      {log.is_vpn == 1 && (
                        <span style={{
                          padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                          background: log.vpn_warned_at && (Date.now() - new Date(log.vpn_warned_at).getTime() > 60*60*1000) ? 'rgba(220,38,38,0.15)' : 'rgba(239,68,68,0.12)',
                          color: log.vpn_warned_at && (Date.now() - new Date(log.vpn_warned_at).getTime() > 60*60*1000) ? '#dc2626' : '#ef4444',
                        }}>
                          VPN {log.vpn_warned_at ? '⚠' : ''}
                        </span>
                      )}
                      {log.is_vpn != 1 && log.is_datacenter == 1 && (
                        <span style={{
                          padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                          background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
                        }}>
                          Hebergement
                        </span>
                      )}
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <FiClock size={11} /> {formatDate(log.created_at)}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span>{log.isp || 'Inconnu'}</span>
                  {(log.city || log.region || log.country) && (
                    <span style={{ color: 'var(--text-muted)' }}>— {[log.city, log.region, log.country].filter(Boolean).join(', ')}</span>
                  )}
                </div>
                {expanded === log.id && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <div><FiGlobe size={13} /> IP : <strong>{log.ip_address}</strong>
                      {log.is_vpn == 1 && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 600, color: '#ef4444' }}>⚠ VPN</span>
                      )}
                      {log.is_vpn != 1 && log.is_datacenter == 1 && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 600, color: '#f59e0b' }}>Hebergement</span>
                      )}
                    </div>
                    <div><FiMonitor size={13} /> Operateur : <strong>{log.isp || 'Inconnu'}</strong></div>
                    {(log.city || log.region || log.country) && (
                      <div style={{ marginTop: '4px' }}>
                        <FiGlobe size={13} /> Localisation : <strong>{[log.city, log.region, log.country].filter(Boolean).join(', ')}</strong>
                      </div>
                    )}
                    <div style={{ fontSize: '12px', wordBreak: 'break-word', marginTop: '4px' }}>Appareil : {log.user_agent || 'Inconnu'}</div>
                    {log.product_id && <div>Produit #{log.product_id}</div>}
                    {log.details && <div style={{ marginTop: '4px', fontStyle: 'italic' }}>"{log.details}"</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
