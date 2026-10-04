import { Link } from 'react-router-dom';
import { FiShield, FiRefreshCw, FiSmartphone, FiTruck, FiCheck, FiChevronLeft, FiStar, FiMapPin, FiPlay } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const REAL_PRODUCT_IMAGE = 'https://res.cloudinary.com/rk97x4hc/image/upload/v1785024268/occasionetgarantie/products/oawup62jfgpcnbt9ecbs.jpg';

export default function AuthLayout({ title, subtitle, children, footer }) {
  const { t, lang } = useLanguage();

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
          <div className="auth-split-brand-greeting">
            <span className="auth-split-brand-eyebrow">{t('auth.brandEyebrow')}</span>
            <h2>{t('auth.brandHeadline')}</h2>
            <p>{t('auth.brandSubheadline')}</p>
          </div>

          <div className="auth-services" dir="ltr">
            {categories.map((c) => (
              <span key={c} className="auth-service-chip">{c}</span>
            ))}
          </div>

          <div className="auth-showcase-wrap">
            <div className="auth-showcase" dir="ltr">
              <div className="auth-showcase-crumb">
                <FiChevronLeft size={14} />Accueil<span>/</span>Smartphones<span>/</span><strong>Redmi 15C</strong>
              </div>
              <div className="auth-showcase-photo">
                <FiSmartphone size={40} />
                <img src={REAL_PRODUCT_IMAGE} alt="Redmi 15C" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <div className="auth-showcase-meta">
                <span className="auth-showcase-cat">Smartphones</span>
                <span className="auth-showcase-rating"><FiStar size={11} /> 4.7</span>
              </div>
              <div className="auth-showcase-title">Redmi 15C · 8/128 Go · Neuf</div>
              <div className="auth-showcase-price">1 400 DH</div>
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

            <div className="auth-chat" dir="ltr">
              <div className="auth-chat-head">
                <div className="auth-chat-avatars"><span className="store">GP</span></div>
                <div className="auth-chat-who"><strong>GoPhone 2026</strong><span><i />En ligne</span></div>
              </div>
              <div className="auth-chat-bubble seller">Oui disponible, avec garantie 12 mois incluse.<em>14:01</em></div>
              <div className="auth-chat-audio">
                <span className="auth-chat-play"><FiPlay size={12} /></span>
                <span className="auth-chat-bars">
                  <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
                </span>
                <span className="auth-chat-time">0:12</span>
              </div>
              <div className="auth-chat-bubble buyer">Parfait, je le prends. On se voit demain ?<em>14:03</em></div>
            </div>

            <div className="auth-showcase-toast" dir="ltr">
              <span className="auth-showcase-toast-icon"><FiCheck size={14} /></span>
              <div>
                <strong>Paiement confirmé</strong>
                <span>1 400 DH · à l'instant</span>
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
