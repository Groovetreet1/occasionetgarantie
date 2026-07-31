import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiArrowLeft, FiUsers as FiUsersIcon, FiShield, FiEdit3, FiSave, FiX, FiCheck, FiLock, FiUnlock, FiMoreVertical } from 'react-icons/fi';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [storeModal, setStoreModal] = useState(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeSuccess, setStoreSuccess] = useState('');
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  const fetchUsers = (p, l) => {
    setLoading(true);
    api.get(`/admin/users?page=${p}&limit=${l}`)
      .then(res => { setUsers(res.data.users); setTotal(res.data.total); setTotalPages(res.data.totalPages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(page, limit); }, [page, limit]);

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    setDeleting(id);
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers(page, limit);
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
      fetchUsers(page, limit);
      setStoreSuccess('Nom de store modifie avec succes !');
      setTimeout(() => { setStoreModal(null); setNewStoreName(''); setStoreSuccess(''); }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setStoreLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendModal) return;
    setSuspendLoading(true);
    try {
      await api.put(`/admin/users/${suspendModal.id}/suspend`, { reason: suspendReason.trim() || undefined });
      fetchUsers(page, limit);
      setSuspendModal(null);
      setSuspendReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleUnsuspend = async (user) => {
    if (!confirm(`Debloquer le compte de "${user.full_name}" ?`)) return;
    try {
      await api.put(`/admin/users/${user.id}/unsuspend`);
      fetchUsers(page, limit);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> Dashboard</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Gestion des Utilisateurs</h1>
            
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <div className="empty-state"><FiUsersIcon size={48} /><p>Aucun utilisateur.</p></div>
        ) : (
          <>
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
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Statut</th>
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
                        <span style={{ background: '#dc2626', color: '#fff', padding: '2px 10px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><FiShield size={12} /> Admin</span>
                      ) : u.role === 'seller' ? (
                        <span style={{ background: '#059669', color: '#fff', padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>Vendeur</span>
                      ) : (
                        <span style={{ background: '#6b7280', color: '#fff', padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>Client</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 6px', fontWeight: 700 }}>{Number(u.credit_balance || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 6px', fontSize: '11px' }}>
                      {u.suspended ? (
                        <span style={{ color: '#dc2626', fontWeight: 600, background: 'rgba(220,38,38,0.1)', padding: '2px 8px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <FiLock size={11} /> Suspendu
                        </span>
                      ) : (
                        <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <FiCheck size={12} /> Actif
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 6px', fontSize: '11px', color: 'var(--text-secondary)' }}>{formatDate(u.created_at)}</td>
                    <td style={{ padding: '10px 6px', position: 'relative' }}>
                      {u.id === 1 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Super admin</span>
                      ) : (
                        <>
                          <button onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                            className="btn" style={{ padding: '6px 10px', fontSize: '11px', background: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', borderRadius: 8 }}>
                            <FiMoreVertical size={16} />
                          </button>
                          {openMenu === u.id && (
                            <div ref={menuRef} style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 999, minWidth: 160, padding: 6, marginTop: 4 }}>
                              {u.role === 'seller' && (
                                <button onClick={() => { setOpenMenu(null); setStoreModal(u); setNewStoreName(u.store_name || ''); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', fontSize: '12px', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', borderRadius: 8, transition: 'background 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                  <FiEdit3 size={14} /> Changer Store
                                </button>
                              )}
                              {!u.suspended && (
                                <button onClick={() => { setOpenMenu(null); setSuspendModal(u); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', fontSize: '12px', background: 'none', border: 'none', color: '#d97706', cursor: 'pointer', borderRadius: 8 }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                  <FiLock size={14} /> Suspendre
                                </button>
                              )}
                              {!!u.suspended && (
                                <button onClick={() => { setOpenMenu(null); handleUnsuspend(u); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', fontSize: '12px', background: 'none', border: 'none', color: '#059669', cursor: 'pointer', borderRadius: 8 }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(5,150,105,0.08)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                  <FiUnlock size={14} /> Debloquer
                                </button>
                              )}
                              <div style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />
                              <button onClick={() => { setOpenMenu(null); setDeleteTarget({ id: u.id, name: u.full_name }); }} disabled={deleting === u.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', fontSize: '12px', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', borderRadius: 8 }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                <FiTrash2 size={14} /> Supprimer
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Afficher</span>
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} utilisateur{total > 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, fontSize: 13 }}>← Précedent</button>
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
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, fontSize: 13 }}>Suivant →</button>
            </div>
          </div>
          </>
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

      {suspendModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => { if (!suspendLoading) { setSuspendModal(null); setSuspendReason(''); } }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%', boxShadow: '0 25px 80px rgba(0,0,0,0.35)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiLock size={24} color="#d97706" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Suspendre le compte</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{suspendModal.full_name} &middot; {suspendModal.email}</p>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Raison de la suspension</label>
              <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)}
                className="form-control" rows={3} placeholder="Optionnel : saisissez le motif..." />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setSuspendModal(null); setSuspendReason(''); }} className="btn btn-outline" disabled={suspendLoading} style={{ flex: 1, justifyContent: 'center', padding: '10px 0' }}>
                Annuler
              </button>
              <button onClick={handleSuspend} disabled={suspendLoading}
                className="form-submit" style={{ flex: 1, justifyContent: 'center', padding: '10px 0', background: '#d97706', borderColor: '#d97706' }}>
                <FiLock size={14} /> {suspendLoading ? '...' : 'Suspendre'}
              </button>
            </div>
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