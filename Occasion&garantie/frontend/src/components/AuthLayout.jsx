import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiShield, FiRefreshCw, FiSmartphone, FiTruck, FiCheck, FiCheckCircle, FiStar, FiMapPin, FiPlay, FiShoppingBag } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const REAL_PRODUCT_IMAGE = 'https://res.cloudinary.com/rk97x4hc/image/upload/v1785024268/occasionetgarantie/products/oawup62jfgpcnbt9ecbs.jpg';

const LIVE_EVENTS = [
  { icon: FiCheckCircle, title: 'Paiement confirmé', sub: "1 400 DH · à l'instant" },
  { icon: FiShoppingBag, title: 'Nouvelle commande', sub: 'Redmi 15C · Smartphones' },
  { icon: FiStar, title: 'Avis 5/5', sub: 'GoPhone 2026 · vendeur vérifié' },
];

function useCountUp(target, duration = 1300, delay = 400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(target);
      return;
    }
    let raf;
    let start;
    const t = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return val;
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  const { t, lang } = useLanguage();
  const products = useCountUp(50);
  const satisfaction = useCountUp(96, 1300, 550);
  const [liveIdx, setLiveIdx] = useState(0);
  const [bars, setBars] = useState(() => Array.from({ length: 18 }, (_, i) => 35 + ((i * 37) % 55)));

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setLiveIdx((i) => (i + 1) % LIVE_EVENTS.length), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => {
      setBars(Array.from({ length: 18 }, () => 25 + Math.round(Math.random() * 70)));
    }, 900);
    return () => clearInterval(id);
  }, []);

  const LiveIcon = LIVE_EVENTS[liveIdx].icon;

  const features = [
    { icon: FiShield, title: t('auth.brandFeat1Title'), desc: t('auth.brandFeat1Desc') },
    { icon: FiRefreshCw, title: t('auth.brandFeat2Title'), desc: t('auth.brandFeat2Desc') },
    { icon: FiSmartphone, title: t('auth.brandFeat3Title'), desc: t('auth.brandFeat3Desc') },
    { icon: FiTruck, title: t('auth.brandFeat4Title'), desc: t('auth.brandFeat4Desc') },
  ];

  const categories = ['Smartphones', 'Tablettes', 'Ordinateurs', 'Accessoires', 'Gaming'];

  return (
    <div className="auth-split" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="auth-split-form">
        <div className="auth-split-form-inner">
          <Link to="/" className="auth-split-top-logo">
            <img src="/logo.png" alt="Occasion & Garantie" className="auth-split-logo-img" />
            <span className="auth-split-logo-text">Occasion &amp; Garantie</span>
          </Link>
          <div className="auth-split-heading">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="auth-split-card">
            {children}
          </div>
          {footer && <div className="form-footer">{footer}</div>}
        </div>
      </div>

      <div className="auth-split-brand">
        <div className="auth-split-brand-body">
          <div className="auth-brand-head">
            <span className="auth-brand-eyebrow"><i />{t('auth.brandEyebrow')}</span>
            <h2>{t('auth.brandHeadline')}</h2>
            <p>{t('auth.brandSubheadline')}</p>
          </div>

          <div className="auth-brand-cats" dir="ltr">
            {categories.map((c, i) => (
              <span key={c} className={i === 0 ? 'on' : ''}>{c}</span>
            ))}
          </div>

          <div className="auth-brand-stage" dir="ltr">
            <div className="auth-product">
              <div className="auth-product-crumb">Smartphones<span>/</span><strong>Redmi 15C</strong></div>
              <div className="auth-product-photo">
                <FiSmartphone size={34} />
                <img src={REAL_PRODUCT_IMAGE} alt="Redmi 15C" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <span className="auth-product-cond">Neuf</span>
              </div>
              <div className="auth-product-meta">
                <span className="auth-product-cat">Smartphones</span>
                <span className="auth-product-rating"><FiStar size={11} /> 4.7</span>
              </div>
              <div className="auth-product-title">Redmi 15C · 8/128 Go</div>
              <div className="auth-product-price">1 400 DH</div>
              <div className="auth-product-seller">
                <span className="auth-avatar">GP</span>
                <div>
                  <strong>GoPhone 2026</strong>
                  <small><FiStar size={10} /> 4.7 · Premium</small>
                </div>
                <span className="auth-online"><i />En ligne</span>
              </div>
              <div className="auth-product-foot">
                <span className="auth-loc"><FiMapPin size={11} /> Casablanca</span>
                <span className="auth-warranty"><FiShield size={10} /> Garantie 12 mois</span>
              </div>
              <div className="auth-track">
                <div className="auth-track-head"><span>Suivi de commande</span><b>2/3</b></div>
                <div className="auth-track-steps">
                  <span className="done"><FiCheck size={11} /> Vérifié</span>
                  <span className="done"><FiCheck size={11} /> Payé</span>
                  <span className="now">Livraison</span>
                </div>
                <div className="auth-track-bar"><i style={{ '--w': '66%' }} /></div>
              </div>
            </div>

            <div className="auth-chat">
              <div className="auth-chat-head">
                <span className="auth-avatar sm">GP</span>
                <div>
                  <strong>GoPhone 2026</strong>
                  <span className="st"><i />En ligne</span>
                </div>
                <time>14:03</time>
              </div>
              <p className="auth-bubble in">Oui, disponible — garantie 12 mois incluse.</p>
              <div className="auth-voice">
                <span className="auth-play"><FiPlay size={11} /></span>
                <span className="auth-bars">
                  {bars.map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </span>
                <span className="auth-len">0:12</span>
              </div>
              <p className="auth-bubble out">Parfait, je le prends.</p>
            </div>

            <div className="auth-toast" key={liveIdx}>
              <span className="auth-toast-ic"><LiveIcon size={14} /></span>
              <div>
                <strong>{LIVE_EVENTS[liveIdx].title}</strong>
                <span>{LIVE_EVENTS[liveIdx].sub}</span>
              </div>
            </div>
          </div>

          <div className="auth-stats" dir="ltr">
            <div><strong>{products}+</strong><span>Produits</span></div>
            <div><strong>{satisfaction}%</strong><span>Satisfaction</span></div>
            <div><strong>12<i> mois</i></strong><span>Garantie</span></div>
          </div>

          <div className="auth-split-features">
            {features.map((f) => (
              <div key={f.title} className="auth-split-feature">
                <span className="auth-split-feature-icon"><f.icon size={17} /></span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-split-brand-bottom">
          <div className="auth-split-brand-copy">
            &copy; {new Date().getFullYear()} Occasion &amp; Garantie · Maroc
          </div>
        </div>
      </div>
    </div>
  );
}
