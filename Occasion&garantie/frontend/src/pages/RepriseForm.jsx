import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiSmartphone, FiZap, FiRefreshCw, FiShield, FiInfo, FiLock, FiCamera } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const TYPES = [
  { value: 'smartphone', label: 'Smartphone', icon: '📱' },
  { value: 'tablette', label: 'Tablette', icon: '💻' },
  { value: 'ordinateur', label: 'Ordinateur', icon: '🖥️' },
];

const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Redmi', 'Poco', 'Huawei', 'Honor', 'Oppo', 'Realme', 'Vivo', 'OnePlus', 'Google', 'Sony', 'Motorola', 'Nokia', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'MSI'];

const STATES = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'comme_neuf', label: 'Comme neuf' },
  { value: 'tres_bon', label: 'Très bon état' },
  { value: 'bon', label: 'Bon état' },
  { value: 'acceptable', label: 'État acceptable' },
];

const photoSteps = [
  { key: 'front', label: 'Face avant', hint: "Prenez l'ecran du telephone" },
  { key: 'back', label: 'Face arriere', hint: 'Prenez le dos du telephone' },
  { key: 'side', label: 'Cote', hint: 'Prenez le cote du telephone' },
  { key: 'screen', label: 'Ecran allume', hint: "Allumez l'ecran et prenez la photo" },
];

const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(p).replace('MAD', '').trim() + ' DH';

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)',
  background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)',
};

