import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
let onSuspended = null;
api.onUnauthorized = (fn) => { onUnauthorized = fn; };
api.onSuspended = (fn) => { onSuspended = fn; };

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data;
    if (err.response?.status === 403 && data?.suspended) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (onSuspended) onSuspended(data.suspension_reason || data.message || '');
      return Promise.reject(err);
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(err);
  }
);

export default api;
