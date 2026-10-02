import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lq_user')) || null;
    } catch {
      return null;
    }
  });
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const persist = (token, userData) => {
    localStorage.setItem('lq_token', token);
    localStorage.setItem('lq_user', JSON.stringify(userData));
    setUser(userData);
  };

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.me();
      setUser(data.user);
      setQuote(data.quote);
      localStorage.setItem('lq_user', JSON.stringify(data.user));
      return data.user;
    } catch {
      logout();
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('lq_token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    persist(data.token, data.user);
    showToast(`Welcome back, ${data.user.name}!`);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    persist(data.token, data.user);
    showToast('Account created! Your quest begins.');
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('lq_token');
    localStorage.removeItem('lq_user');
    setUser(null);
  };

  const updateUserLocal = (partial) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      localStorage.setItem('lq_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        quote,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateUserLocal,
        showToast,
        toast,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
