import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiHardDrive, FiDatabase, FiImage, FiArchive, FiCpu, FiRefreshCw, FiBox } from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

function fmtBytes(b) {
  if (!b && b !== 0) return '-';
  if (b < 1024) return `${b} o`;
  const u = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), u.length - 1);
  return `${(b / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

function fmtUptime(s) {
  if (!s && s !== 0) return '-';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${Math.floor((s % 3600) / 60)}min`;
  return `${Math.floor(s / 60)}min`;
}

function Bar({ pct }) {
  const v = Math.min(100, parseFloat(pct) || 0);
  const color = v > 85 ? '#dc2626' : v > 65 ? '#d97706' : '#059669';
  return (
    <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-secondary)', overflow: 'hidden', marginTop: 8 }}>
      <div style={{ width: `${v}%`, height: '100%', borderRadius: 999, background: color, transition: 'width 0.5s' }} />
    </div>
  );
}

export default function AdminStorage() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get('/admin/system/storage');
      setData(res.data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    const id = setInterval(() => load(true), 30000);
    return () => clearInterval(id);
  }, [load]);

  const host = data?.host || null;
  const db = data?.db || null;
  const diskPct = host ? parseFloat(host.disk.pct) || 0 : 0;
  const memPct = host && host.mem.total ? Math.round((host.mem.used / host.mem.total) * 100) : 0;

  const card = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: 20,
  };

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> {t('admin.dashboardTitle')}</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiHardDrive size={28} style={{ color: 'var(--primary)' }} /> {t('admin.storageTitle')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              {host ? t('admin.storageUpdated', { at: new Date(host.at).toLocaleString('fr-FR') }) : t('admin.storageNoData')}
            </p>
          </div>
          <button onClick={() => load(true)} disabled={refreshing} className="btn btn-outline" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiRefreshCw size={14} className={refreshing ? 'spin' : ''} /> {t('admin.refresh')}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <FiHardDrive size={18} style={{ color: 'var(--primary)' }} />
                <strong>{t('admin.storageDisk')}</strong>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{host ? fmtBytes(host.disk.used) : '-'} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>/ {host ? fmtBytes(host.disk.size) : '-'}</span></div>
              <Bar pct={diskPct} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{t('admin.storageFree', { free: host ? fmtBytes(host.disk.avail) : '-' })}</div>
            </div>

            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <FiDatabase size={18} style={{ color: '#3b82f6' }} />
                <strong>{t('admin.storageDb')}</strong>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{db && !db.error ? fmtBytes(db.bytes) : '-'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                {db && !db.error ? `${db.users} users · ${db.products} produits` : t('admin.storageNoData')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <FiImage size={16} style={{ color: '#d97706' }} />
                <strong style={{ fontSize: 13 }}>{t('admin.storageUploads')}</strong>
                <span style={{ marginLeft: 'auto', fontWeight: 800 }}>{host ? fmtBytes(host.uploads_bytes) : '-'}</span>
              </div>
            </div>

            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <FiArchive size={18} style={{ color: '#059669' }} />
                <strong>{t('admin.storageBackups')}</strong>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{host ? host.backups.count : '-'} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>{host ? fmtBytes(host.backups.bytes) : ''}</span></div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{host?.backups?.last || t('admin.storageNoData')}</div>
            </div>

            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <FiCpu size={18} style={{ color: '#8b5cf6' }} />
                <strong>{t('admin.storageServer')}</strong>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2 }}>
                <div>RAM: <strong>{host ? `${fmtBytes(host.mem.used)} / ${fmtBytes(host.mem.total)} (${memPct}%)` : '-'}</strong></div>
                <div>Uptime: <strong>{host ? fmtUptime(host.uptime_s) : '-'}</strong></div>
                <div>Load: <strong style={{ fontFamily: 'monospace' }}>{host?.load || '-'}</strong></div>
              </div>
            </div>

            <div style={{ ...card, gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <FiBox size={18} style={{ color: 'var(--primary)' }} />
                <strong>{t('admin.storageContainers')}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(host?.containers || []).map((c) => (
                  <span key={c.name} style={{ fontSize: 12, fontWeight: 600, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 999, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.status.toLowerCase().includes('up') ? '#10b981' : '#ef4444' }} />
                    {c.name} · {c.status}
                  </span>
                ))}
                {(!host || !host.containers?.length) && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('admin.storageNoData')}</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
