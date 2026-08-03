import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiCamera, FiArrowLeft, FiCheck, FiSmartphone, FiInfo, FiZap, FiRefreshCw } from 'react-icons/fi';
import api from '../api/axios';

const steps = [
  { key: 'front', label: 'Face avant', hint: 'Prenez l\'ecran du telephone' },
  { key: 'back', label: 'Face arriere', hint: 'Prenez le dos du telephone' },
  { key: 'side', label: 'Cote', hint: 'Prenez le cote du telephone' },
  { key: 'screen', label: 'Ecran allume', hint: 'Allumez l\'ecran et prenez la photo' },
];

const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';

const BRANDS = [
  { value: 'Apple', label: 'Apple (iPhone)' },
  { value: 'Samsung', label: 'Samsung' },
  { value: 'Xiaomi', label: 'Xiaomi' },
  { value: 'Redmi', label: 'Redmi' },
  { value: 'Poco', label: 'Poco' },
  { value: 'Huawei', label: 'Huawei' },
  { value: 'Honor', label: 'Honor' },
  { value: 'Oppo', label: 'Oppo' },
  { value: 'Realme', label: 'Realme' },
  { value: 'Vivo', label: 'Vivo' },
  { value: 'OnePlus', label: 'OnePlus' },
  { value: 'Google', label: 'Google Pixel' },
  { value: 'Motorola', label: 'Motorola' },
  { value: 'Sony', label: 'Sony' },
  { value: 'Nokia', label: 'Nokia' },
  { value: 'Autre', label: 'Autre' },
];

const BATTERY_LEVELS = [100, 95, 90, 85, 80, 75, 70, 60, 50];

