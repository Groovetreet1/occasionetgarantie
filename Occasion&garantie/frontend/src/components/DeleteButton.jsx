import CircleIconButton from './CircleIconButton';

export default function DeleteButton({ size = 14, disabled = false, onClick, title, children }) {
  return (
    <CircleIconButton color="#dc2626" size={size >= 16 ? 'lg' : size <= 12 ? 'sm' : 'md'} disabled={disabled} onClick={onClick} title={title}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </CircleIconButton>
  );
}