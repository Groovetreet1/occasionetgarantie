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
