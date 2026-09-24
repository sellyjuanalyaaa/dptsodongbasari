import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

function clearLocalAuth() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const savedUser = localStorage.getItem('admin_user');

    if (!token || !savedUser) {
      clearLocalAuth();
      setLoading(false);
      return;
    }

    // Validasi token ke server — jangan percaya localStorage saja
    (async () => {
      try {
        const res = await api.get('/me');
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('admin_user', JSON.stringify(res.data.user));
        } else {
          clearLocalAuth();
          setUser(null);
        }
      } catch {
        clearLocalAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    setUser(user);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (_) {
      // token mungkin sudah kedaluwarsa — tetap bersihkan lokal
    }
    clearLocalAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