export default function RepriseForm() {
  const navigate = useNavigate();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');
  const [photos, setPhotos] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [kind, setKind] = useState('occasion');
  const [originalPrice, setOriginalPrice] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [batteryHealth, setBatteryHealth] = useState(100);
  const fileRef = useRef(null);

  const years = [];
  const curYear = new Date().getFullYear();
  for (let y = curYear; y >= curYear - 10; y--) years.push(y);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const key = steps[currentStep].key;
    setPhotos(p => ({ ...p, [key]: file }));
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    }
  };

  const runEstimate = async () => {
    if (!brand || !model || Object.keys(photos).length === 0) return;
    setEstimating(true);
    try {
      const fd = new FormData();
      fd.append('brand', brand);
      fd.append('model', model);
      fd.append('kind', kind);
      fd.append('year', year);
      if (batteryHealth) fd.append('battery_health', batteryHealth);
      if (originalPrice) fd.append('original_price', originalPrice);
      for (const [key, file] of Object.entries(photos)) fd.append(key, file);
      const { data } = await api.post('/reprises/estimate', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEstimate(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la simulation');
    }
    setEstimating(false);
  };

  const handleSubmit = async () => {
    if (!brand || !model) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('brand', brand);
      fd.append('model', model);
      if (imei) fd.append('imei', imei);
      if (batteryHealth) fd.append('battery_health', batteryHealth);
      if (estimate?.estimated_price) fd.append('estimated_price', estimate.estimated_price);
      for (const [key, file] of Object.entries(photos)) {
        fd.append(key, file);
      }
      await api.post('/reprises', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDone(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'envoi');
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <section className="page-section">
        <div className="container" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ fontSize: 64, color: '#10b981', marginBottom: 16 }}><FiCheck /></div>
          <h2>Reprise soumise avec succes !</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px' }}>Un vendeur va evaluer votre telephone et vous contactera.</p>
          <Link to="/" className="btn btn-primary">Retour a l'accueil</Link>
        </div>
      </section>
    );
  }

  const current = steps[currentStep];
  const allDone = Object.keys(photos).length === steps.length;
  const isApple = brand.toLowerCase().includes('apple');

  return (
    <section className="page-section">
      <div className="container" style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
        <Link to="/" className="btn btn-ghost" style={{ marginBottom: 16 }}><FiArrowLeft /> Retour</Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <FiSmartphone size={24} style={{ color: 'var(--primary)' }} /> Reprise de telephone
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          Soumettez votre telephone pour obtenir une estimation.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Marque</label>
            <select value={brand} onChange={e => { setBrand(e.target.value); if (!e.target.value.toLowerCase().includes('apple')) setBatteryHealth(100); }}
              style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }}>
              <option value="">Choisissez une marque...</option>
              {BRANDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>

          {isApple && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, background: 'rgba(16,185,129,0.06)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>État de la batterie (Battery Health)</label>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                Indiquez le pourcentage de sante de la batterie (reglages → Batterie → Sante). Cela permet d'estimer l'usure de votre iPhone.
              </p>
              <select value={batteryHealth} onChange={e => setBatteryHealth(Number(e.target.value))}
                style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }}>
                <option value="">Choisissez l'etat de la batterie...</option>
                {BATTERY_LEVELS.map(b => (
                  <option key={b} value={b}>{b}% {b >= 95 ? '— excellente' : b >= 85 ? '— bonne' : b >= 75 ? '— correcte' : '— faible'}</option>
                ))}
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                <FiZap size={13} style={{ color: '#10b981' }} />
                Une batterie au-dessus de 85% maintient la valeur, en dessous elle la reduit.
              </div>
            </div>
          )}

          <input type="text" placeholder="Modele (ex: Galaxy S23, iPhone 15)" value={model} onChange={e => setModel(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }} />
          <input type="text" placeholder="IMEI (optionnel, 15 chiffres)" value={imei} onChange={e => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Votre telephone est-il neuf ou d'occasion ?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button type="button" onClick={() => setKind('neuf')}
                style={{
                  padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600,
                  border: kind === 'neuf' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: kind === 'neuf' ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)', color: 'var(--text)',
                }}>
                Neuf
              </button>
              <button type="button" onClick={() => setKind('occasion')}
                style={{
                  padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600,
                  border: kind === 'occasion' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: kind === 'occasion' ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)', color: 'var(--text)',
                }}>
                Occasion
              </button>
            </div>
          </div>

          <input type="number" placeholder="Prix d'achat neuf en DH (optionnel, ex: 2000)" value={originalPrice} onChange={e => setOriginalPrice(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Annee d'achat</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Photos guidees</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {steps.map((s, i) => (
                <div key={s.key} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: photos[s.key] ? 'var(--primary)' : i === currentStep ? 'var(--primary)' : 'var(--border)',
                  opacity: i === currentStep ? 0.7 : 1,
                }} />
              ))}
            </div>
            <div style={{
              border: '2px dashed var(--border)', borderRadius: 16, padding: 32, textAlign: 'center',
              background: 'var(--bg-secondary)', cursor: 'pointer',
            }} onClick={() => fileRef.current?.click()}>
              {current && (
                <>
                  <FiCamera size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{current.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{current.hint}</p>
                  {photos[current.key] && (
                    <p style={{ fontSize: 12, color: '#10b981', marginTop: 8 }}>Photo prise ✓</p>
                  )}
                </>
              )}
              {allDone && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                  Toutes les photos sont prises. Vous pouvez les reprendre en cliquant.
                </p>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(99,102,241,0.08)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
            <FiInfo size={16} style={{ flexShrink: 0, color: 'var(--primary)' }} />
            Les photos seront analysees par l'IA pour estimer l'etat de votre telephone et sa valeur sur le marche.
          </div>

          {currentStep > 0 && (
            <button onClick={() => setCurrentStep(s => s - 1)} className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>
              Photo precedente
            </button>
          )}

          <button onClick={runEstimate} disabled={!brand || !model || Object.keys(photos).length === 0 || estimating}
            className="btn" style={{
              width: '100%', justifyContent: 'center', padding: '13px', background: 'var(--gradient)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', boxShadow: 'var(--shadow-glow)',
            }}>
            {estimating ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analyse de vos photos en cours...</>
            ) : (
              <><FiZap size={18} /> Simuler ma reprise (IA)</>
            )}
          </button>

          {estimate && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-card)' }}>
              <div style={{ padding: '22px 16px', background: 'linear-gradient(135deg, var(--primary), #4f46e5)', color: '#fff', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.9 }}>
                  <FiZap size={13} /> Valeur estimee de votre telephone
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, margin: '8px 0 4px' }}>{formatPrice(estimate.estimated_price)}</div>
                <div style={{ fontSize: 12, opacity: 0.95 }}>Intervalle : {formatPrice(estimate.range_min)} - {formatPrice(estimate.range_max)}</div>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{estimate.reference_source === 'original' ? "Prix d'achat neuf" : 'Prix de reference (marche)'}</span>
                  <strong>{formatPrice(estimate.reference_price)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Anciennete ({estimate.age_years} an{estimate.age_years > 1 ? 's' : ''})</span>
                  <strong style={{ color: 'var(--error)' }}>-{Math.round((1 - estimate.factors.age) * 100)}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Type / etat</span>
                  <strong>{estimate.kind === 'neuf' ? 'Neuf (plein prix)' : 'Occasion'}{estimate.kind !== 'neuf' ? ` - ${estimate.condition_label}` : ''}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Gamme du telephone</span>
                  <strong>{estimate.segment === 'premium' ? 'Haut de gamme' : estimate.segment === 'mid' ? 'Milieu de gamme' : 'Entree de gamme'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Demande pour la marque {brand}</span>
                  <strong>{estimate.factors.brand >= 1 ? `+${Math.round((estimate.factors.brand - 1) * 100)}%` : `-${Math.round((1 - estimate.factors.brand) * 100)}%`}</strong>
                </div>
                <button onClick={() => { setEstimate(null); }} className="btn btn-ghost" style={{ alignSelf: 'center', padding: '6px 14px', fontSize: 12 }}>
                  <FiRefreshCw size={12} /> Refaire une estimation
                </button>
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={!brand || !model || !allDone || submitting}
            className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {submitting ? 'Envoi...' : 'Soumettre ma reprise'}
          </button>
        </div>
      </div>
    </section>
  );
}