export default function RepriseForm() {
  const { user } = useAuth();
  const [step, setStep] = useState('form');
  const [type, setType] = useState('smartphone');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [state, setState] = useState('tres_bon');
  const [storage, setStorage] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState('');

  const [imei, setImei] = useState('');
  const [photos, setPhotos] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const years = [];
  const curYear = new Date().getFullYear();
  for (let y = curYear; y >= curYear - 10; y--) years.push(y);

  const runEstimate = async (e) => {
    e.preventDefault();
    if (!brand || !model) { setError('La marque et le modele sont requis.'); return; }
    setError('');
    setEstimating(true);
    try {
      const { data } = await api.post('/reprises/estimate', { type, brand, model, year: Number(year), state, storage });
      setEstimate(data);
      setStep('result');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du calcul.');
    }
    setEstimating(false);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const key = photoSteps[currentStep].key;
    setPhotos(p => ({ ...p, [key]: file }));
    if (currentStep < photoSteps.length - 1) setCurrentStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!brand || !model) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('brand', brand);
      fd.append('model', model);
      if (imei) fd.append('imei', imei);
      for (const [key, file] of Object.entries(photos)) fd.append(key, file);
      await api.post('/reprises', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDone(true);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'envoi");
    }
    setSubmitting(false);
  };

  const stateLabel = STATES.find(s => s.value === state)?.label || state;

  if (done) {
    return (
      <section className="page-section">
        <div className="container" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ fontSize: 64, color: '#10b981', marginBottom: 16 }}><FiCheck /></div>
          <h2>Reprise soumise avec succes !</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px' }}>Un vendeur va evaluer votre appareil et vous contactera.</p>
          <Link to="/" className="btn btn-primary">Retour a l'accueil</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: 720, margin: '0 auto', padding: '20px' }}>
        <Link to="/" className="btn btn-ghost" style={{ marginBottom: 16 }}><FiArrowLeft /> Retour</Link>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 14px', borderRadius: 16, background: 'var(--gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
            <FiZap size={30} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Simulation de reprise</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 460, margin: '0 auto' }}>
            Estimez instantanément la valeur de votre appareil sur le marché grace a notre moteur d'analyse.
          </p>
        </div>

        {step === 'form' && (
          <form onSubmit={runEstimate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Type d'appareil</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setType(t.value)}
                    style={{
                      padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
                      border: type === t.value ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: type === t.value ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)', color: 'var(--text)',
                    }}>
                    <span style={{ display: 'block', fontSize: 18, marginBottom: 4 }}>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Marque</label>
                <select value={brand} onChange={e => setBrand(e.target.value)} style={inputStyle}>
                  <option value="">Selectionnez...</option>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Modele</label>
                <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="Ex: iPhone 13, Galaxy S23" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Annee d'achat</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))} style={inputStyle}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Etat</label>
                <select value={state} onChange={e => setState(e.target.value)} style={inputStyle}>
                  {STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Stockage (optionnel)</label>
              <input type="text" value={storage} onChange={e => setStorage(e.target.value)} placeholder="Ex: 128 Go, 256 Go, 512 Go" style={inputStyle} />
            </div>

            {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}</p>}

            <button type="submit" disabled={estimating} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: 15 }}>
              {estimating ? (
                <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analyse du marche en cours...</>
              ) : (
                <><FiZap size={18} /> Estimer ma reprise</>
              )}
            </button>
          </form>
        )}

        {step === 'result' && estimate && (
          <div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-card)' }}>
              <div style={{ padding: '26px 20px', background: 'linear-gradient(135deg, var(--primary), #4f46e5)', color: '#fff', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0.9, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  <FiZap size={14} /> Valeur estimee sur le marche
                </div>
                <div style={{ fontSize: 34, fontWeight: 800, margin: '8px 0 4px' }}>{formatPrice(estimate.estimated_price)}</div>
                <div style={{ fontSize: 13, opacity: 0.95 }}>
                  Intervalle : {formatPrice(estimate.range_min)} - {formatPrice(estimate.range_max)}
                </div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 6 }}>{brand} {model} &middot; {stateLabel}</div>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Prix de reference (marche actuel)</span>
                  <strong>{formatPrice(estimate.reference_price)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Anciennete ({estimate.age_years} an{estimate.age_years > 1 ? 's' : ''})</span>
                  <strong style={{ color: 'var(--error)' }}>-{Math.round((1 - estimate.factors.age) * 100)}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Etat ({stateLabel})</span>
                  <strong>{Math.round(estimate.factors.state * 100)}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Demande pour la marque {brand}</span>
                  <strong>{estimate.factors.brand >= 1 ? `+${Math.round((estimate.factors.brand - 1) * 100)}%` : `-${Math.round((1 - estimate.factors.brand) * 100)}%`}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, background: 'rgba(99,102,241,0.08)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)', marginTop: 14 }}>
              <FiInfo size={16} style={{ flexShrink: 0, color: 'var(--primary)', marginTop: 1 }} />
              Estimation indicative basee sur une simulation. Le montant final est confirme apres evaluation par notre equipe.
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <button
                onClick={() => { if (user) setStep('submit'); else window.location.href = '/login'; }}
                className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '13px', fontSize: 14, minWidth: 200 }}
              >
                <FiSmartphone size={16} /> Soumettre ma demande de reprise
              </button>
              <button onClick={() => setStep('form')} className="btn btn-outline" style={{ justifyContent: 'center', padding: '13px', fontSize: 14 }}>
                <FiRefreshCw size={16} /> Nouvelle estimation
              </button>
            </div>
          </div>
        )}

        {step === 'submit' && !user && (
          <div style={{ textAlign: 'center', padding: '40px 24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)' }}>
            <FiLock size={32} style={{ color: 'var(--primary)', marginBottom: 10 }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Connectez-vous pour soumettre votre demande</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto 18px' }}>
              Creez un compte gratuit pour envoyer votre demande de reprise et suivre son avancement.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '10px 24px' }}>Se connecter</Link>
              <Link to="/signup" className="btn" style={{ padding: '10px 24px' }}>Creer un compte</Link>
            </div>
          </div>
        )}

        {step === 'submit' && user && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <FiSmartphone size={22} style={{ color: 'var(--primary)' }} />
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Votre demande : {brand} {model}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Estimation affichee : {estimate ? formatPrice(estimate.estimated_price) : ''}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input type="text" placeholder="IMEI (optionnel, 15 chiffres)" value={imei} onChange={e => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))} style={inputStyle} />

              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Photos guidees</h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {photoSteps.map((s, i) => (
                    <div key={s.key} style={{ flex: 1, height: 4, borderRadius: 2, background: photos[s.key] ? 'var(--primary)' : 'var(--border)', opacity: i === currentStep ? 0.7 : 1 }} />
                  ))}
                </div>
                <div style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: 32, textAlign: 'center', background: 'var(--bg-secondary)', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
                  <FiCamera size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{photoSteps[currentStep].label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{photoSteps[currentStep].hint}</p>
                  {photos[photoSteps[currentStep].key] && <p style={{ fontSize: 12, color: '#10b981', marginTop: 8 }}>Photo prise ✓</p>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
              </div>

              {currentStep > 0 && (
                <button onClick={() => setCurrentStep(s => s - 1)} className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>Photo precedente</button>
              )}

              <button onClick={handleSubmit} disabled={!brand || !model || Object.keys(photos).length !== photoSteps.length || submitting}
                className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                {submitting ? 'Envoi...' : 'Soumettre ma reprise'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
