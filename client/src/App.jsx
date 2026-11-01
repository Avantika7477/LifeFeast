import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { SignalsProvider } from './context/SignalsContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Loader from './components/common/Loader';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import Missions from './pages/Missions';
import Leaderboard from './pages/Leaderboard';
import Tasks from './pages/Tasks';
import Journal from './pages/Journal';
import Notifications from './pages/Notifications';
import Campfire from './pages/Campfire';
import Settings from './pages/Settings';
import Feedback from './pages/Feedback';
import Admin from './pages/Admin';
import Home from './pages/Home';
import InstallBanner from './components/common/InstallBanner';
import TaskAlarm from './components/tasks/TaskAlarm';
import ChatNotify from './components/chat/ChatNotify';

function LoggedInAlarms() {
  const { user, loading } = useAuth();
  if (loading || !user) return null;
  return (
    <>
      <TaskAlarm />
      <ChatNotify />
    </>
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
          <LoggedInAlarms />
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
          </SignalsProvider>
        </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
