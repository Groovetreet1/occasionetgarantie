import { useState, useEffect } from 'react';
import { FiStar } from 'react-icons/fi';
import api from '../api/axios';

export default function SellerRating({ sellerId, currentUserId }) {
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({ total: 0, avg: 0 });
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('/ratings/seller/' + sellerId)
      .then(res => {
        setRatings(res.data.ratings);
        setStats(res.data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sellerId]);

  const canRate = currentUserId && currentUserId !== sellerId && !ratings.some(r => r.user_id === currentUserId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (myRating === 0) return;
    setSubmitting(true);
    try {
      await api.post('/ratings', { seller_id: sellerId, rating: myRating, comment: myComment });
      setSubmitted(true);
      const res = await api.get('/ratings/seller/' + sellerId);
      setRatings(res.data.ratings);
      setStats(res.data.stats);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div style={{ marginTop: '32px', padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Avis sur le vendeur</h3>
        {stats.total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1,2,3,4,5].map(s => (
                <FiStar key={s} size={16} fill={s <= Math.round(stats.avg) ? 'var(--primary)' : 'none'} color="var(--primary)" />
              ))}
            </div>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>{stats.avg}/5</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>({stats.total} avis)</span>
          </div>
        )}
      </div>

      {canRate && !submitted && (
        <div style={{ marginBottom: '20px' }}>
          {showForm ? (
            <form onSubmit={handleSubmit} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Votre note</label>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setMyRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                    <FiStar size={28} fill={s <= myRating ? 'var(--primary)' : 'none'} color={s <= myRating ? 'var(--primary)' : 'var(--text-muted)'} style={{ transition: 'fill 0.15s' }} />
                  </button>
                ))}
              </div>
              <textarea value={myComment} onChange={e => setMyComment(e.target.value)} placeholder="Votre commentaire (optionnel)" rows={2} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '13px', resize: 'vertical', marginBottom: '10px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }} disabled={submitting || myRating === 0}>
                  {submitting ? '...' : 'Publier'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost" style={{ padding: '8px 20px', fontSize: '13px' }}>Annuler</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowForm(true)} className="btn btn-outline" style={{ fontSize: '13px' }}><FiStar size={14} /> Noter ce vendeur</button>
          )}
        </div>
      )}

      {submitted && (
        <p style={{ color: 'var(--success)', fontSize: '13px', marginBottom: '16px' }}>Merci pour votre avis !</p>
      )}

      {ratings.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Aucun avis pour le moment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ratings.map(r => (
            <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>{r.full_name?.[0] || '?'}</div>
                  <strong style={{ fontSize: '13px' }}>{r.full_name}</strong>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map(s => (
                    <FiStar key={s} size={12} fill={s <= r.rating ? 'var(--primary)' : 'none'} color="var(--primary)" />
                  ))}
                </div>
              </div>
              {r.comment && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{r.comment}</p>}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
