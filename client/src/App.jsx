import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { SignalsProvider } from './context/SignalsContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Loader from './components/common/Loader';
import InstallBanner from './components/common/InstallBanner';

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Habits = lazy(() => import('./pages/Habits'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Missions = lazy(() => import('./pages/Missions'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Journal = lazy(() => import('./pages/Journal'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Campfire = lazy(() => import('./pages/Campfire'));
const Settings = lazy(() => import('./pages/Settings'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Admin = lazy(() => import('./pages/Admin'));
const TaskAlarm = lazy(() => import('./components/tasks/TaskAlarm'));
const ChatNotify = lazy(() => import('./components/chat/ChatNotify'));

function PageFallback() {
  return <Loader text="Loading..." />;
}

function LoggedInBackground() {
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setReady(false);
      return undefined;
    }
    // Let dashboard paint first; alarms/chat polls start a moment later.
    const timer = setTimeout(() => setReady(true), 2200);
    return () => clearTimeout(timer);
  }, [user]);

  if (loading || !user || !ready) return null;
  return (
    <Suspense fallback={null}>
      <TaskAlarm />
      <ChatNotify />
    </Suspense>
  );
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  if (loading) return <Loader text={t('common.preparing')} />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <SignalsProvider>
              <InstallBanner />
              <LoggedInBackground />
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route
                    path="/login"
                    element={
                      <PublicOnly>
                        <Login />
                      </PublicOnly>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicOnly>
                        <Register />
                      </PublicOnly>
                    }
                  />
                  <Route
                    path="/forgot-password"
                    element={
                      <PublicOnly>
                        <ForgotPassword />
                      </PublicOnly>
                    }
                  />

                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/habits" element={<Habits />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/missions" element={<Missions />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/campfire" element={<Campfire />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/journal" element={<Journal />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/feedback" element={<Feedback />} />
                      <Route path="/settings" element={<Settings />} />
                    </Route>
                  </Route>

                  <Route element={<ProtectedRoute adminOnly />}>
                    <Route element={<AppLayout />}>
                      <Route path="/admin" element={<Admin />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </SignalsProvider>
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
