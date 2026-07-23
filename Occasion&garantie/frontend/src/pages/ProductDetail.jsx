import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FiArrowLeft, FiShoppingBag, FiShield, FiCheck, FiMonitor, FiCpu, FiHardDrive, FiBattery, FiCamera, FiDroplet, FiX, FiChevronLeft, FiChevronRight, FiLock, FiUserPlus, FiUser } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';
import { MdPayment } from 'react-icons/md';
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
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [reserveMsg, setReserveMsg] = useState('');
  const [bankInfo, setBankInfo] = useState(null);
  const [reservationId, setReservationId] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

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
        <h2>Produit introuvable</h2>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: '16px' }}>
          <FiArrowLeft /> Retour aux produits
        </Link>
      </div>
    </div>
  );

  const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const imgUrl = product.image ? `${API_BASE}/uploads/${product.image}` : null;
  const waMsg = encodeURIComponent(`Bonjour ! Je suis intéressé(e) par : ${product.name} (${formatPrice(product.price)}) - ${window.location.href}`);
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

  const handleReserve = async () => {
    if (!user) return;
    setReserving(true);
    setReserveMsg('');
    try {
      const { data } = await api.post('/reservations', { productId: product.id });
      setReserved(true);
      setReservationId(data.reservationId);
      setBankInfo(data.bank);
      setReserveMsg(data.message);
    } catch (err) {
      setReserveMsg(err.response?.data?.message || 'Erreur lors de la reservation.');
    } finally {
      setReserving(false);
    }
  };

  const handleUploadScreenshot = async (e) => {
    const file = e.target.files[0];
    if (!file || !reservationId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('screenshot', file);
    try {
      await api.post(`/reservations/${reservationId}/screenshot`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadDone(true);
    } catch (err) {
      setReserveMsg(err.response?.data?.message || 'Erreur lors de l\'upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <section className="product-detail-section">
        <div className="container">
          <Link to="/products" className="btn btn-ghost" style={{ marginBottom: '24px' }}>
            <FiArrowLeft /> Retour aux produits
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
                  <FiShield size={14} /> Garantie {product.warranty}
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
                  {stateLabels[product.state] || product.state}
                </span>
                <span className="product-detail-tag verified">
                  <FiCheck size={12} /> Vérifié
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
                  <h3>Fiche technique</h3>
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

              {product.seller_name && (
                <div className="product-seller-info">
                  <h4>Vendu par</h4>
                  <Link to={`/seller/${product.seller_id || product.seller_id_}`} className="seller-badge">
                    <div className="seller-avatar-mini">
                      {product.seller_logo ? <img src={`/uploads/avatars/${product.seller_logo}`} alt="" /> : <FiUser size={18} />}
                    </div>
                    <div>
                      <strong>{product.seller_name}</strong>
                      <small>Voir profil du vendeur</small>
                    </div>
                  </Link>
                </div>
              )}

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  width: '100%',
                  background: 'var(--gradient)',
                  color: 'white',
                  fontSize: '18px',
                  padding: '16px 36px',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-glow)',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--gradient-hover)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--gradient)'}
              >
                <BsWhatsapp size={22} /> Acheter via WhatsApp
              </a>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>
                Réponse sous 24h | Paiement sécurisé
              </p>

              {product.price >= 500 && (
                <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MdPayment size={20} style={{ color: 'var(--primary)' }} /> Reserver ce produit
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Versez seulement <strong>200 DH</strong> pour reserver ce produit. Le montant sera deduit du prix total.
                </p>
                {!user ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center', fontSize: '14px' }}>
                      <FiLock size={16} /> Connectez-vous pour reserver
                    </Link>
                    <Link to="/signup" className="btn btn-secondary" style={{ justifyContent: 'center', fontSize: '13px' }}>
                      <FiUserPlus size={16} /> Creer un compte
                    </Link>
                  </div>
                ) : !reserved ? (
                  <>
                    {reserveMsg && <div className="alert alert-error">{reserveMsg}</div>}
                    <button
                      onClick={handleReserve}
                      disabled={reserving}
                      className="btn"
                      style={{
                        width: '100%',
                        background: 'var(--success)',
                        color: 'white',
                        justifyContent: 'center',
                        fontSize: '15px',
                        padding: '14px',
                      }}
                    >
                      {reserving ? 'Reservation...' : 'Reserver (200 DH)'}
                    </button>
                  </>
                ) : uploadDone ? (
                  <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiCheck size={18} /> Screenshot envoye. Reservation confirmee.
                  </div>
                ) : (
                  <>
                    <div style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius)',
                      padding: '16px',
                      marginBottom: '16px',
                    }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                        Virement bancaire
                      </h4>
                      <table className="product-detail-table" style={{ width: '100%', fontSize: '13px' }}>
                        <tbody>
                          {bankInfo && (
                            <>
                              <tr><td style={{ color: 'var(--text-muted)', padding: '4px 8px 4px 0', whiteSpace: 'nowrap' }}>Banque</td>
                                <td style={{ fontWeight: 600 }}>{bankInfo.bank}</td></tr>
                              <tr><td style={{ color: 'var(--text-muted)', padding: '4px 8px 4px 0', whiteSpace: 'nowrap' }}>Titulaire</td>
                                <td style={{ fontWeight: 600 }}>{bankInfo.holder}</td></tr>
                              <tr><td style={{ color: 'var(--text-muted)', padding: '4px 8px 4px 0', whiteSpace: 'nowrap' }}>RIB</td>
                                <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px' }}>{bankInfo.rib}</td></tr>
                              <tr><td style={{ color: 'var(--text-muted)', padding: '4px 8px 4px 0', whiteSpace: 'nowrap' }}>Montant</td>
                                <td style={{ fontWeight: 600, color: 'var(--success)' }}>{bankInfo.amount} DH</td></tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      Apres le virement, envoyez la capture d'ecran ci-dessous :
                    </p>
                    <label className="btn" style={{
                      width: '100%', justifyContent: 'center', fontSize: '14px', cursor: 'pointer',
                      background: 'var(--primary)', color: '#000',
                    }}>
                      {uploading ? 'Envoi...' : 'Choisir une photo'}
                      <input type="file" accept="image/*" onChange={handleUploadScreenshot} hidden disabled={uploading} />
                    </label>
                    {reserveMsg && <div className="alert alert-error" style={{ marginTop: '8px' }}>{reserveMsg}</div>}
                  </>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      </section>

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
