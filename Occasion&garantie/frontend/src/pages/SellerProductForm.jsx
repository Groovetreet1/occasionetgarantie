import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';

const categories = [
  { id: 1, name: 'Smartphones' },
  { id: 2, name: 'Tablettes' },
  { id: 3, name: 'Ordinateurs' },
  { id: 4, name: 'Accessoires' },
  { id: 5, name: 'Gaming' },
];

const states = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'comme_neuf', label: 'Comme neuf' },
  { value: 'tres_bon', label: 'Très bon état' },
  { value: 'bon', label: 'Bon état' },
  { value: 'acceptable', label: 'Acceptable' },
];

const defaultSpecs = {
  'Ecran': '',
  'Processeur': '',
  'RAM': '',
  'Stockage': '',
  'Appareil': '',
  'Batterie': '',
};

export default function SellerProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', old_price: '',
    category_id: '1', brand: '', state: 'tres_bon', warranty: '6 mois',
    image: '', specs: { ...defaultSpecs },
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/id/${id}`).then(res => {
        const p = res.data;
        setForm({
          name: p.name || '', slug: p.slug || '', description: p.description || '',
          price: p.price || '', old_price: p.old_price || '',
          category_id: String(p.category_id || '1'), brand: p.brand || '',
          state: p.state || 'tres_bon', warranty: p.warranty || '6 mois',
          image: p.image || '', specs: p.specs || { ...defaultSpecs },
        });
      }).catch(() => navigate('/seller'));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'name') {
      setForm(prev => ({ ...prev, slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
    }
  };

  const handleSpecChange = (key, value) => {
    setForm(prev => ({ ...prev, specs: { ...prev.specs, [key]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.price) {
      setError('Le nom et le prix sont requis.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        old_price: form.old_price ? Number(form.old_price) : null,
        category_id: Number(form.category_id),
        stock: 1,
        active: true,
      };

      if (isEdit) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/seller');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="seller-product-form">
      <div className="container">
        <div className="dashboard-header">
          <h1>{isEdit ? 'Modifier' : 'Nouveau'} produit</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="card admin-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Nom du produit *</label>
              <input name="name" value={form.name} onChange={handleChange} className="form-control" placeholder="iPhone 12 64Go" />
            </div>
            <div className="form-group">
              <label>Slug (URL)</label>
              <input name="slug" value={form.slug} onChange={handleChange} className="form-control" placeholder="iphone-12-64go" />
            </div>
            <div className="form-group">
              <label>Prix (DH) *</label>
              <input name="price" type="number" value={form.price} onChange={handleChange} className="form-control" placeholder="3500" />
            </div>
            <div className="form-group">
              <label>Ancien prix (DH)</label>
              <input name="old_price" type="number" value={form.old_price} onChange={handleChange} className="form-control" placeholder="5500" />
            </div>
            <div className="form-group">
              <label>Catégorie</label>
              <select name="category_id" value={form.category_id} onChange={handleChange} className="form-control">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Marque</label>
              <input name="brand" value={form.brand} onChange={handleChange} className="form-control" placeholder="Apple, Samsung..." />
            </div>
            <div className="form-group">
              <label>État</label>
              <select name="state" value={form.state} onChange={handleChange} className="form-control">
                {states.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Garantie</label>
              <input name="warranty" value={form.warranty} onChange={handleChange} className="form-control" />
            </div>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="form-control" rows={4} placeholder="Décrivez l'état du produit..." />
          </div>

          <div className="form-group">
            <label>Image (nom du fichier)</label>
            <input name="image" value={form.image} onChange={handleChange} className="form-control" placeholder="iphone-12.jpg" />
            <small className="text-secondary">Mettez le fichier dans /uploads/products/</small>
          </div>

          <h3 style={{ marginTop: 24 }}>Caractéristiques</h3>
          <div className="form-grid">
            {Object.entries(defaultSpecs).map(([key]) => (
              <div key={key} className="form-group">
                <label>{key}</label>
                <input value={form.specs[key] || ''} onChange={e => handleSpecChange(key, e.target.value)}
                  className="form-control" placeholder={`Ex: 6.1" Super Retina`} />
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/seller')}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Publier'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
