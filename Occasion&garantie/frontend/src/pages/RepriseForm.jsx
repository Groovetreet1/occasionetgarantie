import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiCamera, FiArrowLeft, FiCheck, FiSmartphone, FiInfo } from 'react-icons/fi';
import api from '../api/axios';

const steps = [
  { key: 'front', label: 'Face avant', hint: 'Prenez l\'ecran du telephone' },
  { key: 'back', label: 'Face arriere', hint: 'Prenez le dos du telephone' },
  { key: 'side', label: 'Cote', hint: 'Prenez le cote du telephone' },
  { key: 'screen', label: 'Ecran allume', hint: 'Allumez l\'ecran et prenez la photo' },
];

export default function RepriseForm() {
  const navigate = useNavigate();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');
  const [photos, setPhotos] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const key = steps[currentStep].key;
    setPhotos(p => ({ ...p, [key]: file }));
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    }
  };

  const handleSubmit = async () => {
    if (!brand || !model) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('brand', brand);
      fd.append('model', model);
      if (imei) fd.append('imei', imei);
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
          <input type="text" placeholder="Marque (ex: Samsung, iPhone)" value={brand} onChange={e => setBrand(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }} />
          <input type="text" placeholder="Modele (ex: Galaxy S23, iPhone 15)" value={model} onChange={e => setModel(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }} />
          <input type="text" placeholder="IMEI (optionnel, 15 chiffres)" value={imei} onChange={e => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)' }} />

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
            Les photos seront analysees pour estimer l'etat de votre telephone.
          </div>

          {currentStep > 0 && (
            <button onClick={() => setCurrentStep(s => s - 1)} className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>
              Photo precedente
            </button>
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
