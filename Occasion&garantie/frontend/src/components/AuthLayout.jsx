import { Link } from 'react-router-dom';
import { FiShield, FiRefreshCw, FiSmartphone, FiTruck, FiCheck, FiChevronLeft, FiStar } from 'react-icons/fi';
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

          <div className="auth-showcase">
            <div className="auth-showcase-crumb">
              <FiChevronLeft size={14} />Accueil<span>/</span>Téléphones<span>/</span><strong>iPhone 13 Pro</strong>
            </div>
            <div className="auth-showcase-head">
              <div>
                <div className="auth-showcase-title">iPhone 13 Pro · 128 Go</div>
                <div className="auth-showcase-sub">Reconditionné · Excellent état</div>
              </div>
              <span className="auth-showcase-badge">Garantie 12 mois</span>
            </div>
            <div className="auth-showcase-product">
              <div className="auth-showcase-thumb"><FiSmartphone size={26} /></div>
              <div className="auth-showcase-product-info">
                <div className="auth-showcase-price">6 499 MAD <s>7 299 MAD</s></div>
                <div className="auth-showcase-seller">PhoneStore Casablanca · <span>Vendeur vérifié</span></div>
              </div>
              <span className="auth-showcase-stock">En stock</span>
            </div>
            <div className="auth-showcase-tiles">
              <div className="auth-showcase-tile"><FiShield size={17} /><span>Garantie 12 mois</span></div>
              <div className="auth-showcase-tile"><FiCheck size={17} /><span>Paiement sécurisé</span></div>
              <div className="auth-showcase-tile"><FiTruck size={17} /><span>Livraison 48h</span></div>
            </div>
            <div className="auth-showcase-review">
              <div className="auth-showcase-avatar">YB</div>
              <div className="auth-showcase-review-body">
                <div className="auth-showcase-review-top">
                  <strong>Yasmine B.</strong>
                  <span className="auth-showcase-stars">
                    <FiStar size={11} /><FiStar size={11} /><FiStar size={11} /><FiStar size={11} /><FiStar size={11} />
                  </span>
                  <span className="auth-showcase-time">il y a 2 min</span>
                </div>
                <div className="auth-showcase-review-text">Produit reçu rapidement, garantie activée sans problème.</div>
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
