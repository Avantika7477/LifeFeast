import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { progressAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import ProgressRing from '../components/common/ProgressRing';
import { displayDate } from '../utils/constants';

export default function Dashboard() {
  const { user, quote } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressAPI
      .dashboard()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const stats = [
    { label: 'Level', value: data?.level ?? user?.level, icon: '⚔️' },
    { label: 'XP', value: data?.xp ?? user?.xp, icon: '✨' },
    { label: 'Streak', value: `${data?.currentStreak ?? 0} 🔥`, icon: '🔥' },
    { label: 'Coins', value: data?.coins ?? user?.coins, icon: '🪙' },
    { label: 'Daily', value: `${data?.dailyProgress ?? 0}%`, icon: '📅' },
    { label: 'Monthly', value: `${data?.monthlyProgress ?? 0}%`, icon: '📊' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Welcome {user?.name} 👋</h2>
          <p>{displayDate()}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ProgressRing progress={data?.xpProgress || 0} size={64} stroke={5} color="#0D9488" />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div>Level {data?.level}</div>
            <div>
              {data?.xp} / {data?.xpForNext} XP
            </div>
          </div>
        </div>
      </div>

      {quote && (
        <motion.blockquote
          className="quote-banner glass"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
        >
          &ldquo;{quote.quote}&rdquo;
          <cite>— {quote.author}</cite>
        </motion.blockquote>
      )}

      <div className="stats-grid">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="stat-card glass"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <span className="stat-icon">{s.icon}</span>
          </motion.div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="glass chart-card">
          <h3>Today&apos;s Progress</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <ProgressRing progress={data?.dailyProgress || 0} size={100} stroke={8} color="#22C55E" />
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {data?.habitsCompletedToday}/{data?.habitsTotal}
              </p>
              <p style={{ color: 'var(--text-muted)' }}>habits completed</p>
            </div>
          </div>
        </div>
        <div className="glass chart-card">
          <h3>Your Badges</h3>
          {(data?.badges?.length || 0) === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Complete habits to unlock badges!</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {data.badges.map((b) => (
                <div key={b.id} className="pill" title={b.description}>
                  {b.icon} {b.name}
                </div>
              ))}
            </div>
          )}
          <p style={{ marginTop: '1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Longest streak: {data?.longestStreak || 0} days
          </p>
        </div>
      </div>
    </div>
  );
}
