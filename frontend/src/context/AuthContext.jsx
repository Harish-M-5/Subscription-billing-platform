import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints';
import { getAuthItem, setAuthItem, clearAuthStorage } from '../utils/sessionAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = getAuthItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [business, setBusiness] = useState(() => {
    const raw = getAuthItem('business');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  const persist = useCallback((token, u, b) => {
    if (token) setAuthItem('token', token);
    if (u) setAuthItem('user', JSON.stringify(u));
    if (b) setAuthItem('business', JSON.stringify(b));
    setUser(u || null);
    setBusiness(b || null);
  }, []);

  useEffect(() => {
    const token = getAuthItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        setUser(res.data.user);
        setBusiness(res.data.business);
        setAuthItem('user', JSON.stringify(res.data.user));
        if (res.data.business) setAuthItem('business', JSON.stringify(res.data.business));
      })
      .catch(() => {
        clearAuthStorage();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    persist(res.data.token, res.data.user, res.data.business);
    return res.data;
  };

  const registerBusiness = async (data) => {
    const res = await authApi.registerBusiness(data);
    persist(res.data.token, res.data.user, res.data.business);
    return res.data;
  };

  const registerCustomer = async (data) => {
    const res = await authApi.registerCustomer(data);
    persist(res.data.token, res.data.user, res.data.business);
    return res.data;
  };

  const logout = () => {
    clearAuthStorage();
    setUser(null);
    setBusiness(null);
  };

  return (
    <AuthContext.Provider value={{ user, business, loading, login, registerBusiness, registerCustomer, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
