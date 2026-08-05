import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { FiArrowLeft, FiShoppingBag, FiShield, FiCheck, FiMonitor, FiCpu, FiHardDrive, FiBattery, FiCamera, FiDroplet, FiX, FiChevronLeft, FiChevronRight, FiUser, FiMessageCircle, FiStar, FiSmartphone, FiMapPin, FiLock, FiGrid } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SellerRating from '../components/SellerRating';

const stateLabels = {
  neuf: 'products.stateNeuf',
  comme_neuf: 'products.stateCommeNeuf',
  tres_bon: 'products.stateTresBon',
  bon: 'products.stateBon',
  acceptable: 'products.stateAcceptableFull',
};

const specIcons = {
  Ecran: FiMonitor, Processeur: FiCpu, RAM: FiHardDrive,
  Stockage: FiHardDrive, Batterie: FiBattery, Appareil: FiCamera,
  Couleur: FiDroplet, GPU: FiMonitor, OS: FiMonitor,
};

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showReprise, setShowReprise] = useState(false);
  const [repBrand, setRepBrand] = useState('');
  const [repModel, setRepModel] = useState('');
  const [repImei, setRepImei] = useState('');
  const [repNotes, setRepNotes] = useState('');
  const [repPhotos, setRepPhotos] = useState({});
  const [repStep, setRepStep] = useState(0);
  const [submittingRep, setSubmittingRep] = useState(false);
  const [repDone, setRepDone] = useState(false);
  const [vendorReprises, setVendorReprises] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [showNegotiate, setShowNegotiate] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [negotiating, setNegotiating] = useState(false);
  const [negDone, setNegDone] = useState(false);
  const [negError, setNegError] = useState('');
  const repFileRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    api.get(`/products/${slug}`)
      .then((res) => setProduct(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product || !user) return;
    if (user.role === 'seller' && user.id === product.seller_id) {
      api.get(`/reprises?product_id=${product.id}`).then(res => {
        setVendorReprises(Array.isArray(res.data) ? res.data.filter(r => String(r.product_id) === String(product.id)) : []);
      }).catch(() => {});
    }
  }, [product, user]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/products', { params: { category: product.category_name, limit: 6 } });
        let list = (data.products || []).filter(p => String(p.id) !== String(product.id));
        if (list.length < 4) {
          const { data: d2 } = await api.get('/products', { params: { seller: product.seller_id, limit: 6 } });
          const extra = (d2.products || []).filter(p => String(p.id) !== String(product.id) && !list.some(x => String(x.id) === String(p.id)));
          list = [...list, ...extra];
        }
        if (!cancelled) setSimilar(list.slice(0, 4));
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, [product]);

  const handleStartChat = async () => {
    if (!user) return navigate('/login');
    if (!product.seller_id) return;
    try {
      const { data } = await api.post('/chat/conversations', {
        sellerId: product.seller_id,
        productId: product.id,
        productName: product.name,
      });
      navigate(`/messenger/${data.id}`);
    } catch (err) {
      alert(err.response?.data?.message || t('products.errorGeneric'));
    }
  };

  if (loading) return <div className="auth-page"><div className="spinner" /></div>;

  if (!product) return (
    <div className="auth-page">
      <div className="empty-state">
        <div className="icon"><FiShoppingBag size={48} /></div>
        <h2>{t('products.notFound')}</h2>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: '16px' }}>
          <FiArrowLeft /> {t('products.backToProducts')}
        </Link>
      </div>
    </div>
  );

  const repSteps = [
    { key: 'front', label: t('products.repriseFront'), hint: t('products.repriseFrontHint') },
    { key: 'back', label: t('products.repriseBack'), hint: t('products.repriseBackHint') },
    { key: 'side', label: t('products.repriseSide'), hint: t('products.repriseSideHint') },
    { key: 'screen', label: t('products.repriseScreen'), hint: t('products.repriseScreenHint') },
  ];
  const repAllDone = Object.keys(repPhotos).length === repSteps.length;

  const handleRepPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const key = repSteps[repStep].key;
    setRepPhotos(p => ({ ...p, [key]: file }));
    if (repStep < repSteps.length - 1) setRepStep(s => s + 1);
  };
  const submitReprise = async () => {
    if (!repBrand || !repModel) return;
    setSubmittingRep(true);
    try {
      const fd = new FormData();
      fd.append('brand', repBrand); fd.append('model', repModel);
      fd.append('product_id', product.id);
      if (repImei) fd.append('imei', repImei);
      if (repNotes) fd.append('client_notes', repNotes);
      for (const [k, f] of Object.entries(repPhotos)) fd.append(k, f);
      await api.post('/reprises', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setRepDone(true);
    } catch (e) { alert(e?.response?.data?.message || t('products.sendError')); }
    setSubmittingRep(false);
  };

  const submitNegotiate = async () => {
    if (!user) { navigate('/login'); return; }
    const price = parseFloat(offerPrice);
    if (!price || price <= 0) { setNegError(t('products.enterValidPrice')); return; }
    setNegError('');
    setNegotiating(true);
    try {
      await api.post('/negotiations', { product_id: product.id, offered_price: price, message: offerMessage.trim() || null });
      setNegDone(true);
    } catch (e) {
      setNegError(e?.response?.data?.message || t('products.sendError'));
    }
    setNegotiating(false);
  };

  const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';  const API_BASE = import.meta.env.VITE_API_URL || '';
  let specs = {};
  try { specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : (product.specs || {}); } catch (e) { specs = {}; }

  const allImages = [];
  if (product.image) allImages.push(product.image);
  if (product.gallery && Array.isArray(product.gallery)) {
    product.gallery.forEach((img) => {
      if (img !== product.image && !allImages.includes(img)) allImages.push(img);
    });
  }

  const openLightbox = (i) => { setLightboxIndex(i); setSelectedImage(allImages[i]); };
  const closeLightbox = () => setSelectedImage(null);
  const prevImage = () => setLightboxIndex((i) => (i - 1 + allImages.length) % allImages.length);
  const nextImage = () => setLightboxIndex((i) => (i + 1) % allImages.length);

  const similarBlock = similar.length > 0 ? (
    <div style={{ marginTop: '24px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', background: 'var(--bg-card)' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <FiGrid size={16} style={{ color: 'var(--primary)' }} /> {t('products.similarProducts')}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {similar.map(p => (
          <Link key={p.id} to={`/products/${p.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: 10, background: 'var(--bg-secondary)', textDecoration: 'none', color: 'var(--text)', border: '1px solid transparent', transition: 'all .2s' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}>
            <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {p.image ? <img src={p.image.startsWith('http') ? p.image : `${API_BASE}/uploads/${p.image}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FiShoppingBag size={22} style={{ opacity: 0.2 }} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>
                {formatPrice(p.price)}
                {p.old_price && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: 6 }}>{formatPrice(p.old_price)}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <>
      <section className="product-detail-section">
        <div className="container">
          <Link to="/products" className="btn btn-ghost" style={{ marginBottom: '24px' }}>
            <FiArrowLeft /> {t('products.backToProducts')}
          </Link>

          <div className="product-detail-grid">
            <div>
              <div className="product-detail-image" style={{ cursor: allImages.length > 0 ? 'pointer' : 'default' }} onClick={() => allImages.length > 0 && openLightbox(0)}>
                {product.image ? (
                  <img src={product.image.startsWith('http') ? product.image : `${API_BASE}/uploads/${product.image}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <FiShoppingBag size={80} style={{ opacity: 0.15 }} />
                )}
              </div>
              {allImages.length > 1 && (
                <div className="product-detail-thumbs">
                  {allImages.slice(0, 3).map((img, i) => (
                    <div key={i} onClick={() => openLightbox(i)} className={`product-detail-thumb${i === 0 ? ' active' : ''}`}>
                      <img src={img.startsWith('http') ? img : `${API_BASE}/uploads/${img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {allImages.length > 3 && i === 2 && (
                        <div className="product-detail-thumb-more">+{allImages.length - 3}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="similar-desktop">{similarBlock}</div>
            </div>

            <div>
              <div className="product-detail-category">{product.category_name}</div>
              <h1 className="product-detail-name">{product.name}</h1>

              <div className="product-detail-price">
                <span className="price-current">{formatPrice(product.price)}</span>
                {product.old_price && <span className="price-old">{formatPrice(product.old_price)}</span>}
                {user && user.id !== product.seller_id && (
                  <button
                    onClick={() => { setShowNegotiate(true); setNegDone(false); setNegError(''); }}
                    className="btn negotiate-btn"
                    style={{
                      background: 'var(--gradient)', border: 'none', color: '#fff',
                      fontSize: '13px', padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                      fontFamily: 'var(--font)', fontWeight: 700, whiteSpace: 'nowrap',
                      boxShadow: '0 4px 14px var(--primary-glow)',
                    }}
                  >
                    <FiMessageCircle size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {t('products.negotiate')}
                  </button>
                )}
              </div>

              {showNegotiate && (
                <div style={{ margin: '12px 0', padding: '16px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-card)' }}>
                  {negDone ? (
                    <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: 10, fontSize: 14, color: '#10b981', fontWeight: 600 }}>
                      {t('products.offerSent')}
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiMessageCircle size={16} /> {t('products.offerTitle')}
                      </div>
                      <input type="number" min="0" placeholder={t('products.offerPlaceholder', { price: product.price })} value={offerPrice} onChange={e => setOfferPrice(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', marginBottom: 8, boxSizing: 'border-box' }} />
                      <textarea placeholder={t('products.offerMessagePlaceholder')} value={offerMessage} onChange={e => setOfferMessage(e.target.value)} rows={2} maxLength={500}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', resize: 'vertical', marginBottom: 8, boxSizing: 'border-box' }} />
                      {negError && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{negError}</div>}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={submitNegotiate} disabled={negotiating} className="btn btn-primary" style={{ fontSize: 13, padding: '10px 18px' }}>
                          {negotiating ? t('products.sending') : t('products.sendOffer')}
                        </button>
                        <button onClick={() => { setShowNegotiate(false); setOfferPrice(''); setOfferMessage(''); setNegError(''); }} className="btn btn-ghost" style={{ fontSize: 13, padding: '10px 18px' }}>{t('common.cancel')}</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="product-detail-tags">
                <span className="product-detail-tag state">{t(stateLabels[product.state] || product.state)}</span>
                <span className="product-detail-tag verified"><FiCheck size={12} /> {t('products.verified')}</span>
                {product.brand && <span className="product-detail-tag brand">{product.brand}</span>}
                {product.ville && <span className="product-detail-tag location"><FiMapPin size={12} /> {product.ville}</span>}
              </div>

              <p className="product-detail-desc">{product.description}</p>

              {specs && Object.keys(specs).length > 0 && Object.entries(specs).some(([, v]) => v !== null && v !== undefined && String(v).trim() !== '') && (
                <div className="product-detail-specs">
                  <h3>{t('products.techSpecs')}</h3>
                  <div className="product-detail-specs-grid">
                    {Object.entries(specs).filter(([, val]) => val !== null && val !== undefined && String(val).trim() !== '').map(([key, val]) => {
                      const Icon = specIcons[key] || FiCpu;
                      return (
                        <div key={key} style={{
                          padding: '12px 16px', background: 'var(--bg-card)',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                          display: 'flex', alignItems: 'center', gap: '12px',
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
                  <h4>{t('products.soldBy')}</h4>
                    <Link to={`/seller/${product.seller_id}`} className="seller-badge">
                      <div className="seller-avatar-mini">
                        {product.seller_avatar ? <img src={product.seller_avatar.startsWith('http') ? product.seller_avatar : `${API_BASE}/uploads/avatars/${product.seller_avatar}`} alt="" /> : product.seller_logo ? <img src={product.seller_logo.startsWith('http') ? product.seller_logo : `${API_BASE}/uploads/avatars/${product.seller_logo}`} alt="" /> : <FiUser size={18} />}
                      </div>
                    <div>
                      <strong>{product.seller_name} {product.seller_premium ? <FiStar size={14} style={{ color: '#FFD700', verticalAlign: 'middle', marginLeft: 2 }} /> : null}</strong>
                      {product.seller_rating_count > 0 && (
                        <small style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                          <FiStar size={12} fill="var(--primary)" color="var(--primary)" /> {product.seller_rating_avg}/5 ({t('products.reviewsCount', { count: product.seller_rating_count })})
                        </small>
                      )}
                    </div>
                  </Link>
                </div>
              )}

              {user && user.role === 'seller' && user.id === product.seller_id && (
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <FiSmartphone size={16} /> {t('products.reprise')}
                  </div>
                  {vendorReprises.length > 0 ? vendorReprises.map(r => (
                    <div key={r.id} style={{
                      padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: 6,
                      display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{r.brand} {r.model}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.full_name} — {r.imei || 'IMEI: N/A'}</div>
                      </div>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
                        background: r.status === 'en_attente' ? 'rgba(245,158,11,0.1)' : r.status === 'estime' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                        color: r.status === 'en_attente' ? '#f59e0b' : r.status === 'estime' ? '#3b82f6' : '#10b981',
                      }}>
                        {r.status === 'en_attente' ? t('products.repriseNew') : r.status === 'estime' ? t('products.repriseEstimated') : t('products.repriseAccepted')}
                      </span>
                      <Link to="/reprise/list" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        {t('products.repriseTreat')} →
                      </Link>
                    </div>
                  )) : (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                      {t('products.repriseNoRequests')}
                    </div>
                  )}
                  <Link to="/reprise/list" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    marginTop: 8, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: 'var(--btn-primary)', color: '#fff', textDecoration: 'none',
                  }}>
                    {t('products.repriseManageAll')} →
                  </Link>
                </div>
              )}

              {!user && (
                <div
                  style={{
                    width: '100%', marginTop: '24px', textAlign: 'center',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '24px 20px',
                  }}
                >
                  <FiLock size={28} style={{ color: 'var(--primary)', opacity: 0.9 }} />
                  <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '10px' }}>
                    {t('products.loginToContact')}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px auto 16px', maxWidth: '280px' }}>
                    {t('products.loginToContactDesc')}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/login" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
                      {t('products.login')}
                    </Link>
                    <Link to="/signup" className="btn" style={{ padding: '10px 24px', fontSize: '14px' }}>
                      {t('products.signup')}
                    </Link>
                  </div>
                </div>
              )}

              {user && user.id !== product.seller_id && (
                <>
                  {product.seller_id && (
                    <button
                      onClick={handleStartChat}
                      className="btn"
                      style={{
                        width: '100%', marginTop: '12px',
                        background: 'var(--gradient)', color: 'white',
                        fontSize: '16px', padding: '14px 36px', justifyContent: 'center',
                        border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                        boxShadow: 'var(--shadow-glow)',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--gradient-hover)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'var(--gradient)'}
                    >
                      <FiMessageCircle size={20} /> {t('products.sendMessage')}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="container" style={{ paddingBottom: '40px' }}>
          {product.seller_id && <SellerRating sellerId={product.seller_id} currentUserId={user?.id} />}
          <div className="similar-mobile">{similarBlock}</div>
        </div>
      </section>

      {selectedImage && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}><FiX size={24} /></button>
          <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}><FiChevronLeft size={28} /></button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={allImages[lightboxIndex].startsWith('http') ? allImages[lightboxIndex] : `${API_BASE}/uploads/${allImages[lightboxIndex]}`} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }} />
          </div>
          <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}><FiChevronRight size={28} /></button>
          <div className="lightbox-counter">{lightboxIndex + 1} / {allImages.length}</div>
        </div>
      )}
    </>
  );
}
