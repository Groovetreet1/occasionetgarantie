import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUpload, FiX, FiMenu } from 'react-icons/fi';
import api from '../api/axios';
import SellerSidebar from '../components/SellerSidebar';

const API_BASE = import.meta.env.VITE_API_URL || '';

const states = [
  { value: 'neuf', label: 'Neuf', desc: 'Jamais utilisé, emballage d\'origine' },
  { value: 'comme_neuf', label: 'Comme neuf', desc: 'Utilisé quelques jours, sans défaut' },
  { value: 'tres_bon', label: 'Très bon état', desc: 'Légères traces d\'utilisation' },
  { value: 'bon', label: 'Bon état', desc: 'Quelques rayures visibles' },
  { value: 'acceptable', label: 'Acceptable', desc: 'Défauts esthétiques, fonctionne parfaitement' },
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
  const [gallery, setGallery] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('sellerSidebar');
    if (saved !== null) setSidebarOpen(saved === '1');
  }, []);

  useEffect(() => {
    localStorage.setItem('sellerSidebar', sidebarOpen ? '1' : '0');
  }, [sidebarOpen]);

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
    <div className="seller-layout">
      <SellerSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className={`seller-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="seller-topbar">
          <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu size={20} />
          </button>
          <div className="seller-topbar-title">
            <h1>{isEdit ? 'Modifier le produit' : 'Nouvelle annonce'}</h1>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('/seller')}>← Retour</button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="seller-content">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="seller-form">
            <div className="seller-form-card">
              <h3>Photos</h3>
              <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                <FiUpload size={28} />
                <p>Ajoutez des photos du produit</p>
                <small>JPG, PNG, WebP - 5MB max par photo</small>
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

            <div className="seller-form-card">
              <h3>Informations</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom du produit *</label>
                  <input name="name" value={form.name} onChange={handleChange} className="form-control" placeholder="Ex: iPhone 13 128Go" />
                </div>
                <div className="form-group">
                  <label>Marque</label>
                  <input name="brand" value={form.brand} onChange={handleChange} className="form-control" placeholder="Ex: Apple, Samsung" list="brands" />
                  <datalist id="brands">
                    <option value="Apple" /><option value="Samsung" /><option value="Xiaomi" />
                    <option value="Huawei" /><option value="OnePlus" /><option value="Oppo" />
                    <option value="Google" /><option value="Sony" /><option value="Nokia" />
                  </datalist>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="form-control form-textarea"
                  rows={5} placeholder="Décrivez l'état du produit..." />
                <small className="text-secondary">{form.description.length} caractères</small>
              </div>
            </div>

            <div className="seller-form-card">
              <h3>Prix & Catégorie</h3>
              <div className="form-row three">
                <div className="form-group">
                  <label>Prix (DH) *</label>
                  <div className="input-with-suffix"><input name="price" type="number" value={form.price} onChange={handleChange} className="form-control" placeholder="3500" /><span>DH</span></div>
                </div>
                <div className="form-group">
                  <label>Ancien prix (DH)</label>
                  <div className="input-with-suffix"><input name="old_price" type="number" value={form.old_price} onChange={handleChange} className="form-control" placeholder="5500" /><span>DH</span></div>
                </div>
                <div className="form-group">
                  <label>Catégorie</label>
                  <select name="category_id" value={form.category_id} onChange={handleChange} className="form-control">
                    <option value="1">Smartphones</option>
                    <option value="2">Tablettes</option>
                    <option value="3">Ordinateurs</option>
                    <option value="4">Accessoires</option>
                    <option value="5">Gaming</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="seller-form-card">
              <h3>État & Garantie</h3>
              <div className="state-grid">
                {states.map(s => (
                  <label key={s.value} className={`state-option ${form.state === s.value ? 'active' : ''}`}>
                    <input type="radio" name="state" value={s.value} checked={form.state === s.value} onChange={handleChange} />
                    <strong>{s.label}</strong>
                    <span>{s.desc}</span>
                  </label>
                ))}
              </div>
              <div className="form-row" style={{ marginTop: 16 }}>
                <div className="form-group">
                  <label>Garantie</label>
                  <select name="warranty" value={form.warranty} onChange={handleChange} className="form-control">
                    <option value="1 mois">1 mois</option>
                    <option value="3 mois">3 mois</option>
                    <option value="6 mois">6 mois</option>
                    <option value="12 mois">12 mois</option>
                    <option value="24 mois">24 mois</option>
                    <option value="Sans garantie">Sans garantie</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="seller-form-card">
              <h3>Caractéristiques techniques</h3>
              <div className="form-row two">
                {Object.entries(defaultSpecs).map(([key]) => (
                  <div key={key} className="form-group">
                    <label>{key}</label>
                    <input value={form.specs[key] || ''} onChange={e => handleSpecChange(key, e.target.value)}
                      className="form-control" placeholder={`Ex: 6.1" Super Retina`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="seller-form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/seller')}>Annuler</button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving || uploading}>
                {uploading ? 'Upload...' : saving ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Publier l\'annonce'}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
