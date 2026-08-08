const DELETE_STYLE = {
  width: '34px', height: '34px', flexShrink: 0,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '50%', background: '#dc2626', color: '#fff',
  border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.35)',
  transition: 'transform .15s ease, box-shadow .15s ease'
};

export default function DeleteButton({ size = 14, disabled = false, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={DELETE_STYLE}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(220,38,38,0.45)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,0.35)'; }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </button>
  );
}