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
  Bell,
  Settings,
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
import Toast from '../common/Toast';
import { motion } from 'framer-motion';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/habits', label: 'Training', icon: Target },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Chronicle', icon: BarChart3 },
  { to: '/missions', label: 'Missions', icon: Swords },
  { to: '/leaderboard', label: 'Heroes', icon: Trophy },
  { to: '/tasks', label: 'Quest Log', icon: ListTodo },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/notifications', label: 'Signals', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Shield size={18} />
              Admin
            </NavLink>
          )}
        </nav>
        <button className="nav-link" onClick={handleLogout} style={{ marginTop: '0.5rem' }}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-meta">
            <button
              className="btn-icon mobile-toggle"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="user-chip">
              <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Level {user?.level} · {user?.xp} XP
                </div>
              </div>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="pill pill-amber" title="Coins">
              <Coins size={14} /> {user?.coins ?? 0}
            </span>
            <span className="pill" title="Current streak">
              🔥 {user?.currentStreak ?? 0}
              <span className="pill-extra"> days</span>
            </span>
            <button className="btn-icon" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
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
      <Toast />
    </div>
  );
}
