import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiArrowLeft, FiUsers as FiUsersIcon, FiShield, FiEdit3, FiSave, FiX, FiCheck } from 'react-icons/fi';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [storeModal, setStoreModal] = useState(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeSuccess, setStoreSuccess] = useState('');

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    setDeleting(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setDeleting(null);
    }
  };

  const handleChangeStoreName = async () => {
    if (!storeModal || !newStoreName.trim()) return;
    setStoreLoading(true);
    setStoreSuccess('');
    try {
      await api.put(`/admin/users/${storeModal.id}/store-name`, { store_name: newStoreName.trim() });
      setUsers(users.map(u => u.id === storeModal.id ? { ...u, store_name: newStoreName.trim() } : u));
      setStoreSuccess('Nom de store modifie avec succes !');
      setTimeout(() => { setStoreModal(null); setNewStoreName(''); setStoreSuccess(''); }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setStoreLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> Dashboard</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Gestion des Utilisateurs</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <div className="empty-state"><FiUsersIcon size={48} /><p>Aucun utilisateur.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Nom</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Telephone</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Credits</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Inscrit le</th>
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 6px', color: 'var(--text-muted)' }}>#{u.id}</td>
                    <td style={{ padding: '10px 6px', fontWeight: 600 }}>
                      {u.full_name}
                      {u.store_name && <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>Boutique: {u.store_name}</small>}
                    </td>
                    <td style={{ padding: '10px 6px' }}>{u.email}</td>
                    <td style={{ padding: '10px 6px' }}>{u.phone || '-'}</td>
                    <td style={{ padding: '10px 6px' }}>
                      {u.role === 'admin' ? (
                        <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}><FiShield size={13} /> Admin</span>
                      ) : u.role === 'seller' ? (
                        <span style={{ color: '#059669', fontWeight: 600 }}>Vendeur</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Client</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 6px', fontWeight: 700 }}>{Number(u.credit_balance || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 6px', fontSize: '11px', color: 'var(--text-secondary)' }}>{formatDate(u.created_at)}</td>
                    <td style={{ padding: '10px 6px' }}>
                      {u.role === 'seller' && (
                        <button onClick={() => { setStoreModal(u); setNewStoreName(u.store_name || ''); }}
                          className="btn" style={{ padding: '5px 10px', fontSize: '11px', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'none', marginRight: 4 }}>
                          <FiEdit3 size={12} /> Store
                        </button>
                      )}
                      {u.id !== 1 && (
                        <button onClick={() => setDeleteTarget({ id: u.id, name: u.full_name })} disabled={deleting === u.id}
                          className="btn" style={{ padding: '5px 10px', fontSize: '11px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: 'none' }}>
                          {deleting === u.id ? '...' : <><FiTrash2 size={12} /> Supprimer</>}
                        </button>
                      )}
                      {u.id === 1 && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Super admin</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {storeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => { if (!storeLoading) { setStoreModal(null); setStoreSuccess(''); } }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%', boxShadow: '0 25px 80px rgba(0,0,0,0.35)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiEdit3 size={24} color="#3b82f6" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Changer le nom de store</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{storeModal.full_name}</p>
              </div>
            </div>

            {storeSuccess ? (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <FiCheck size={24} color="#059669" />
                </div>
                <p style={{ fontSize: 14, color: '#059669', fontWeight: 600 }}>{storeSuccess}</p>
              </div>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Nouveau nom de store</label>
                  <input value={newStoreName} onChange={e => setNewStoreName(e.target.value)} className="form-control" placeholder="Nom de la boutique" autoFocus />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStoreModal(null)} className="btn btn-outline" disabled={storeLoading} style={{ flex: 1, justifyContent: 'center', padding: '10px 0' }}>
                    Annuler
                  </button>
                  <button onClick={handleChangeStoreName} disabled={storeLoading || !newStoreName.trim()}
                    className="form-submit" style={{ flex: 1, justifyContent: 'center', padding: '10px 0', background: '#3b82f6', borderColor: '#3b82f6' }}>
                    <FiSave size={14} /> {storeLoading ? '...' : 'Enregistrer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title={`Supprimer "${deleteTarget?.name || ''}" ?`}
        message="Toutes ses annonces et donnees seront effacees."
        confirmText="Supprimer"
        confirmColor="#dc2626"
        icon={<FiTrash2 size={26} color="#dc2626" />}
      />
    </section>
  );
}