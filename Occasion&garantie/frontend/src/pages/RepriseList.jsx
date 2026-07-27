import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiSmartphone, FiDollarSign, FiCheck, FiX, FiClock, FiRefreshCw, FiPhone, FiMessageCircle } from 'react-icons/fi';
import api from '../api/axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const statusStyles = {
  en_attente: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'En attente' },
  estime: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Estime' },
  accepte: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Accepte' },
  refuse: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Refuse' },
  converti: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6', label: 'Converti en produit' },
};

export default function RepriseList() {
  const [reprises, setReprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/reprises').then(res => setReprises(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const update = async (id, data) => {
    setSaving(true);
    try {
      await api.put(`/reprises/${id}`, data);
      load();
      setSelected(null);
    } catch {}
    setSaving(false);
  };

  const convert = async (id) => {
    try {
      await api.post(`/reprises/${id}/convert`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const imgUrl = (p) => p?.startsWith('http') ? p : `${API_BASE}${p}`;

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Link to="/" className="btn btn-ghost" style={{ marginBottom: 8 }}><FiArrowLeft /> Accueil</Link>
            <h1 style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiSmartphone size={28} style={{ color: 'var(--primary)' }} /> Reprises
            </h1>
          </div>
          <button onClick={load} className="btn btn-ghost" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiRefreshCw size={14} /> Actualiser
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="spinner" /></div>
        ) : reprises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <FiSmartphone size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>Aucune reprise pour le moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reprises.map(r => (
              <div key={r.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.brand} {r.model}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {r.full_name || 'Anonyme'} | {r.imei ? `IMEI: ${r.imei}` : 'IMEI: N/A'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: (statusStyles[r.status] || statusStyles.en_attente).bg,
                      color: (statusStyles[r.status] || statusStyles.en_attente).color,
                    }}>
                      {(statusStyles[r.status] || statusStyles.en_attente).label}
                    </span>
                    {r.estimated_price && <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.estimated_price} DH</span>}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}><FiClock size={11} /> {new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {r.photos && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {Object.entries(JSON.parse(r.photos)).map(([key, url]) => (
                      <a key={key} href={imgUrl(url)} target="_blank" rel="noopener noreferrer" style={{
                        width: 72, height: 72, borderRadius: 8, overflow: 'hidden', display: 'block',
                        border: '1px solid var(--border)',
                      }}>
                        <img src={imgUrl(url)} alt={key} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </a>
                    ))}
                  </div>
                )}

                {selected === r.id ? (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Estimation</div>
                    <input type="number" placeholder="Prix estime (DH)" value={price} onChange={e => setPrice(e.target.value)}
                      style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }} />
                    <textarea placeholder="Notes (optionnel)" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', resize: 'vertical' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => update(r.id, { estimated_price: price || null, status: 'estime', vendor_notes: notes || null })}
                        disabled={saving || !price} className="btn btn-primary" style={{ fontSize: 13 }}>
                        <FiDollarSign size={14} /> Estimer
                      </button>
                      <button onClick={() => update(r.id, { status: 'refuse', vendor_notes: notes || null })}
                        disabled={saving} className="btn btn-primary" style={{ fontSize: 13, background: '#ef4444' }}>
                        <FiX size={14} /> Refuser
                      </button>
                      <button onClick={() => { setSelected(null); setPrice(''); setNotes(''); }} className="btn btn-ghost" style={{ fontSize: 13 }}>Annuler</button>
                    </div>
                  </div>
                ) : r.status === 'estime' ? (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button onClick={() => update(r.id, { status: 'accepte' })} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                      <FiCheck size={13} /> Accepter
                    </button>
                    <button onClick={() => update(r.id, { status: 'refuse' })} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', background: '#ef4444' }}>
                      <FiX size={13} /> Refuser
                    </button>
                  </div>
                ) : r.status === 'accepte' ? (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {r.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
                        <FiPhone size={16} style={{ color: '#10b981' }} />
                        <span>{r.phone}</span>
                        <a href={`tel:${r.phone}`} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', marginLeft: 'auto', textDecoration: 'none' }}>
                          <FiPhone size={13} /> Appeler
                        </a>
                        <a href={`https://wa.me/${r.phone.replace(/^0+/, '')}`} target="_blank" rel="noopener noreferrer"
                          className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', background: '#25D366', textDecoration: 'none' }}>
                          <FiMessageCircle size={13} /> WhatsApp
                        </a>
                      </div>
                    )}
                    <button onClick={() => convert(r.id)} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', alignSelf: 'flex-start' }}>
                      <FiSmartphone size={13} /> Convertir en produit
                    </button>
                  </div>
                ) : null}

                {!selected || selected !== r.id ? (
                  r.status === 'en_attente' && (
                    <button onClick={() => { setSelected(r.id); setPrice(String(r.estimated_price || '')); setNotes(r.vendor_notes || ''); }}
                      className="btn btn-ghost" style={{ fontSize: 12, marginTop: 8, padding: '6px 14px' }}>
                      <FiDollarSign size={13} /> Estimer ce telephone
                    </button>
                  )
                ) : null}

                {r.client_notes && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <strong>Client :</strong> {r.client_notes}
                  </div>
                )}
                {r.vendor_notes && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Note: {r.vendor_notes}
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
