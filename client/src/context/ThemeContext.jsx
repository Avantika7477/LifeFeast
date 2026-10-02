import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { authAPI } from '../api';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const { user, updateUserLocal } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('lq_theme') || 'dark');

  useEffect(() => {
    if (user?.theme) setTheme(user.theme);
  }, [user?.theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lq_theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (user) {
      try {
        await authAPI.updateProfile({ theme: next });
        updateUserLocal({ theme: next });
      } catch {
        /* theme still applied locally */
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
