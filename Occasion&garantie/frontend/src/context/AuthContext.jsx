import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then((res) => { if (!cancelled) setUser(res.data); })
        .catch(() => { if (!cancelled) localStorage.removeItem('token'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    } else {
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, []);

  const login = async (email, password, latitude, longitude) => {
    const { data } = await api.post('/auth/login', { email, password, latitude, longitude });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ id: data.user.id, role: data.user.role, full_name: data.user.full_name, fullName: data.user.fullName }));
    setUser(data.user);
    return data;
  };

  const signup = async (fullName, email, password, phone) => {
    const { data } = await api.post('/auth/signup', { fullName, email, password, phone });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ id: data.user.id, role: data.user.role, full_name: data.user.full_name, fullName: data.user.fullName }));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.suspended) {
        logout();
      }
      console.error('refreshUser failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
