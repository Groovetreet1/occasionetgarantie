import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiPlus, FiCopy, FiTrash2, FiKey, FiX } from 'react-icons/fi';
import api from '../api/axios';

export default function AdminManagedVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPw, setShowPw] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [newVendor, setNewVendor] = useState({ full_name: '', store_name: '', ville: '' });
  const [creating, setCreating] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [resetPwResult, setResetPwResult] = useState(null);
  const [resettingId, setResettingId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/managed-vendors')
      .then(res => setVendors(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newVendor.full_name) return;
    setCreating(true);
    setCreatedCreds(null);
    try {
      const res = await api.post('/admin/managed-vendors', newVendor);
      setCreatedCreds(res.data);
      setNewVendor({ full_name: '', store_name: '', ville: '' });
      setShowForm(false);
      load();
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.error || err.message));
    }
    setCreating(false);
  };

  const handleResetPassword = async (v) => {
    if (!confirm(`Reinitialiser le mot de passe de "${v.full_name}" ?`)) return;
    setResettingId(v.id);
    try {
      const res = await api.post(`/admin/managed-vendors/${v.id}/reset-password`);
      setResetPwResult(res.data);
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.error || err.message));
    }
    setResettingId(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce vendeur ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/managed-vendors/${id}`);
      load();
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.error || err.message));
    }
    setDeleting(null);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '4px' }}><FiArrowLeft /> Dashboard</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiUser size={28} style={{ color: 'var(--primary)' }} /> Comptes Vendeur
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              {vendors.length} compte{vendors.length > 1 ? 's' : ''} vendeur{vendors.length > 1 ? 's' : ''} cree{vendors.length > 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setCreatedCreds(null); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiPlus size={16} /> Nouveau vendeur
          </button>
        </div>

        {showForm && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Creer un compte vendeur</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Nom complet *</label>
                  <input value={newVendor.full_name} onChange={e => setNewVendor({ ...newVendor, full_name: e.target.value })} className="form-control" placeholder="Ex: Vendeur 1" required />
                </div>
                <div className="form-group">
                  <label>Nom de boutique</label>
                  <input value={newVendor.store_name} onChange={e => setNewVendor({ ...newVendor, store_name: e.target.value })} className="form-control" placeholder="Ex: Tech Store" />
                </div>
                <div className="form-group">
                  <label>Ville</label>
                  <input value={newVendor.ville} onChange={e => setNewVendor({ ...newVendor, ville: e.target.value })} className="form-control" placeholder="Ex: Casablanca" list="villes" />
                  <datalist id="villes">
                    <option value="Casablanca" /><option value="Rabat" /><option value="Marrakech" />
                    <option value="Fès" /><option value="Tanger" /><option value="Agadir" />
                    <option value="Meknès" /><option value="Oujda" /><option value="El Jadida" />
                  </datalist>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creation...' : 'Creer le compte'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        )}

        {resetPwResult && (
          <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '24px', position: 'relative' }}>
            <button onClick={() => setResetPwResult(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={16} /></button>
            <h3 style={{ color: '#3b82f6', marginBottom: '8px' }}>Mot de passe reinitialise</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Nouveau mot de passe pour <strong>{resetPwResult.full_name}</strong> :</p>
            <div style={{ fontFamily: 'monospace', fontSize: '14px', background: 'rgba(0,0,0,0.05)', padding: '12px', borderRadius: '8px', lineHeight: '2' }}>
              <div><strong>Email :</strong> {resetPwResult.email} <button onClick={() => copy(resetPwResult.email)} className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: '11px' }}><FiCopy size={12} /></button></div>
              <div><strong>Mot de passe :</strong> <span style={{ color: '#3b82f6', fontWeight: 700 }}>{resetPwResult.password}</span> <button onClick={() => copy(resetPwResult.password)} className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: '11px' }}><FiCopy size={12} /></button></div>
            </div>
          </div>
        )}

        {createdCreds && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ color: '#10b981', marginBottom: '8px' }}>Compte cree avec succes</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Copiez les identifiants ci-dessous :</p>
            <div style={{ fontFamily: 'monospace', fontSize: '14px', background: 'rgba(0,0,0,0.05)', padding: '12px', borderRadius: '8px', lineHeight: '2' }}>
              <div><strong>Email :</strong> {createdCreds.email} <button onClick={() => copy(createdCreds.email)} className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: '11px' }}><FiCopy size={12} /></button></div>
              <div><strong>Mot de passe :</strong> <span style={{ color: '#3b82f6', fontWeight: 700 }}>{createdCreds.password}</span> <button onClick={() => copy(createdCreds.password)} className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: '11px' }}><FiCopy size={12} /></button></div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Conservez ces identifiants. Ils ne seront plus affiches.</div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}><div className="spinner" /></div>
        ) : vendors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <FiUser size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Aucun compte vendeur cree.</p>
            <p style={{ fontSize: '13px' }}>Cliquez sur "Nouveau vendeur" pour en creer un.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Boutique</th>
                  <th>Email</th>
                  <th>Ville</th>
                  <th>Cree le</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.full_name}</td>
                    <td>{v.store_name || '-'}</td>
                    <td style={{ fontSize: '12px' }}>{v.email}</td>
                    <td>{v.ville || '-'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(v.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleResetPassword(v)} disabled={resettingId === v.id} className="btn btn-ghost" style={{ color: '#3b82f6', padding: '4px 8px' }} title="Reinitialiser mot de passe">
                          <FiKey size={15} />
                        </button>
                        <button onClick={() => handleDelete(v.id)} disabled={deleting === v.id} className="btn btn-ghost" style={{ color: '#ef4444', padding: '4px 8px' }} title="Supprimer">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
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