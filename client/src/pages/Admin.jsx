import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSignals } from '../context/SignalsContext';
import Loader from '../components/common/Loader';

const TABS = ['users', 'feedback', 'analytics', 'badges', 'reports'];

function starLabel(n) {
  if (!n) return '';
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

export default function Admin() {
  const { showToast } = useAuth();
  const { feedbackUnread, refreshFeedbackUnread } = useSignals();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const tab = TABS.includes(requested) ? requested : 'users';
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [badges, setBadges] = useState([]);
  const [reports, setReports] = useState(null);
  const [feedback, setFeedback] = useState({ items: [], stats: {} });
  const [feedbackFilter, setFeedbackFilter] = useState({ kind: 'all', status: 'open' });
  const [loading, setLoading] = useState(true);

  const setTab = (next) => {
    if (next === 'users') setSearchParams({});
    else setSearchParams({ tab: next });
  };

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'users') {
        const { data } = await adminAPI.users();
        setUsers(data);
      } else if (tab === 'feedback') {
        const params = {};
        if (feedbackFilter.kind !== 'all') params.kind = feedbackFilter.kind;
        if (feedbackFilter.status !== 'all') params.status = feedbackFilter.status;
        const { data } = await adminAPI.feedback(params);
        setFeedback(data);
        await adminAPI.feedbackSeen();
        refreshFeedbackUnread();
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
  }, [tab, feedbackFilter.kind, feedbackFilter.status]);

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

  const revert = async (id) => {
    try {
      await adminAPI.revertFeedback(id);
      showToast('Reverted. Hidden from the public wall if it was a review.');
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Could not revert', 'error');
    }
  };

  const restore = async (id) => {
    try {
      await adminAPI.restoreFeedback(id);
      showToast('Restored');
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Could not restore', 'error');
    }
  };

  const stats = feedback.stats || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Admin Panel</h2>
          <p>Manage users, feedback, badges & reports</p>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'feedback' && feedbackUnread > 0 ? ` (${feedbackUnread})` : ''}
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
      ) : tab === 'feedback' ? (
        <div>
          <div className="stats-grid">
            <div className="stat-card glass">
              <div className="stat-label">Open</div>
              <div className="stat-value">{stats.open ?? 0}</div>
            </div>
            <div className="stat-card glass">
              <div className="stat-label">Private notes</div>
              <div className="stat-value">{stats.improve ?? 0}</div>
            </div>
            <div className="stat-card glass">
              <div className="stat-label">Reviews</div>
              <div className="stat-value">{stats.reviews ?? 0}</div>
            </div>
            <div className="stat-card glass">
              <div className="stat-label">Reverted</div>
              <div className="stat-value">{stats.reverted ?? 0}</div>
            </div>
          </div>

          <div className="tabs">
            {[
              { id: 'all', label: 'All kinds' },
              { id: 'review', label: 'Reviews' },
              { id: 'improve', label: 'Private notes' },
            ].map((opt) => (
              <button
                key={opt.id}
                className={`tab ${feedbackFilter.kind === opt.id ? 'active' : ''}`}
                onClick={() => setFeedbackFilter((prev) => ({ ...prev, kind: opt.id }))}
              >
                {opt.label}
              </button>
            ))}
            {[
              { id: 'open', label: 'Open' },
              { id: 'reverted', label: 'Reverted' },
              { id: 'all', label: 'All status' },
            ].map((opt) => (
              <button
                key={`status-${opt.id}`}
                className={`tab ${feedbackFilter.status === opt.id ? 'active' : ''}`}
                onClick={() => setFeedbackFilter((prev) => ({ ...prev, status: opt.id }))}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {(feedback.items || []).length === 0 ? (
            <div className="empty-state glass">
              <div className="empty-icon">📥</div>
              <h3>No notes here</h3>
              <p>Reviews and private improvement messages from users will land in this inbox.</p>
            </div>
          ) : (
            <ul className="feedback-list">
              {(feedback.items || []).map((item) => (
                <li
                  key={item._id}
                  className={`glass feedback-card ${item.reverted ? 'reverted' : ''} ${
                    item.seenByAdmin ? '' : 'unread'
                  }`}
                >
                  <div className="feedback-meta">
                    <span className={`pill ${item.kind === 'improve' ? 'pill-amber' : 'pill-green'}`}>
                      {item.kind === 'improve' ? 'Private note' : 'Review'}
                    </span>
                    {item.reverted ? <span className="pill pill-red">Reverted</span> : null}
                    {item.kind === 'review' && item.rating ? (
                      <span className="feedback-stars">{starLabel(item.rating)}</span>
                    ) : null}
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="feedback-admin-user">
                    <strong>{item.user?.name || 'Deleted user'}</strong>
                    {item.user?.email ? <span>{item.user.email}</span> : null}
                  </div>
                  {item.title ? <h4>{item.title}</h4> : null}
                  <p className="feedback-message">{item.message}</p>
                  <div className="feedback-actions">
                    {item.reverted ? (
                      <button className="btn btn-primary btn-sm" onClick={() => restore(item._id)}>
                        Restore
                      </button>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={() => revert(item._id)}>
                        Revert
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
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
