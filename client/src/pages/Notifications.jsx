import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSignals } from '../context/SignalsContext';
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
  const { t, locale } = useLanguage();
  const { refreshUnread } = useSignals();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await notificationAPI.getAll();
      setItems(data);
      refreshUnread();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openSignal = async (n) => {
    if (!n.read) {
      await notificationAPI.markRead(n._id);
      setItems((prev) => prev.map((item) => (item._id === n._id ? { ...item, read: true } : item)));
      refreshUnread();
    }
    const taskId = n.meta?.taskId;
    if (taskId) {
      navigate(`/tasks?task=${taskId}&type=${n.meta?.type || 'daily'}`);
      return;
    }
    if (n.meta?.kind === 'challenge' || n.meta?.challengeId) {
      navigate('/missions');
      return;
    }
    if (n.meta?.kind === 'friend-request' || n.meta?.kind === 'friend-declined') {
      navigate('/leaderboard?tab=friends');
      return;
    }
    if (n.meta?.kind === 'friend-accepted' && n.meta?.friendId) {
      navigate(`/campfire?friend=${n.meta.friendId}`);
      return;
    }
    if (n.meta?.kind === 'feedback') {
      navigate('/admin?tab=feedback');
      return;
    }
    if (n.meta?.friendId) {
      navigate(`/campfire?friend=${n.meta.friendId}`);
    }
  };

  const markAll = async () => {
    await notificationAPI.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    refreshUnread();
    showToast(t('signals.marked'));
  };

  const generate = async () => {
    await notificationAPI.generateDaily();
    showToast(t('signals.generated'));
    load();
  };

  const remove = async (id) => {
    await notificationAPI.remove(id);
    setItems((prev) => prev.filter((n) => n._id !== id));
    refreshUnread();
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('signals.title')}</h2>
          <p>{t('signals.lead')}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={generate}>
            {t('signals.generate')}
          </button>
          <button className="btn btn-primary btn-sm" onClick={markAll}>
            {t('signals.markAll')}
          </button>
        </div>
      </div>

      <div className="glass">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>{t('signals.emptyTitle')}</h3>
            <p>{t('signals.empty')}</p>
          </div>
        ) : (
          items.map((n) => (
            <div
              key={n._id}
              className={`notif-item ${!n.read ? 'unread' : ''} ${
                n.meta?.taskId || n.meta?.challengeId || n.meta?.friendId || n.meta?.kind === 'feedback'
                  ? 'has-task'
                  : ''
              }`}
              onClick={() => openSignal(n)}
              role={
                n.meta?.taskId || n.meta?.challengeId || n.meta?.friendId || n.meta?.kind === 'feedback'
                  ? 'link'
                  : 'button'
              }
            >
              <span style={{ fontSize: '1.5rem' }}>{typeIcon[n.type] || 'ℹ️'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{n.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{n.message}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
                  {new Date(n.createdAt).toLocaleString(locale)}
                  {n.meta?.taskId ? ` · ${t('signals.openTask')}` : ''}
                  {n.meta?.kind === 'challenge' || n.meta?.challengeId ? ` · ${t('signals.openChallenge')}` : ''}
                  {n.meta?.kind === 'friend-request' ? ` · ${t('signals.openRequest')}` : ''}
                  {n.meta?.kind === 'friend-accepted' ? ` · ${t('signals.openCampfire')}` : ''}
                  {n.meta?.kind === 'feedback' ? ` · ${t('signals.openFeedback')}` : ''}
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
