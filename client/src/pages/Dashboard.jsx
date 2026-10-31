import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { progressAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Loader from '../components/common/Loader';
import ProgressRing from '../components/common/ProgressRing';
import { displayDate, firstName } from '../utils/constants';

function greeting(t, name) {
  const hour = new Date().getHours();
  const raw = firstName(name);
  const who = !raw || raw === 'hero' ? t('dash.heroFallback') : raw;
  if (hour < 12) return { kicker: t('dash.dawnKicker'), title: t('dash.dawnTitle', { who }) };
  if (hour < 17) return { kicker: t('dash.middayKicker'), title: t('dash.middayTitle', { who }) };
  if (hour < 21) return { kicker: t('dash.eveningKicker'), title: t('dash.eveningTitle', { who }) };
  return { kicker: t('dash.nightKicker'), title: t('dash.nightTitle', { who }) };
}

function streakHint(t, days) {
  const n = Number(days) || 0;
  if (n <= 0) return t('dash.streak0');
  if (n === 1) return t('dash.streak1');
  return t('dash.streakN', { n });
}

export default function Dashboard() {
  const { user, quote } = useAuth();
  const { t, locale } = useLanguage();
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

  const greet = greeting(t, user?.name);
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
    { label: t('dash.level'), value: level, icon: '⚔️', hint: t('dash.legendGrows') },
    { label: t('dash.xp'), value: xp, icon: '✨', hint: xpLeft ? t('dash.xpNext', { n: xpLeft }) : t('dash.keepWins') },
    { label: t('dash.streak'), value: `${streak} 🔥`, icon: '🔥', hint: streakHint(t, streak) },
    { label: t('dash.coins'), value: coins, icon: '🪙', hint: t('dash.coinsHint') },
    { label: t('dash.today'), value: `${daily}%`, icon: '📅', hint: hasHabits ? t('dash.todayHint', { done, total }) : t('dash.forgeFirst') },
    { label: t('dash.month'), value: `${monthly}%`, icon: '📊', hint: t('dash.longGame') },
  ];

  return (
    <div>
      <motion.section
        className="hero-quest glass"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="hero-quest-copy">
          <p className="quest-kicker">{greet.kicker}</p>
          <h2>{greet.title}</h2>
          <p className="hero-quest-date">{displayDate(new Date(), locale)}</p>
        </div>

        <div className="quest-bar-wrap">
          <div className="quest-bar-meta">
            <span>{t('dash.levelLabel', { level })}</span>
            <span>
              {xp} / {xpForNext} {t('dash.xp')}
            </span>
          </div>
          <div className="quest-bar" role="progressbar" aria-valuenow={xpProgress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${xpProgress}%` }} />
          </div>
          <p className="quest-bar-hint">
            {xpLeft > 0 ? t('dash.xpUntil', { n: xpLeft, level: level + 1 }) : t('dash.nextChapter')}
          </p>
        </div>

        <div className="hero-quest-actions">
          <Link to="/habits" className="btn btn-primary">
            {hasHabits ? t('dash.continueToday') : t('dash.beginFirst')}
          </Link>
          <Link to="/missions" className="btn btn-ghost">
            {t('dash.viewMissions')}
          </Link>
        </div>
      </motion.section>

      {quote && (
        <motion.blockquote
          className="quote-banner glass"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="quote-kicker">{t('dash.prophecy')}</p>
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
          <h3>{t('dash.todayProgress')}</h3>
          <div className="today-progress">
            <ProgressRing progress={daily} size={100} stroke={8} color="#06D6A0" />
            <div>
              <p className="today-progress-count">
                {done}/{total}
              </p>
              <p className="today-progress-label">
                {hasHabits ? t('dash.habitsFire') : t('dash.noHabitsYet')}
              </p>
            </div>
          </div>
        </div>
        <div className="glass chart-card">
          <h3>{t('dash.yourBadges')}</h3>
          {(data?.badges?.length || 0) === 0 ? (
            <p className="empty-inline">{t('dash.noBadgesYet')}</p>
          ) : (
            <div className="badge-row">
              {data.badges.map((b) => (
                <div key={b.id} className="pill" title={b.description}>
                  {b.icon} {b.name}
                </div>
              ))}
            </div>
          )}
          <p className="longest-streak">{t('dash.longest', { n: data?.longestStreak || 0 })}</p>
        </div>
      </div>
    </div>
  );
}
