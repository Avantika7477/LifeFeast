import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { progressAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import ProgressRing from '../components/common/ProgressRing';
import { displayDate, questGreeting, streakCopy } from '../utils/constants';

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

  const greeting = questGreeting(user?.name);
  const level = data?.level ?? user?.level ?? 1;
  const xp = data?.xp ?? user?.xp ?? 0;
  const xpForNext = data?.xpForNext ?? 0;
  const xpLeft = Math.max(0, xpForNext - xp);
  const xpProgress = Math.min(100, Math.max(0, data?.xpProgress || 0));
  const streak = data?.currentStreak ?? user?.currentStreak ?? 0;
  const coins = data?.coins ?? user?.coins ?? 0;
  const daily = data?.dailyProgress ?? 0;
  const monthly = data?.monthlyProgress ?? 0;
  const done = data?.habitsCompletedToday ?? 0;
  const total = data?.habitsTotal ?? 0;
  const hasHabits = total > 0;

  const stats = [
    { label: 'Level', value: level, icon: '⚔️', hint: 'Your legend grows' },
    { label: 'XP', value: xp, icon: '✨', hint: xpLeft ? `${xpLeft} XP to the next level` : 'Keep stacking wins' },
    { label: 'Streak', value: `${streak} 🔥`, icon: '🔥', hint: streakCopy(streak) },
    { label: 'Coins', value: coins, icon: '🪙', hint: 'Earned by showing up' },
    { label: 'Today', value: `${daily}%`, icon: '📅', hint: hasHabits ? `${done} of ${total} habits done` : 'Forge your first habit' },
    { label: 'This month', value: `${monthly}%`, icon: '📊', hint: 'The long game' },
  ];

  return (
    <div>
      <motion.section
        className="hero-quest glass"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="hero-quest-copy">
          <p className="quest-kicker">{greeting.kicker}</p>
          <h2>{greeting.title}</h2>
          <p className="hero-quest-date">{displayDate()}</p>
        </div>

        <div className="quest-bar-wrap">
          <div className="quest-bar-meta">
            <span>Level {level}</span>
            <span>
              {xp} / {xpForNext} XP
            </span>
          </div>
          <div className="quest-bar" role="progressbar" aria-valuenow={xpProgress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${xpProgress}%` }} />
          </div>
          <p className="quest-bar-hint">
            {xpLeft > 0 ? `${xpLeft} XP until Level ${level + 1}. Every habit counts.` : 'You are ready for the next chapter.'}
          </p>
        </div>

        <div className="hero-quest-actions">
          <Link to="/habits" className="btn btn-primary">
            {hasHabits ? "Continue today's quest" : 'Begin your first quest'}
          </Link>
          <Link to="/missions" className="btn btn-ghost">
            View missions
          </Link>
        </div>
      </motion.section>

      {quote && (
        <motion.blockquote
          className="quote-banner glass"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="quote-kicker">Daily prophecy</p>
          <p className="quote-text">&ldquo;{quote.quote}&rdquo;</p>
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
            <p className="stat-hint">{s.hint}</p>
            <span className="stat-icon">{s.icon}</span>
          </motion.div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="glass chart-card">
          <h3>Today&apos;s progress</h3>
          <div className="today-progress">
            <ProgressRing progress={daily} size={100} stroke={8} color="#06D6A0" />
            <div>
              <p className="today-progress-count">
                {done}/{total}
              </p>
              <p className="today-progress-label">
                {hasHabits ? 'habits completed — keep the fire lit' : 'no habits yet — start with one'}
              </p>
            </div>
          </div>
        </div>
        <div className="glass chart-card">
          <h3>Your badges</h3>
          {(data?.badges?.length || 0) === 0 ? (
            <p className="empty-inline">No badges yet. Your first one is one habit away.</p>
          ) : (
            <div className="badge-row">
              {data.badges.map((b) => (
                <div key={b.id} className="pill" title={b.description}>
                  {b.icon} {b.name}
                </div>
              ))}
            </div>
          )}
          <p className="longest-streak">Longest streak: {data?.longestStreak || 0} days of proving it</p>
        </div>
      </div>
    </div>
  );
}
