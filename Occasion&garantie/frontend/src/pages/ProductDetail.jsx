import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SeoHead from '../components/SeoHead';
import { FiArrowLeft, FiShoppingBag, FiShield, FiCheck, FiMonitor, FiCpu, FiHardDrive, FiBattery, FiCamera, FiDroplet, FiX, FiChevronLeft, FiChevronRight, FiUpload, FiCreditCard, FiCopy } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const stateLabels = {
  neuf: 'Neuf',
  comme_neuf: 'Comme neuf',
  tres_bon: 'Très bon état',
  bon: 'Bon état',
  acceptable: 'État acceptable',
};

const specIcons = {
  Ecran: FiMonitor,
  Processeur: FiCpu,
  RAM: FiHardDrive,
  Stockage: FiHardDrive,
  Batterie: FiBattery,
  Appareil: FiCamera,
  Couleur: FiDroplet,
  GPU: FiMonitor,
  OS: FiMonitor,
};

const WHATSAPP_NUMBER = '212669017295';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showDeposit, setShowDeposit] = useState(false);
  const [bankInfo, setBankInfo] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositDone, setDepositDone] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [copied, setCopied] = useState('');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    }).catch(() => {});
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    api.get(`/products/${slug}`)
      .then((res) => setProduct(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="auth-page"><div className="spinner" /></div>;

  if (!product) return (
    <div className="auth-page">
      <div className="empty-state">
        <div className="icon"><FiShoppingBag size={48} /></div>
        <h2>{t('Produit introuvable')}</h2>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: '16px' }}>
          <FiArrowLeft /> {t('Retour aux produits')}
        </Link>
      </div>
    </div>
  );

  const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const imgUrl = product.image ? `${API_BASE}/uploads/${product.image}` : null;
  const waMsg = encodeURIComponent(`${t('Bonjour ! Je suis intéressé(e) par')} : ${product.name} (${formatPrice(product.price)}) - ${window.location.href}`);
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;
  const specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : (product.specs || {});

  const allImages = [];
  if (product.image) allImages.push(product.image);
  if (product.gallery && Array.isArray(product.gallery)) {
    product.gallery.forEach((img) => {
      if (img !== product.image && !allImages.includes(img)) allImages.push(img);
    });
  }

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setSelectedImage(allImages[index]);
  };

  const closeLightbox = () => setSelectedImage(null);

  const prevImage = () => {
    setLightboxIndex((i) => (i - 1 + allImages.length) % allImages.length);
  };

  const nextImage = () => {
    setLightboxIndex((i) => (i + 1) % allImages.length);
  };

  const openDeposit = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await api.get('/deposits/bank-info');
      setBankInfo(res.data);
    } catch { setBankInfo(null); }
    setShowDeposit(true);
  };

  const handleDeposit = async () => {
    if (!screenshot) { setDepositError(t("Veuillez sélectionner une capture d'écran du virement.")); return; }
    setDepositError('');
    setDepositLoading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', screenshot);
      formData.append('productSlug', slug);
      await api.post('/deposits', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDepositDone(true);
    } catch (err) {
      setDepositError(err.response?.data?.message || t("Erreur lors de l'envoi."));
    } finally {
      setDepositLoading(false);
    }
  };

  return (
    <>
      <SeoHead
        title={product?.name}
        description={`${product?.name} – ${product?.description?.slice(0, 150)}. ${product?.price} DH. Livraison Casablanca, Bouskoura, Berrechid.`}
        image={product?.image ? `${API_BASE}/uploads/${product.image}` : undefined}
        url={`${window.location.origin}/products/${product?.slug}`}
      />
      <section className="product-detail-section">
        <div className="container">
          <Link to="/products" className="btn btn-ghost" style={{ marginBottom: '24px' }}>
            <FiArrowLeft /> {t('Retour aux produits')}
          </Link>

          <div className="product-detail-grid">
            <div>
              <div className="product-detail-image" style={{ cursor: allImages.length > 0 ? 'pointer' : 'default' }} onClick={() => allImages.length > 0 && openLightbox(0)}>
                {imgUrl ? (
                  <img src={`${API_BASE}/uploads/${product.image}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <FiShoppingBag size={80} style={{ opacity: 0.15 }} />
                )}
                <span className="product-badge badge-warranty" style={{ bottom: '12px', left: '12px', top: 'auto', right: 'auto', fontSize: '14px', padding: '8px 16px' }}>
                  <FiShield size={14} /> {t('Garantie')} {product.warranty}
                </span>
              </div>

              {allImages.length > 1 && (
                <div className="product-detail-thumbs">
                  {allImages.map((img, i) => (
                    <div key={i} onClick={() => openLightbox(i)} className={`product-detail-thumb${i === 0 ? ' active' : ''}`}>
                      <img src={`${API_BASE}/uploads/${img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="product-detail-category">{product.category_name}</div>
              <h1 className="product-detail-name">{product.name}</h1>

              <div className="product-detail-price">
                <span className="price-current">{formatPrice(product.price)}</span>
                {product.old_price && <span className="price-old">{formatPrice(product.old_price)}</span>}
              </div>

              <div className="product-detail-tags">
                <span className="product-detail-tag state">
                  {t(stateLabels[product.state]) || product.state}
                </span>
                <span className="product-detail-tag verified">
                  <FiCheck size={12} /> {t('Vérifié')}
                </span>
                {product.brand && (
                  <span className="product-detail-tag brand">
                    {product.brand}
                  </span>
                )}
              </div>

              <p className="product-detail-desc">
                {product.description}
              </p>

              {specs && Object.keys(specs).length > 0 && (
                <div className="product-detail-specs">
                  <h3>{t('Fiche technique')}</h3>
                  <div className="product-detail-specs-grid">
                    {Object.entries(specs).map(([key, val]) => {
                      const Icon = specIcons[key] || FiCpu;
                      return (
                        <div key={key} style={{
                          padding: '12px 16px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}>
                          <Icon size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key}</div>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{val}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
              >
                <BsWhatsapp size={22} /> {t('Acheter via WhatsApp')}
              </a>
              {product.price > 500 && (
                <button onClick={openDeposit} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', gap: '8px', marginTop: '12px' }}>
                  <FiCreditCard size={18} /> {t('Réserver avec 200 DH')}
                </button>
              )}
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>
                {t('Réponse sous 24h | Paiement sécurisé')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {showDeposit && (
        <div className="lightbox-overlay" onClick={() => { if (!depositLoading) setShowDeposit(false); }}>
          <div className="auth-card" style={{ maxWidth: '480px', margin: '40px auto', padding: '32px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setShowDeposit(false)}><FiX size={20} /></button>

            {!depositDone ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <FiCreditCard size={36} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                  <h2>{t('Réserver avec 200 DH')}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {t("Versez 200 DH pour confirmer votre réservation sur")} <strong>{product.name}</strong>
                  </p>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>RIB</p>
                    <button onClick={() => copyToClipboard(bankInfo?.rib || '', 'rib')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '2px 6px', borderRadius: '6px' }}>
                      <FiCopy size={14} /> {copied === 'rib' ? 'Copié ✓' : 'Copier'}
                    </button>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '14px', wordBreak: 'break-all', userSelect: 'all' }}>{bankInfo?.rib || '...'}</p>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px' }}>
                    <div>
                      <p style={{ color: 'var(--text-muted)' }}>{t('Banque')}</p>
                      <p style={{ fontWeight: 600 }}>{bankInfo?.bank || '...'}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-muted)' }}>{t('Bénéficiaire')}</p>
                      <p style={{ fontWeight: 600 }}>{bankInfo?.holder || '...'}</p>
                    </div>
                  </div>
                  <button onClick={() => copyToClipboard(`RIB: ${bankInfo?.rib}\nBanque: ${bankInfo?.bank}\nBénéficiaire: ${bankInfo?.holder}` || '', 'all')} style={{ width: '100%', marginTop: '10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', padding: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <FiCopy size={14} /> {copied === 'all' ? 'Tout copié ✓' : t('Tout copier')}
                  </button>
                </div>

                <div className="form-group">
                  <label><FiUpload size={14} /> {t("Capture du virement")}</label>
                  <input type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files[0])} style={{ fontSize: '13px' }} />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{t("Photo ou capture d'écran du virement effectué")}</p>
                </div>

                {depositError && <div className="alert alert-error">{depositError}</div>}

                <button onClick={handleDeposit} className="form-submit" disabled={depositLoading}>
                  {depositLoading ? t('Envoi...') : t('Confirmer le paiement')}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <FiCheck size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
                <h2>{t('Paiement confirmé !')}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {t("Votre acompte de 200 DH a été enregistré. Le vendeur vous contactera sous 24h.")}
                </p>
                <button onClick={() => setShowDeposit(false)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {t('Fermer')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}><FiX size={24} /></button>
          <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}><FiChevronLeft size={28} /></button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={`${API_BASE}/uploads/${allImages[lightboxIndex]}`} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }} />
          </div>
          <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}><FiChevronRight size={28} /></button>
          <div className="lightbox-counter">{lightboxIndex + 1} / {allImages.length}</div>
        </div>
      )}
    </>
  );
}
