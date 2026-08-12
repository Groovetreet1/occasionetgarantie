const API_BASE = import.meta.env.VITE_API_URL || '';
const ASSET_BASE = API_BASE.replace(/\/api(\/)?$/, '');

function assetUrl(path) {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${ASSET_BASE}/uploads/${path}`;
}

function avatarAssetUrl(path) {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${ASSET_BASE}/uploads/avatars/${path}`;
}

export function imgUrl(path) {
  return assetUrl(path);
}

export function avatarUrl(path) {
  return avatarAssetUrl(path);
}

export function toWhatsAppNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';
  let p = phone.replace(/[\s\-().]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('212') && p.length === 12) return p;
  if (p.startsWith('0') && p.length === 10) return '212' + p.slice(1);
  return p;
}
