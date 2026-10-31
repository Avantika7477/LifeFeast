import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { adminAPI, notificationAPI } from '../api';
import { useAuth } from './AuthContext';

const SignalsContext = createContext(null);

export function SignalsProvider({ children }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [feedbackUnread, setFeedbackUnread] = useState(0);
  const isAdmin = user?.role === 'admin';

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

  const refreshFeedbackUnread = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setFeedbackUnread(0);
      return 0;
    }
    try {
      const { data } = await adminAPI.feedbackUnread();
      const count = Number(data?.count) || 0;
      setFeedbackUnread(count);
      return count;
    } catch {
      return 0;
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      setFeedbackUnread(0);
      return undefined;
    }
    refreshUnread();
    refreshFeedbackUnread();
    const timer = setInterval(() => {
      refreshUnread();
      refreshFeedbackUnread();
    }, 45000);
    return () => clearInterval(timer);
  }, [user, isAdmin, refreshUnread, refreshFeedbackUnread]);

  return (
    <SignalsContext.Provider value={{ unread, refreshUnread, feedbackUnread, refreshFeedbackUnread }}>
      {children}
    </SignalsContext.Provider>
  );
}

export const useSignals = () => {
  const ctx = useContext(SignalsContext);
  if (!ctx) throw new Error('useSignals must be used within SignalsProvider');
  return ctx;
};
