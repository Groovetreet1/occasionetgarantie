import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiShield, FiRefreshCw, FiSmartphone, FiTruck } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

function TypewriterHeadline({ text }) {
  const [display, setDisplay] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setDisplay('');
    setIsDeleting(false);
  }, [text]);

  useEffect(() => {
    let timeout;
    const typeSpeed = isDeleting ? 28 : 52;
    const pauseEnd = 1800;
    const pauseStart = 600;

    if (!isDeleting && display.length < text.length) {
      timeout = setTimeout(() => setDisplay(text.slice(0, display.length + 1)), typeSpeed);
    } else if (!isDeleting && display.length === text.length) {
      timeout = setTimeout(() => setIsDeleting(true), pauseEnd);
    } else if (isDeleting && display.length > 0) {
      timeout = setTimeout(() => setDisplay(text.slice(0, display.length - 1)), typeSpeed);
    } else if (isDeleting && display.length === 0) {
      timeout = setTimeout(() => setIsDeleting(false), pauseStart);
    }
    return () => clearTimeout(timeout);
  }, [display, isDeleting, text]);

  const firstSpace = text.indexOf(' ');
  const firstWord = firstSpace === -1 ? text : text.slice(0, firstSpace);
  const restText = firstSpace === -1 ? '' : text.slice(firstSpace);
  let rendered;
  if (display.length <= firstWord.length) {
    rendered = <span className="brand-typed-highlight">{display}</span>;
  } else {
    const restDisplay = display.slice(firstWord.length);
    rendered = (
      <>
        <span className="brand-typed-highlight">{firstWord}</span>
        <span>{restDisplay}</span>
      </>
    );
  }

  return (
    <span className="brand-typewriter">
      {rendered}
      <span className="brand-cursor" aria-hidden>|</span>
    </span>
  );
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  const { t, lang } = useLanguage();

  const features = [
    { icon: FiShield, title: t('auth.brandFeat1Title'), desc: t('auth.brandFeat1Desc') },
    { icon: FiRefreshCw, title: t('auth.brandFeat2Title'), desc: t('auth.brandFeat2Desc') },
    { icon: FiSmartphone, title: t('auth.brandFeat3Title'), desc: t('auth.brandFeat3Desc') },
    { icon: FiTruck, title: t('auth.brandFeat4Title'), desc: t('auth.brandFeat4Desc') },
  ];
  const headline = t('auth.brandHeadline');

  return (
    <div className="auth-split" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="auth-split-brand">
        <div className="auth-split-brand-glow" />
        <div className="auth-split-brand-top">
          <Link to="/" className="auth-split-logo">
            <img src="/logo.png" alt="Occasion & Garantie" className="auth-split-logo-img" />
            <span className="auth-split-logo-text">Occasion &amp; Garantie</span>
          </Link>
        </div>

        <div className="auth-split-brand-body">
          <div className="auth-split-brand-greeting">
            <span className="auth-split-brand-eyebrow">{t('auth.brandEyebrow')}</span>
            <h2 style={{ minHeight: '84px' }}><TypewriterHeadline text={headline} /></h2>
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
          <div className="auth-split-brand-copy">
            &copy; {new Date().getFullYear()} Occasion &amp; Garantie · Maroc
          </div>
        </div>
      </div>

      <div className="auth-split-form">
        <div className="auth-split-form-inner">
          <div className="auth-split-mobile-brand">
            <img src="/logo.png" alt="Occasion & Garantie" className="auth-split-logo-img" />
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