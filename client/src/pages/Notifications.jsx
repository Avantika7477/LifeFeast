import { useEffect, useState } from 'react';
import { notificationAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const typeIcon = {
  reminder: '⏰',
  motivation: '💫',
  achievement: '🏆',
  missed: '⚠️',
  system: 'ℹ️',
};

export default function Notifications() {
  const { showToast } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await notificationAPI.getAll();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await notificationAPI.markRead(id);
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  };

  const markAll = async () => {
    await notificationAPI.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All marked as read');
  };

  const generate = async () => {
    const { data } = await notificationAPI.generateDaily();
    showToast('Daily notifications generated');
    load();
  };

  const remove = async (id) => {
    await notificationAPI.remove(id);
    setItems((prev) => prev.filter((n) => n._id !== id));
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Notifications</h2>
          <p>Reminders, motivation & achievements</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={generate}>
            Generate Daily
          </button>
          <button className="btn btn-primary btn-sm" onClick={markAll}>
            Mark All Read
          </button>
        </div>
      </div>

      <div className="glass">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <p>No notifications yet</p>
          </div>
        ) : (
          items.map((n) => (
            <div
              key={n._id}
              className={`notif-item ${!n.read ? 'unread' : ''}`}
              onClick={() => !n.read && markRead(n._id)}
            >
              <span style={{ fontSize: '1.5rem' }}>{typeIcon[n.type] || 'ℹ️'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{n.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{n.message}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                className="btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(n._id);
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
