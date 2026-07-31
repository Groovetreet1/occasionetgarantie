import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { FiArrowLeft, FiShoppingBag, FiShield, FiCheck, FiMonitor, FiCpu, FiHardDrive, FiBattery, FiCamera, FiDroplet, FiX, FiChevronLeft, FiChevronRight, FiUser, FiMessageCircle, FiStar, FiSmartphone, FiMapPin, FiLock, FiGrid } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SellerRating from '../components/SellerRating';

const stateLabels = {
  neuf: 'Neuf',
  comme_neuf: 'Comme neuf',
  tres_bon: 'Très bon état',
  bon: 'Bon état',
  acceptable: 'État acceptable',
};

const specIcons = {
  Ecran: FiMonitor, Processeur: FiCpu, RAM: FiHardDrive,
  Stockage: FiHardDrive, Batterie: FiBattery, Appareil: FiCamera,
  Couleur: FiDroplet, GPU: FiMonitor, OS: FiMonitor,
};

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
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
      alert(err.response?.data?.message || 'Erreur');
    }
  };

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

  const repSteps = [
    { key: 'front', label: 'Face avant', hint: "Photo de l'ecran" },
    { key: 'back', label: 'Face arriere', hint: 'Photo du dos' },
    { key: 'side', label: 'Cote', hint: 'Photo du cote' },
    { key: 'screen', label: 'Ecran allume', hint: "Allumez l'ecran et prenez la photo" },
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
    } catch (e) { alert(e?.response?.data?.message || "Erreur lors de l'envoi"); }
    setSubmittingRep(false);
  };

  const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const waMsg = encodeURIComponent(`Bonjour ! Je suis intéresse(e) par : ${product.name} (${formatPrice(product.price)})`);
  const sellerPhone = product.seller_phone ? product.seller_phone.replace(/^0+/, '') : null;
  const waUrl = sellerPhone ? `https://wa.me/${sellerPhone}?text=${waMsg}` : null;
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
        <FiGrid size={16} style={{ color: 'var(--primary)' }} /> Produits similaires
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
            <FiArrowLeft /> Retour aux produits
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
                  {allImages.map((img, i) => (
                    <div key={i} onClick={() => openLightbox(i)} className={`product-detail-thumb${i === 0 ? ' active' : ''}`}>
                      <img src={img.startsWith('http') ? img : `${API_BASE}/uploads/${img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              </div>

              <div className="product-detail-tags">
                <span className="product-detail-tag state">{stateLabels[product.state] || product.state}</span>
                <span className="product-detail-tag verified"><FiCheck size={12} /> Vérifié</span>
                {product.brand && <span className="product-detail-tag brand">{product.brand}</span>}
                {product.ville && <span className="product-detail-tag location"><FiMapPin size={12} /> {product.ville}</span>}
              </div>

              <p className="product-detail-desc">{product.description}</p>

              {specs && Object.keys(specs).length > 0 && (
                <div className="product-detail-specs">
                  <h3>Fiche technique</h3>
                  <div className="product-detail-specs-grid">
                    {Object.entries(specs).map(([key, val]) => {
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
                  <h4>Vendu par</h4>
                    <Link to={`/seller/${product.seller_id}`} className="seller-badge">
                      <div className="seller-avatar-mini">
                        {product.seller_avatar ? <img src={product.seller_avatar.startsWith('http') ? product.seller_avatar : `${API_BASE}/uploads/avatars/${product.seller_avatar}`} alt="" /> : product.seller_logo ? <img src={product.seller_logo.startsWith('http') ? product.seller_logo : `${API_BASE}/uploads/avatars/${product.seller_logo}`} alt="" /> : <FiUser size={18} />}
                      </div>
                    <div>
                      <strong>{product.seller_name} {product.seller_premium ? <FiStar size={14} style={{ color: '#FFD700', verticalAlign: 'middle', marginLeft: 2 }} /> : null}</strong>
                      {product.seller_rating_count > 0 && (
                        <small style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                          <FiStar size={12} fill="var(--primary)" color="var(--primary)" /> {product.seller_rating_avg}/5 ({product.seller_rating_count} avis)
                        </small>
                      )}
                    </div>
                  </Link>
                </div>
              )}

              {user && user.role !== 'seller' && user.id !== product.seller_id && (
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  {repDone ? (
                    <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: 10, fontSize: 14, color: '#10b981', fontWeight: 600 }}>
                      Reprise soumise ! Le vendeur va vous contacter.
                    </div>
                  ) : !showReprise ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button onClick={() => setShowReprise(true)} className="btn" style={{
                        width: '100%', background: 'transparent', border: '2px dashed var(--primary)', color: 'var(--primary)',
                        fontSize: '14px', padding: '12px', justifyContent: 'center', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)',
                      }}>
                        <FiSmartphone size={18} /> Proposer une reprise pour mon telephone
                      </button>
                      <Link to="/reprise" style={{ width: '100%', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'underline' }}>
                        Estimer la valeur de mon appareil sur le marche
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiSmartphone size={16} /> Reprise de votre telephone
                      </div>
                      <input type="text" placeholder="Marque (ex: Samsung)" value={repBrand} onChange={e => setRepBrand(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)' }} />
                      <input type="text" placeholder="Modele (ex: Galaxy S23)" value={repModel} onChange={e => setRepModel(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)' }} />
                      <input type="text" placeholder="IMEI (optionnel)" value={repImei} onChange={e => setRepImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                        style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)' }} />
                      <textarea placeholder="Description / etat du telephone (optionnel)" value={repNotes} onChange={e => setRepNotes(e.target.value)} rows={2}
                        style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', resize: 'vertical' }} />

                      <div style={{ marginTop: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Photos guidees</div>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                          {repSteps.map((s, i) => (
                            <div key={s.key} style={{ flex: 1, height: 3, borderRadius: 2, background: repPhotos[s.key] ? 'var(--primary)' : i === repStep ? 'var(--primary)' : 'var(--border)', opacity: i === repStep ? 0.7 : 1 }} />
                          ))}
                        </div>
                        <div onClick={() => repFileRef.current?.click()} style={{
                          border: '2px dashed var(--border)', borderRadius: 10, padding: '16px', textAlign: 'center',
                          background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)',
                        }}>
                          <FiCamera size={24} style={{ display: 'block', margin: '0 auto 4px' }} />
                          {repSteps[repStep]?.label} — {repSteps[repStep]?.hint}
                          {repPhotos[repSteps[repStep]?.key] && <span style={{ color: '#10b981', display: 'block', marginTop: 4 }}>Photo prise</span>}
                        </div>
                        <input ref={repFileRef} type="file" accept="image/*" capture="environment" onChange={handleRepPhoto} style={{ display: 'none' }} />
                      </div>

                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <button onClick={submitReprise} disabled={!repBrand || !repModel || !repAllDone || submittingRep}
                          className="btn btn-primary" style={{ fontSize: 13, padding: '10px 20px' }}>
                          {submittingRep ? 'Envoi...' : 'Envoyer la reprise'}
                        </button>
                        <button onClick={() => { setShowReprise(false); setRepBrand(''); setRepModel(''); setRepImei(''); setRepNotes(''); setRepPhotos({}); setRepStep(0); }}
                          className="btn btn-ghost" style={{ fontSize: 13, padding: '10px 20px' }}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user && user.role === 'seller' && user.id === product.seller_id && (
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <FiSmartphone size={16} /> Reprise
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
                        {r.status === 'en_attente' ? 'Nouveau' : r.status === 'estime' ? 'Estime' : 'Accepte'}
                      </span>
                      <Link to="/reprise/list" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        Traiter →
                      </Link>
                    </div>
                  )) : (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                      Aucune demande de reprise pour cet article
                    </div>
                  )}
                  <Link to="/reprise/list" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    marginTop: 8, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: 'var(--btn-primary)', color: '#fff', textDecoration: 'none',
                  }}>
                    Gerer toutes les demandes →
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
                    Connectez-vous pour contacter le vendeur
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px auto 16px', maxWidth: '280px' }}>
                    Creez un compte gratuit pour voir les coordonnees du vendeur et lui envoyer un message.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/login" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
                      Se connecter
                    </Link>
                    <Link to="/signup" className="btn" style={{ padding: '10px 24px', fontSize: '14px' }}>
                      Creer un compte
                    </Link>
                  </div>
                </div>
              )}

              {user && user.id !== product.seller_id && (
                <>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{
                        width: '100%', marginTop: '24px', background: '#25D366', color: 'white',
                        fontSize: '18px', padding: '16px 36px', justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#1da851'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#25D366'}
                    >
                      <BsWhatsapp size={22} /> Contacter le vendeur
                    </a>
                  )}

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
                      <FiMessageCircle size={20} /> Envoyer un message
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
