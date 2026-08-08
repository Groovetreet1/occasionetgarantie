import { useMemo } from 'react';

const SIZES = { sm: 30, md: 34, lg: 38 };

export default function CircleIconButton({ color = '#3b82f6', size = 'md', disabled = false, onClick, title, type = 'button', children }) {
  const dim = SIZES[size] || 34;
  const hoverShadow = useMemo(() => `0 6px 16px ${color}73`, [color]);
  const baseShadow = useMemo(() => `0 4px 12px ${color}59`, [color]);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: dim, height: dim, flexShrink: 0, padding: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '50%', background: color, color: '#fff',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1, lineHeight: 1,
        boxShadow: baseShadow,
        transition: 'transform .15s ease, box-shadow .15s ease'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = hoverShadow; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = baseShadow; }}
    >
      {children}
    </button>
  );
}