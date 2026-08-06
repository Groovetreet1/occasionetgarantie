import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiUser, FiMonitor, FiGlobe, FiClock, FiSearch, FiRefreshCw, FiMapPin, FiCopy } from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const actionLabels = {
  connexion: 'Connexion',
  produit_ajoute: 'Produit ajouté',
  statut_disponible: 'Marqué disponible',
  statut_en_attente: 'Marqué en attente',
  statut_vendu: 'Vendu',
};

function CoordBadge({ lat, lng }) {
  const { t } = useLanguage();
  if (!lat || !lng) return null;
  const copy = () => { navigator.clipboard.writeText(`${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`); };
  return (
    <span onClick={copy} title={t('admin.copy')} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '6px', fontSize: '11px', fontWeight: 600, fontFamily: 'monospace' }}>
      <FiMapPin size={11} /> {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)} <FiCopy size={10} />
    </span>
  );
}

export default function AdminVendorLogs() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [reindexing, setReindexing] = useState(false);
  const [reindexMsg, setReindexMsg] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [leafletError, setLeafletError] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const LRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.get(`/admin/vendor-logs?page=${page}&limit=${limit}`)
      .then(res => {
        setLogs(res.data.logs || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, limit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import(/* webpackIgnore: true */ 'leaflet');
        const L = mod.default || mod;
        try { delete L.Icon.Default.prototype._getIconUrl; } catch (_) {}
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
        try { await import(/* webpackIgnore: true */ 'leaflet/dist/leaflet.css'); } catch (_) {}
        if (!cancelled) { LRef.current = L; setMapReady(true); }
      } catch (e) {
        console.warn('Leaflet map failed to load:', e);
        if (!cancelled) setLeafletError(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const L = LRef.current;
    if (!mapContainerRef.current || !L || !mapReady) return;
    if (mapRef.current) { try { mapRef.current.remove(); } catch (_) {} mapRef.current = null; }
    try {
      const map = L.map(mapContainerRef.current).setView([31.7917, -7.0926], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      const withCoords = logs.filter(l => l.latitude && l.longitude);
      if (withCoords.length > 0) {
        const markers = L.layerGroup().addTo(map);
        withCoords.forEach(l => {
          const lat = parseFloat(l.latitude);
          const lng = parseFloat(l.longitude);
          if (isNaN(lat) || isNaN(lng)) return;
          const popup = `
            <div style="font-family:sans-serif;font-size:13px;line-height:1.8">
              <div style="font-weight:700;font-size:14px;margin-bottom:4px">${l.store_name || l.full_name || 'Inconnu'}</div>
              <div style="color:#666">${l.email}${l.phone ? ' | ' + l.phone : ''}</div>
              <div style="margin:6px 0">
                <span style="background:#3b82f6;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">${actionLabels[l.action] || l.action}</span>
                ${l.is_vpn === 1 ? '<span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;margin-left:4px">VPN</span>' : ''}
                ${l.is_vpn !== 1 && l.is_datacenter === 1 ? '<span style="background:#f59e0b;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;margin-left:4px">Hebergement</span>' : ''}
              </div>
              <div style="margin:4px 0"><strong style="font-size:13px">${lat.toFixed(5)}, ${lng.toFixed(5)}</strong></div>
              <div style="margin:4px 0">${l.city ? l.city + ', ' : ''}${l.country || ''}</div>
              <div style="margin:4px 0">ISP: ${l.isp || 'Inconnu'}</div>
              <div style="margin:8px 0">
                <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="background:#10b981;color:#fff;padding:4px 12px;border-radius:6px;text-decoration:none;font-size:12px">Ouvrir dans Google Maps</a>
                <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="background:#3b82f6;color:#fff;padding:4px 12px;border-radius:6px;text-decoration:none;font-size:12px;margin-left:4px">📍</a>
              </div>
              <div style="color:#999;font-size:11px;margin-top:6px">${new Date(l.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              <div style="font-size:10px;color:#ccc;margin-top:4px;word-break:break-all">${l.user_agent ? l.user_agent.substring(0, 80) + '...' : ''}</div>
            </div>`;
          L.marker([lat, lng]).addTo(markers).bindPopup(popup);
        });
        const bounds = markers.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
      }

      mapRef.current = map;
    } catch (e) {
      console.warn('Map render error:', e);
      setLeafletError(true);
    }
    return () => { if (mapRef.current) { try { mapRef.current.remove(); } catch (_) {} mapRef.current = null; } };
  }, [logs, mapReady]);

  const reindex = async () => {
    if (reindexing) return;
    setReindexing(true);
    setReindexMsg('');
    try {
      const res = await api.post('/admin/vendor-logs/reindex');
      setReindexMsg(t('admin.reindexDone', { done: res.data.reindexed, total: res.data.total }));
      setPage(1);
      load();
    } catch (e) {
      setReindexMsg(`${t('admin.reindexError')} ${e.response?.data?.error || e.message}`);
    }
    setReindexing(false);
    setTimeout(() => setReindexMsg(''), 6000);
  };

  const formatDate = (d) => new Date(d).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const hasCoords = logs.filter(l => l.latitude && l.longitude);

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '4px' }}><FiArrowLeft /> {t('admin.dashboardTitle')}</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiShield size={28} style={{ color: 'var(--primary)' }} /> {t('admin.vendorLogsTitle')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{t('admin.mapSubtitle', { count: hasCoords.length })}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {reindexMsg && <span style={{ fontSize: '12px', color: reindexMsg.startsWith(t('admin.reindexError')) ? '#ef4444' : '#10b981' }}>{reindexMsg}</span>}
            <button onClick={reindex} disabled={reindexing} className="btn btn-ghost" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiRefreshCw size={14} className={reindexing ? 'spin' : ''} /> {reindexing ? t('admin.analyzing') : t('admin.reanalyze')}
            </button>
          </div>
        </div>

        {leafletError ? (
          <div style={{ width: '100%', height: '60px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            {t('admin.mapUnavailable')}
          </div>        ) : (
          <div ref={mapContainerRef} style={{ width: '100%', height: '480px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '20px', zIndex: 0, position: 'relative' }} />
        )}

        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <FiSearch size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('admin.logsSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <FiShield size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>{t('admin.noActivity')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(search ? logs.filter(l =>
              (l.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
              (l.store_name || '').toLowerCase().includes(search.toLowerCase()) ||
              (l.email || '').toLowerCase().includes(search.toLowerCase()) ||
              (l.ip_address || '').includes(search) ||
              (l.action || '').includes(search.toLowerCase())
            ) : logs).map(log => (
              <div key={log.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '14px 16px', cursor: 'pointer',
              }}
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <FiUser size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {log.store_name || log.full_name}
                        {log.latitude && log.longitude && <CoordBadge lat={log.latitude} lng={log.longitude} />}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
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
                    {log.is_vpn === 1 && (
                      <span style={{
                        padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700,
                        background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                      }}>VPN</span>
                    )}
                    {log.is_vpn !== 1 && log.is_datacenter === 1 && (
                      <span style={{
                        padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700,
                        background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
                      }}>Hebergement</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span><FiGlobe size={11} /> {log.ip_address}</span>
                  <span>{log.isp || t('admin.unknown')}</span>
                  {(log.city || log.country) && (
                    <span style={{ color: 'var(--text-muted)' }}>— {[log.city, log.region, log.country].filter(Boolean).join(', ')}</span>
                  )}
                  <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '11px' }}>
                    <FiClock size={11} /> {formatDate(log.created_at)}
                  </span>
                </div>
                {expanded === log.id && (
                  <div style={{ marginTop: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <div><strong>{t('admin.ipLabel')}</strong> {log.ip_address}
                      {log.is_vpn === 1 && <span style={{ marginLeft: '8px', color: '#ef4444' }}>⚠ VPN</span>}
                      {log.is_vpn !== 1 && log.is_datacenter === 1 && <span style={{ marginLeft: '8px', color: '#f59e0b' }}>Hebergement</span>}
                    </div>
                    <div><strong>{t('admin.operatorLabel')}</strong> {log.isp || t('admin.unknown')}</div>
                    {(log.city || log.region || log.country) && (
                      <div><strong>{t('admin.locationLabel')}</strong> {[log.city, log.region, log.country].filter(Boolean).join(', ')}</div>
                    )}
                    {log.latitude && log.longitude && (
                      <div style={{ marginTop: '6px', padding: '8px 10px', background: 'rgba(16,185,129,0.08)', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <strong style={{ color: '#10b981' }}>📍 {t('admin.gpsCoordsLabel')}</strong>
                        <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: 'var(--text)', margin: '4px 0' }}>
                          {parseFloat(log.latitude).toFixed(6)}, {parseFloat(log.longitude).toFixed(6)}
                        </div>
                        <a href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-block', background: '#10b981', color: '#fff', padding: '4px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', marginTop: '4px' }}>
                          {t('admin.openInGoogleMaps')}
                        </a>
                      </div>
                    )}
                    <div style={{ fontSize: '12px', wordBreak: 'break-word', marginTop: '6px' }}><strong>{t('admin.deviceLabel')}</strong> {log.user_agent || t('admin.unknown')}</div>
                    {log.product_id && <div><strong>{t('admin.productLabel')}</strong> #{log.product_id}</div>}
                    {log.details && <div style={{ marginTop: '4px', fontStyle: 'italic' }}>"{log.details}"</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {!loading && logs.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('admin.show')}</span>
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} {total > 1 ? t('admin.requestPlural') : t('admin.requestSingular')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, fontSize: 13 }}>← {t('admin.previous')}</button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const start = Math.max(1, page - 5);
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: p === page ? 'none' : '1px solid var(--border)', background: p === page ? '#3b82f6' : 'var(--bg-card)', color: p === page ? '#fff' : 'var(--text)', cursor: 'pointer', fontWeight: p === page ? 700 : 400, fontSize: 13 }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, fontSize: 13 }}>{t('admin.next')} →</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}