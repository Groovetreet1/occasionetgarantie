import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiUpload } from 'react-icons/fi';
import api from '../api/axios';
import AnimatedBg from '../components/AnimatedBg';

const stateOptions = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'comme_neuf', label: 'Comme neuf' },
  { value: 'tres_bon', label: 'Très bon état' },
  { value: 'bon', label: 'Bon état' },
  { value: 'acceptable', label: 'État acceptable' },
];

const defaultSpecs = { Ecran: '', Processeur: '', RAM: '', Stockage: '', Batterie: '', Couleur: '' };

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', old_price: '', category_id: 1,
    brand: '', state: 'tres_bon', warranty: '12 mois', stock: 1, featured: false,
    image: '', specs: { ...defaultSpecs },
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/id/${id}`).then((res) => {
        const p = res.data;
        let specs = typeof p.specs === 'string' ? JSON.parse(p.specs) : (p.specs || { ...defaultSpecs });
        setForm({
          name: p.name || '', slug: p.slug || '', description: p.description || '',
          price: p.price || '', old_price: p.old_price || '', category_id: p.category_id || 1,
          brand: p.brand || '', state: p.state || 'tres_bon', warranty: p.warranty || '12 mois',
          stock: p.stock || 1, featured: p.featured || false, image: p.image || '', specs,
        });
      }).catch(() => navigate('/admin'));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSpecChange = (key, value) => {
    setForm((f) => ({ ...f, specs: { ...f.specs, [key]: value } }));
  };

  const addSpecField = () => {
    const key = prompt('Nom de la caractéristique :');
    if (key && !(key in form.specs)) {
      setForm((f) => ({ ...f, specs: { ...f.specs, [key]: '' } }));
    }
  };

  const removeSpecField = (key) => {
    const { [key]: _, ...rest } = form.specs;
    setForm((f) => ({ ...f, specs: rest }));
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/upload', fd);
      setForm((f) => ({ ...f, image: data.url }));
    } catch (err) {
      alert('Erreur upload: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const generateSlug = () => {
    const slug = form.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setForm((f) => ({ ...f, slug }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        old_price: form.old_price ? parseFloat(form.old_price) : null,
        stock: parseInt(form.stock),
        specs: form.specs,
      };
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/admin');
    } catch (err) {
      alert('Erreur : ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section style={{ paddingTop: '100px', paddingBottom: '60px', position: 'relative' }}>
      <AnimatedBg />
      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
        <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '16px' }}>
          <FiArrowLeft /> Retour au dashboard
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '32px' }}>
          {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Nom du produit</label>
              <input name="name" value={form.name} onChange={handleChange} required onBlur={(e) => { if (!form.slug) generateSlug(); }} />
            </div>
            <div className="form-group">
              <label>Slug <button type="button" onClick={generateSlug} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px' }}>Générer</button></label>
              <input name="slug" value={form.slug} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Marque</label>
              <input name="brand" value={form.brand} onChange={handleChange} placeholder="Apple, Samsung..." />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '15px', resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label>Prix (DH)</label>
              <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Ancien prix (DH)</label>
              <input name="old_price" type="number" step="0.01" value={form.old_price} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Catégorie</label>
              <select name="category_id" value={form.category_id} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '15px' }}>
                <option value={1}>Smartphones</option>
                <option value={2}>Tablettes</option>
                <option value={3}>Ordinateurs</option>
                <option value={4}>Accessoires</option>
                <option value={5}>Gaming</option>
              </select>
            </div>
            <div className="form-group">
              <label>État</label>
              <select name="state" value={form.state} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '15px' }}>
                {stateOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Garantie</label>
              <input name="warranty" value={form.warranty} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Image</label>
              {form.image && (
                <div style={{ marginBottom: '8px' }}>
                  <img src={`http://localhost:5000${form.image}`} alt="Preview" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp,image/avif" style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '13px' }} />
                <button type="button" onClick={handleUpload} className="btn btn-secondary" style={{ padding: '10px 16px' }} disabled={uploading}>
                  <FiUpload size={16} /> {uploading ? '...' : 'Upload'}
                </button>
              </div>
              <input name="image" value={form.image} onChange={handleChange} placeholder="Ou URL directe" style={{ marginTop: '8px', width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '13px' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '30px' }}>
              <input name="featured" type="checkbox" checked={form.featured} onChange={handleChange} id="featured" style={{ width: '18px', height: '18px' }} />
              <label htmlFor="featured" style={{ margin: 0, cursor: 'pointer' }}>Produit à la une</label>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Fiche technique</h3>
              <button type="button" onClick={addSpecField} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>+ Ajouter</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {Object.entries(form.specs).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    value={key}
                    onChange={(e) => {
                      const { [key]: _, ...rest } = form.specs;
                      setForm((f) => ({ ...f, specs: { ...rest, [e.target.value]: val } }));
                    }}
                    style={{ width: '40%', padding: '8px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '13px' }}
                  />
                  <input
                    value={val}
                    onChange={(e) => handleSpecChange(key, e.target.value)}
                    style={{ width: '40%', padding: '8px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '13px' }}
                    placeholder="Valeur"
                  />
                  <button type="button" onClick={() => removeSpecField(key)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '18px' }}>×</button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', fontSize: '16px', padding: '16px' }} disabled={saving}>
            <FiSave size={18} /> {saving ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer le produit')}
          </button>
        </form>
      </div>
    </section>
  );
}
