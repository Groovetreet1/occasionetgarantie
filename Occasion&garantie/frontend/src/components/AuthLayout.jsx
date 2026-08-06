import { Link } from 'react-router-dom';
import { FiShield, FiRefreshCw, FiSmartphone, FiTruck, FiStar } from 'react-icons/fi';
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
      <div className="auth-split-brand">
        <div className="auth-split-brand-glow" />
        <div className="auth-split-brand-top">
          <Link to="/" className="auth-split-logo">
            <span className="auth-split-logo-badge">O&amp;G</span>
            <span className="auth-split-logo-text">Occasion &amp; Garantie</span>
          </Link>
        </div>

        <div className="auth-split-brand-body">
          <div className="auth-split-brand-greeting">
            <span className="auth-split-brand-eyebrow">{t('auth.brandEyebrow')}</span>
            <h2>{t('auth.brandHeadline')}</h2>
            <p>{t('auth.brandSubheadline')}</p>
          </div>

          <div className="auth-split-features">
            {features.map((f) => (
              <div key={f.title} className="auth-split-feature">
                <span className="auth-split-feature-icon"><f.icon size={20} /></span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-split-brand-bottom">
          <div className="auth-split-brand-quote">
            <FiStar size={16} className="auth-split-quote-icon" />
            <p>{t('auth.brandQuote')}</p>
            <span>{t('auth.brandQuoteAuthor')}</span>
          </div>
          <div className="auth-split-brand-copy">
            &copy; {new Date().getFullYear()} Occasion &amp; Garantie · Maroc
          </div>
        </div>
      </div>

      <div className="auth-split-form">
        <div className="auth-split-form-inner">
          <div className="auth-split-mobile-brand">
            <span className="auth-split-logo-badge">O&amp;G</span>
            <span className="auth-split-logo-text">Occasion &amp; Garantie</span>
          </div>
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
    </div>
  );
}