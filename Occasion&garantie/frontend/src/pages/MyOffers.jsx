import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiSend, FiShoppingBag, FiMessageCircle, FiClock } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  en_attente: { label: 'En attente du vendeur', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  contre_offre: { label: 'Contre-offre', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  acceptee: { label: 'Acceptée', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  refusee: { label: 'Refusée', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  annulee: { label: 'Annulée', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

export default function MyOffers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counterTarget, setCounterTarget] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');

  useEffect(() => {
    api.get('/negotiations/mine')
      .then((res) => setOffers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const respond = async (id, status) => {
    try {
      const { data } = await api.put(`/negotiations/${id}`, { status });
      setOffers(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      if (data.conversation_id) navigate(`/messenger/${data.conversation_id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const submitCounter = async () => {
    if (!counterTarget) return;
    const price = parseFloat(counterPrice);
    if (!price || price <= 0) { alert('Entrez un prix valide.'); return; }
    try {
      await api.put(`/negotiations/${counterTarget.id}`, { status: 'contre_offre', price });
      setOffers(prev => prev.map(o => o.id === counterTarget.id ? { ...o, status: 'contre_offre', counter_price: price, counter_by: user.id } : o));
      setCounterTarget(null);
      setCounterPrice('');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const canRespond = (o) => o.status === 'contre_offre' && Number(o.counter_by) === Number(o.seller_id);

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="seller-page">
      <div className="seller-page-header">
        <div>
          <h1>Mes offres</h1>
          <p className="text-secondary">Suivez et répondez à vos négociations de prix</p>
        </div>
        <Link to="/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <FiShoppingBag size={16} /> Parcourir les produits
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {offers.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 24 }}>
            <FiShoppingBag size={48} />
            <p>Aucune offre pour le moment. Proposez un prix sur un produit !</p>
            <Link to="/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Voir les produits
            </Link>
          </div>
        ) : offers.map(o => {
          const cfg = statusConfig[o.status] || { label: o.status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
          const pending = o.status === 'en_attente' || (o.status === 'contre_offre' && Number(o.counter_by) === Number(user.id));
          return (
            <div key={o.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: 14,
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              {o.product_image ? (
                <img src={o.product_image.startsWith('http') ? o.product_image : `/uploads/${o.product_image}`} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'contain', background: '#fff', border: '1px solid var(--border)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiShoppingBag size={22} style={{ opacity: 0.3 }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <Link to={`/products/${o.product_slug}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}>{o.product_name}</Link>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Votre offre : <strong style={{ color: 'var(--primary)' }}>{Number(o.offered_price)} DH</strong>
                  {o.counter_price != null && Number(o.counter_price) !== Number(o.offered_price) && (
                    <> · Contre-offre : <strong>{Number(o.counter_price)} DH</strong></>
                  )}
                </div>
                {o.message && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>« {o.message} »</div>}
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {o.status === 'acceptee' && o.conversation_id && (
                  <Link to={`/messenger/${o.conversation_id}`} className="btn" style={{ fontSize: 12, padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', textDecoration: 'none' }}>
                    <FiMessageCircle size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} /> Ouvrir le chat
                  </Link>
                )}
                {canRespond(o) && (
                  <>
                    <button onClick={() => respond(o.id, 'acceptee')} className="btn" style={{ fontSize: 12, padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none' }}>
                      <FiCheck size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} /> Accepter
                    </button>
                    <button onClick={() => { setCounterTarget(o); setCounterPrice(''); }} className="btn" style={{ fontSize: 12, padding: '6px 12px', background: 'var(--primary)', color: '#fff', border: 'none' }}>
                      <FiSend size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} /> Contre-proposer
                    </button>
                    <button onClick={() => respond(o.id, 'refusee')} className="btn" style={{ fontSize: 12, padding: '6px 12px', background: 'transparent', color: '#ef4444', border: '1.5px solid #ef4444' }}>
                      <FiX size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} /> Refuser
                    </button>
                  </>
                )}
                {o.status === 'en_attente' && (
                  <button onClick={() => respond(o.id, 'annulee')} className="btn" style={{ fontSize: 12, padding: '6px 12px', background: 'transparent', color: '#64748b', border: '1.5px solid #64748b' }}>
                    <FiX size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} /> Annuler
                  </button>
                )}
                {pending && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiClock size={13} /> En attente...
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {counterTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setCounterTarget(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>Contre-proposer un prix</h3>
                <button onClick={() => setCounterTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><FiX size={18} /></button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Contre-offre du vendeur : <strong>{Number(counterTarget.counter_price)} DH</strong> — {counterTarget.product_name}
              </p>
              <input
                type="number" min="0" placeholder="Votre prix (DH)" value={counterPrice}
                onChange={e => setCounterPrice(e.target.value)}
                autoFocus
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)', marginBottom: 16, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" onClick={() => setCounterTarget(null)} style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
                <button className="form-submit" onClick={submitCounter} style={{ flex: 1, justifyContent: 'center' }}>
                  <FiSend size={15} /> Envoyer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
