import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import api from '../api/axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
  'Ecran': '', 'Processeur': '', 'RAM': '', 'Stockage': '', 'Appareil': '', 'Batterie': '',
};

export default function SellerProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', old_price: '',
    category_id: '1', brand: '', state: 'tres_bon', warranty: '6 mois',
    specs: { ...defaultSpecs },
  });
  const [mainImage, setMainImage] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploading, setUploading] = useState(false);
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
          specs: p.specs || { ...defaultSpecs },
        });
        if (p.image) setExistingImages([p.image]);
        if (p.gallery && Array.isArray(p.gallery)) {
          setExistingImages(prev => [...new Set([...prev, ...p.gallery])]);
        }
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setGallery(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeGalleryFile = (index) => {
    setGallery(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (img) => {
    setExistingImages(prev => prev.filter(i => i !== img));
  };

  const uploadImages = async () => {
    if (gallery.length === 0) return { image: null, gallery: [] };

    setUploading(true);
    const formData = new FormData();
    gallery.forEach(file => formData.append('images', file));

    try {
      const res = await api.post('/upload?single=false', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const allExisting = [...existingImages, ...res.data.urls];
      return { image: allExisting[0], gallery: allExisting };
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Erreur upload');
    } finally {
      setUploading(false);
    }
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
      let image = existingImages[0] || null;
      let galleryUrls = existingImages;

      if (gallery.length > 0) {
        const uploaded = await uploadImages();
        image = uploaded.image || image;
        galleryUrls = uploaded.gallery;
      }

      const payload = {
        ...form,
        price: Number(form.price),
        old_price: form.old_price ? Number(form.old_price) : null,
        category_id: Number(form.category_id),
        image,
        gallery: galleryUrls,
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
          {/* Upload zone */}
          <div className="form-group">
            <label>Photos du produit</label>
            <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
              <FiUpload size={28} />
              <p>Cliquez pour ajouter des photos</p>
              <small>JPG, PNG, WebP - Max 5MB par photo</small>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

            {(existingImages.length > 0 || gallery.length > 0) && (
              <div className="upload-preview-grid">
                {existingImages.map((img, i) => (
                  <div key={`e-${i}`} className="upload-preview-item">
                    <img src={`${API_BASE}/uploads/${img}`} alt="" />
                    <button type="button" className="upload-remove" onClick={() => removeExistingImage(img)}><FiX /></button>
                  </div>
                ))}
                {gallery.map((file, i) => (
                  <div key={`n-${i}`} className="upload-preview-item">
                    <img src={URL.createObjectURL(file)} alt="" />
                    <button type="button" className="upload-remove" onClick={() => removeGalleryFile(i)}><FiX /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Nom du produit *</label>
              <input name="name" value={form.name} onChange={handleChange} className="form-control" placeholder="iPhone 12 64Go" />
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

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="form-control" rows={4} placeholder="Décrivez l'état du produit, les éventuels défauts, accessoires inclus..." />
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
            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
              {uploading ? 'Upload des photos...' : saving ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Publier'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
