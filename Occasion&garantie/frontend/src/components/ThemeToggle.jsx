import { useState, useRef, useEffect } from 'react';
import { FiCheck } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function ThemeToggle() {
  const { theme, setTheme, themes } = useTheme();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentTheme = themes.find((th) => th.id === theme) || themes[0];

  return (
    <div className="theme-picker" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="theme-toggle"
        title="Changer de theme"
        aria-label="Changer de theme"
      >
        <span
          className="theme-sphere"
          style={{ background: currentTheme.color, '--sphere-highlight': 'rgba(255,255,255,0.75)', '--sphere-shadow': 'rgba(0,0,0,0.25)' }}
        >
          <span className="theme-sphere-gloss" />
        </span>
      </button>
      {open && (
        <div className="theme-menu">
          <div className="theme-menu-title">{t('nav.themeTitle')}</div>
          <div className="theme-menu-grid">
            {themes.map((th) => (
              <button
                key={th.id}
                className={`theme-swatch ${th.id === theme ? 'active' : ''}`}
                onClick={() => { setTheme(th.id); setOpen(false); }}
                title={th.label}
              >
                <span
                  className="theme-swatch-preview"
                  style={{
                    background: th.color,
                    borderColor: th.id === theme ? th.accent : undefined,
                  }}
                >
                  <span className="theme-preview-card" style={{ background: th.card }}>
                    <span className="theme-preview-line" style={{ background: th.text }} />
                    <span className="theme-preview-line short" style={{ background: th.text }} />
                    <span className="theme-preview-btn" style={{ background: th.accent }} />
                  </span>
                </span>
                <span className="theme-swatch-label">{th.label}</span>
                {th.id === theme && <FiCheck className="theme-swatch-check" size={12} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}