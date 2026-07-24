import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiArrowLeft, FiUsers as FiUsersIcon, FiShield, FiStar } from 'react-icons/fi';
import api from '../api/axios';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer definitivement "${name}" ?\nToutes ses annonces et donnees seront effacees.`)) return;
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
                  <th style={{ padding: '10px 6px', textAlign: 'left' }}>Premium</th>
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
                    <td style={{ padding: '10px 6px' }}>
                      {u.premium ? <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}><FiStar size={13} /> Premium</span> : '-'}
                    </td>
                    <td style={{ padding: '10px 6px', fontWeight: 700 }}>{Number(u.credit_balance || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 6px', fontSize: '11px', color: 'var(--text-secondary)' }}>{formatDate(u.created_at)}</td>
                    <td style={{ padding: '10px 6px' }}>
                      {u.id !== 1 && (
                        <button onClick={() => handleDelete(u.id, u.full_name)} disabled={deleting === u.id}
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
    </section>
  );
}