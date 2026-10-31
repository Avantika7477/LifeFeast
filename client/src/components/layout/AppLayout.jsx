import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Target,
  CalendarDays,
  BarChart3,
  ListTodo,
  BookOpen,
  Trophy,
  Swords,
  Flame,
  Bell,
  Settings,
  MessageSquareHeart,
  Shield,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Coins,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSignals } from '../../context/SignalsContext';
import Toast from '../common/Toast';
import LanguageSelect from '../common/LanguageSelect';
import UnfinishedReminder from '../tasks/UnfinishedReminder';
import { motion } from 'framer-motion';

const links = [
  { to: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/habits', key: 'nav.training', icon: Target },
  { to: '/calendar', key: 'nav.calendar', icon: CalendarDays },
  { to: '/analytics', key: 'nav.chronicle', icon: BarChart3 },
  { to: '/missions', key: 'nav.missions', icon: Swords },
  { to: '/leaderboard', key: 'nav.heroes', icon: Trophy },
  { to: '/campfire', key: 'nav.campfire', icon: Flame },
  { to: '/tasks', key: 'nav.questLog', icon: ListTodo },
  { to: '/journal', key: 'nav.journal', icon: BookOpen },
  { to: '/notifications', key: 'nav.signals', icon: Bell },
  { to: '/feedback', key: 'nav.feedback', icon: MessageSquareHeart },
  { to: '/settings', key: 'nav.settings', icon: Settings },
];

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { unread, feedbackUnread } = useSignals();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const unreadLabel = unread > 99 ? '99+' : String(unread);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link to="/" className="sidebar-brand">
          <div className="logo-mark">⚔️</div>
          <h1>LifeQuest</h1>
        </Link>
        <nav className="nav-links">
          {links.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {t(key)}
              {to === '/notifications' && unread > 0 && (
                <span className="nav-unread" aria-label={t('nav.unreadSignals', { count: unread })}>
                  {unreadLabel}
                </span>
              )}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Shield size={18} />
              {t('nav.admin')}
              {feedbackUnread > 0 && (
                <span className="nav-unread" aria-label={t('nav.unreadFeedback', { count: feedbackUnread })}>
                  {feedbackUnread > 99 ? '99+' : String(feedbackUnread)}
                </span>
              )}
            </NavLink>
          )}
        </nav>
        <button className="nav-link" onClick={handleLogout} style={{ marginTop: '0.5rem' }}>
          <LogOut size={18} />
          {t('nav.logout')}
        </button>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-meta">
            <button
              className="btn-icon mobile-toggle"
              onClick={() => setOpen(!open)}
              aria-label={open ? t('common.closeMenu') : t('common.openMenu')}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="user-chip" title={user?.name}>
              <div className="avatar" aria-hidden="true">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="user-chip-text">
                <div className="user-chip-name">{user?.name}</div>
                <div className="user-chip-meta">{t('nav.levelXp', { level: user?.level, xp: user?.xp })}</div>
              </div>
            </div>
          </div>
          <div className="topbar-actions">
            <LanguageSelect compact id="app-language" />
            <span className="pill pill-amber topbar-stat" title={t('nav.coins')}>
              <Coins size={14} /> <span>{user?.coins ?? 0}</span>
            </span>
            <span className="pill topbar-stat" title={t('nav.streak')}>
              🔥 <span>{user?.currentStreak ?? 0}</span>
              <span className="pill-extra"> {t('nav.days')}</span>
            </span>
            <button className="btn-icon" onClick={toggleTheme} title={t('common.toggleTheme')} aria-label={t('common.toggleTheme')}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <motion.main
          className="page-content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          key={location.pathname}
        >
          <Outlet />
        </motion.main>
      </div>
      <UnfinishedReminder />
      <Toast />
    </div>
  );
}
