import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const features = [
  { icon: '🎯', title: 'Daily training', text: 'Build habits that stick. Complete them. Watch the ring fill.' },
  { icon: '✨', title: 'XP & levels', text: 'Every win grants XP. Rise through levels like a real quest.' },
  { icon: '🔥', title: 'Streaks', text: 'Show up tomorrow. Then the day after. Fire grows with you.' },
  { icon: '⚔️', title: 'Missions', text: 'Bonus gold for the brave. New challenges with the dawn.' },
  { icon: '🏆', title: 'Hall of heroes', text: 'Climb the leaderboard. Leave a mark the world can see.' },
  { icon: '📖', title: 'Campfire journal', text: 'Write it down. Make the day real. Track your mood.' },
];

export default function Home() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="logo-mark">⚔️</span>
          <span>LifeQuest</span>
        </Link>
        <div className="landing-nav-actions">
          <button className="btn-icon" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              Continue quest
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      <motion.section
        className="landing-hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="quest-kicker">Your life. Your quest.</p>
        <h1>Turn every day into a legend.</h1>
        <p className="landing-lead">
          Track habits. Earn XP. Unlock badges. Climb levels. Small days. Big legend.
        </p>
        <div className="hero-quest-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              Enter your dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">
                Begin your quest
              </Link>
              <Link to="/login" className="btn btn-ghost">
                I already have a path
              </Link>
            </>
          )}
        </div>
      </motion.section>

      <section className="landing-features">
        {features.map((f, i) => (
          <motion.article
            key={f.title}
            className="glass landing-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i }}
          >
            <div className="landing-card-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </motion.article>
        ))}
      </section>

      <section className="landing-cta glass">
        <h2>Training stays locked until you enter.</h2>
        <p>Habits, missions, journal, and the hall of heroes require an account. The home gate is open to all.</p>
        {user ? (
          <Link to="/habits" className="btn btn-primary">
            Continue today&apos;s training
          </Link>
        ) : (
          <Link to="/register" className="btn btn-primary">
            Sign up to start training
          </Link>
        )}
      </section>

      <footer className="landing-foot">Small days. Big legend.</footer>
    </div>
  );
}
