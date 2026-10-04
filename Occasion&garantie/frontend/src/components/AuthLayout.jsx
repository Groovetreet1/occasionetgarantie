import { Link } from 'react-router-dom';
import { FiShield, FiRefreshCw, FiSmartphone, FiTruck, FiCheck, FiChevronLeft, FiStar, FiMapPin } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

export default function AuthLayout({ title, subtitle, children, footer }) {
  const { t, lang } = useLanguage();

  const features = [
    { icon: FiShield, title: t('auth.brandFeat1Title'), desc: t('auth.brandFeat1Desc') },
    { icon: FiRefreshCw, title: t('auth.brandFeat2Title'), desc: t('auth.brandFeat2Desc') },
    { icon: FiSmartphone, title: t('auth.brandFeat3Title'), desc: t('auth.brandFeat3Desc') },
    { icon: FiTruck, title: t('auth.brandFeat4Title'), desc: t('auth.brandFeat4Desc') },
  ];

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
          <div className="auth-split-brand-greeting">
            <span className="auth-split-brand-eyebrow">{t('auth.brandEyebrow')}</span>
            <h2>{t('auth.brandHeadline')}</h2>
            <p>{t('auth.brandSubheadline')}</p>
          </div>

          <div className="auth-showcase-wrap">
            <div className="auth-showcase" dir="ltr">
              <div className="auth-showcase-crumb">
                <FiChevronLeft size={14} />Accueil<span>/</span>Téléphones<span>/</span><strong>iPhone 13 Pro</strong>
              </div>
              <div className="auth-showcase-photo">
                <span className="auth-showcase-discount">-11%</span>
                <FiSmartphone size={42} />
                <span className="auth-showcase-count">1/4</span>
              </div>
              <div className="auth-showcase-meta">
                <span className="auth-showcase-cat">Smartphone</span>
                <span className="auth-showcase-rating"><FiStar size={11} /> 4.8</span>
              </div>
              <div className="auth-showcase-title">iPhone 13 Pro · 128 Go · Excellent état</div>
              <div className="auth-showcase-price">6 499 DH <s>7 299 DH</s></div>
              <div className="auth-showcase-foot">
                <span className="auth-showcase-loc"><FiMapPin size={11} /> Casablanca</span>
                <span className="auth-showcase-warranty"><FiShield size={10} /> 12 mois</span>
              </div>
              <div className="auth-showcase-track">
                <div className="auth-showcase-track-head"><span>Suivi de commande #OG-2481</span><b>2/3</b></div>
                <div className="auth-showcase-steps">
                  <span className="done"><FiCheck size={11} /> Vérifié</span>
                  <span className="done"><FiCheck size={11} /> Payé</span>
                  <span className="current">En livraison</span>
                </div>
                <div className="auth-showcase-meter"><i style={{ '--w': '66%' }} /></div>
              </div>
            </div>
            <div className="auth-showcase-toast" dir="ltr">
              <span className="auth-showcase-toast-icon"><FiCheck size={14} /></span>
              <div>
                <strong>Paiement confirmé</strong>
                <span>6 499 DH · à l'instant</span>
              </div>
            </div>
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
