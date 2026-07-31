const API_BASE = import.meta.env.VITE_API_URL || '';

export function imgUrl(path) {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}/uploads/${path}`;
}

export function avatarUrl(path) {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}/uploads/avatars/${path}`;
}

export function toWhatsAppNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';
  let p = phone.replace(/[\s\-().]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('212') && p.length === 12) return p;
  if (p.startsWith('0') && p.length === 10) return '212' + p.slice(1);
  return p;
}
