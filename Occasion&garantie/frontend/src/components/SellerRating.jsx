import { useState, useEffect } from 'react';
import { FiStar, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import ConfirmModal from './ConfirmModal';

const starStyle = (fill) => ({
  background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
  color: fill ? 'var(--primary)' : 'var(--text-muted)',
});

export default function SellerRating({ sellerId, currentUserId }) {
  const { t } = useLanguage();
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({ total: 0, avg: 0 });
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const load = () => {
    api.get('/ratings/seller/' + sellerId)
      .then(res => {
        setRatings(res.data.ratings);
        setStats(res.data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [sellerId]);

  const myExisting = ratings.find(r => r.user_id === currentUserId);
  const canRate = currentUserId && currentUserId !== sellerId && !myExisting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (myRating === 0) return;
    setSubmitting(true);
    try {
      if (editId) {
        await api.put('/ratings/' + editId, { rating: myRating, comment: myComment });
      } else {
        await api.post('/ratings', { seller_id: sellerId, rating: myRating, comment: myComment });
      }
      setShowForm(false);
      setEditId(null);
      setMyRating(0);
      setMyComment('');
      load();
    } catch (err) {
      alert(err.response?.data?.message || t('seller.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await api.delete('/ratings/' + id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || t('seller.error'));
    }
  };

  const startEdit = (r) => {
    setEditId(r.id);
    setMyRating(r.rating);
    setMyComment(r.comment || '');
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditId(null);
    setMyRating(0);
    setMyComment('');
  };

  if (loading) return null;

  return (
    <div style={{ marginTop: '32px', padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('seller.ratingTitle')}</h3>
        {stats.total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1,2,3,4,5].map(s => (
                <FiStar key={s} size={16} fill={s <= Math.round(stats.avg) ? 'var(--primary)' : 'none'} color="var(--primary)" />
              ))}
            </div>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>{stats.avg}/5</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t('seller.reviews', { count: stats.total })}</span>
          </div>
        )}
      </div>

      {currentUserId && currentUserId !== sellerId && (
        <div style={{ marginBottom: '20px' }}>
          {!myExisting || editId ? (
            showForm ? (
              <form onSubmit={handleSubmit} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{t('seller.yourRating')}</label>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setMyRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                      <FiStar size={28} fill={s <= myRating ? 'var(--primary)' : 'none'} color={s <= myRating ? 'var(--primary)' : 'var(--text-muted)'} style={{ transition: 'fill 0.15s' }} />
                    </button>
                  ))}
                </div>
                <textarea value={myComment} onChange={e => setMyComment(e.target.value)} placeholder={t('seller.commentPlaceholder')} rows={2} maxLength={150} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '13px', resize: 'vertical', marginBottom: '10px', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('seller.charCount', { count: myComment.length })}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }} disabled={submitting || myRating === 0}>
                    {submitting ? '...' : editId ? t('seller.edit') : t('seller.publish')}
                  </button>
                  <button type="button" onClick={cancelForm} className="btn btn-ghost" style={{ padding: '8px 20px', fontSize: '13px' }}>{t('seller.cancel')}</button>
                </div>
              </form>
            ) : canRate ? (
              <button onClick={() => setShowForm(true)} className="btn btn-outline" style={{ fontSize: '13px' }}><FiStar size={14} /> {t('seller.rateSeller')}</button>
            ) : null
          ) : (
            <p style={{ color: 'var(--success)', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{t('seller.thanksForReview')}</span>
              <button onClick={() => startEdit(myExisting)} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }}><FiEdit2 size={12} /> {t('seller.edit')}</button>
              <button onClick={() => setDeleteTargetId(myExisting.id)} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--error)' }}><FiTrash2 size={12} /> {t('seller.delete')}</button>
            </p>
          )}
        </div>
      )}

      {ratings.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t('seller.noReviews')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ratings.map(r => (
            <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', background: 'var(--gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                    {r.avatar ? <img src={r.avatar.startsWith('http') ? r.avatar : '/uploads/avatars/' + r.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : r.full_name?.[0] || '?'}
                  </div>
                  <strong style={{ fontSize: '13px' }}>{r.full_name}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1,2,3,4,5].map(s => (
                      <FiStar key={s} size={12} fill={s <= r.rating ? 'var(--primary)' : 'none'} color="var(--primary)" />
                    ))}
                  </div>
                  {currentUserId && r.user_id === currentUserId && !editId && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => startEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }} title={t('seller.edit')}><FiEdit2 size={12} /></button>
                      <button onClick={() => setDeleteTargetId(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '2px' }} title={t('seller.delete')}><FiTrash2 size={12} /></button>
                    </div>
                  )}
                </div>
              </div>
              {r.comment && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{r.comment}</p>}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={executeDelete}
        title={t('seller.deleteReviewTitle')}
        message={t('seller.irreversibleAction')}
        confirmText={t('seller.confirmDelete')}
        confirmColor="#dc2626"
        icon={<FiTrash2 size={26} color="#dc2626" />}
      />
    </div>
  );
}
