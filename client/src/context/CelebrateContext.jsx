import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { playCheer } from '../utils/cheer';

const STORAGE_KEY = 'lq_cheer';
const CelebrateContext = createContext(null);

function readEnabled() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== '0';
  } catch {
    return true;
  }
}

export function CelebrateProvider({ children }) {
  const [enabled, setEnabled] = useState(readEnabled);
  const [burst, setBurst] = useState(0);

  const setCelebrations = useCallback((on) => {
    setEnabled(on);
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  }, []);

  const celebrate = useCallback(() => {
    if (!enabled) return;
    setBurst((n) => n + 1);
    playCheer().catch(() => {});
  }, [enabled]);

  const value = useMemo(
    () => ({ enabled, setCelebrations, celebrate, burst }),
    [enabled, setCelebrations, celebrate, burst]
  );

  return <CelebrateContext.Provider value={value}>{children}</CelebrateContext.Provider>;
}

export function useCelebrate() {
  const ctx = useContext(CelebrateContext);
  if (!ctx) throw new Error('useCelebrate must be used within CelebrateProvider');
  return ctx;
}
