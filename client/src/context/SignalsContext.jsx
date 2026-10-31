import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { notificationAPI } from '../api';
import { useAuth } from './AuthContext';

const SignalsContext = createContext(null);

export function SignalsProvider({ children }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!user) {
      setUnread(0);
      return 0;
    }
    try {
      const { data } = await notificationAPI.unreadCount();
      const count = Number(data?.count) || 0;
      setUnread(count);
      return count;
    } catch {
      return 0;
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return undefined;
    }
    refreshUnread();
    const timer = setInterval(refreshUnread, 45000);
    return () => clearInterval(timer);
  }, [user, refreshUnread]);

  return (
    <SignalsContext.Provider value={{ unread, refreshUnread }}>
      {children}
    </SignalsContext.Provider>
  );
}

export const useSignals = () => {
  const ctx = useContext(SignalsContext);
  if (!ctx) throw new Error('useSignals must be used within SignalsProvider');
  return ctx;
};
