import { useEffect, useState } from 'react';
import { adminAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

export default function Admin() {
  const { showToast } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [badges, setBadges] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'users') {
        const { data } = await adminAPI.users();
        setUsers(data);
      } else if (tab === 'analytics') {
        const { data } = await adminAPI.analytics();
        setAnalytics(data);
      } else if (tab === 'badges') {
        const { data } = await adminAPI.badges();
        setBadges(data);
      } else {
        const { data } = await adminAPI.reports();
        setReports(data);
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Admin load failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const toggle = async (id) => {
    await adminAPI.toggleUser(id);
    showToast('User status updated');
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this user?')) return;
    await adminAPI.deleteUser(id);
    showToast('User deleted');
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Admin Panel</h2>
          <p>Manage users, badges & reports</p>
        </div>
      </div>

      <div className="tabs">
        {['users', 'analytics', 'badges', 'reports'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : tab === 'users' ? (
        <div className="glass table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Level</th>
                <th>XP</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="pill">{u.role}</span>
                  </td>
                  <td>{u.level}</td>
                  <td>{u.xp}</td>
                  <td>
                    <span className={`pill ${u.isActive ? 'pill-green' : 'pill-red'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggle(u._id)}>
                      Toggle
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(u._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'analytics' && analytics ? (
        <div className="stats-grid">
          <div className="stat-card glass">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{analytics.totalUsers}</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-label">Active Users</div>
            <div className="stat-value">{analytics.activeUsers}</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-label">Total Habits</div>
            <div className="stat-value">{analytics.totalHabits}</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-label">Avg Completion</div>
            <div className="stat-value">{analytics.avgCompletion}%</div>
          </div>
        </div>
      ) : tab === 'badges' ? (
        <div className="badge-grid">
          {badges.map((b) => (
            <div key={b.id} className="badge-item glass">
              <div className="badge-icon">{b.icon}</div>
              <div style={{ fontWeight: 600 }}>{b.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{b.description}</div>
            </div>
          ))}
        </div>
      ) : reports ? (
        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>System Report</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Generated: {new Date(reports.generatedAt).toLocaleString()}
          </p>
          <h4 style={{ marginBottom: '0.5rem' }}>Habit Categories</h4>
          <ul style={{ marginBottom: '1.5rem' }}>
            {reports.habitCategories.map((c) => (
              <li key={c._id} style={{ padding: '0.35rem 0' }}>
                {c._id}: {c.count} habits · {c.completions} completions
              </li>
            ))}
          </ul>
          <p>Total registered users in report: {reports.users.length}</p>
        </div>
      ) : null}
    </div>
  );
}
