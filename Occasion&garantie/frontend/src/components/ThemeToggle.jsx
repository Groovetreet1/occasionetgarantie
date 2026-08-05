import { useState, useRef, useEffect } from 'react';
import { FiCheck } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentTheme = themes.find((t) => t.id === theme) || themes[0];

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
          <div className="theme-menu-title">Choisissez un fond</div>
          <div className="theme-menu-grid">
            {themes.map((t) => (
              <button
                key={t.id}
                className={`theme-swatch ${t.id === theme ? 'active' : ''}`}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                title={t.label}
              >
                <span className="theme-swatch-dot" style={{ background: t.color, borderColor: t.text }} />
                <span className="theme-swatch-label">{t.label}</span>
                {t.id === theme && <FiCheck className="theme-swatch-check" size={12} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
