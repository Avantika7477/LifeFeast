import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { authAPI } from '../api';
import { DEFAULT_LANG, isLang, langMeta, tWithLang } from '../i18n';

const LanguageContext = createContext(null);

function readStored() {
  try {
    const stored = localStorage.getItem('lq_lang');
    if (isLang(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_LANG;
}

export function LanguageProvider({ children }) {
  const { user, updateUserLocal } = useAuth();
  const [language, setLanguageState] = useState(readStored);

  useEffect(() => {
    if (user?.language && isLang(user.language)) {
      setLanguageState(user.language);
    }
  }, [user?.language]);

  useEffect(() => {
    const meta = langMeta(language);
    document.documentElement.setAttribute('lang', meta.locale);
    document.documentElement.setAttribute('dir', meta.dir);
    localStorage.setItem('lq_lang', language);
  }, [language]);

  const setLanguage = useCallback(
    async (next) => {
      if (!isLang(next)) return;
      setLanguageState(next);
      localStorage.setItem('lq_lang', next);
      if (user) {
        try {
          await authAPI.updateProfile({ language: next });
          updateUserLocal({ language: next });
        } catch {
          /* language still applied locally */
        }
      }
    },
    [user, updateUserLocal],
  );

  const t = useCallback((key, vars) => tWithLang(language, key, vars), [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t, meta: langMeta(language), locale: langMeta(language).locale }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
