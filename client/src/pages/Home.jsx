import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelect from '../components/common/LanguageSelect';

export default function Home() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 240);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  const features = [
    { icon: '🎯', title: t('home.f1t'), text: t('home.f1d') },
    { icon: '✨', title: t('home.f2t'), text: t('home.f2d') },
    { icon: '🔥', title: t('home.f3t'), text: t('home.f3d') },
    { icon: '⚔️', title: t('home.f4t'), text: t('home.f4d') },
    { icon: '🏆', title: t('home.f5t'), text: t('home.f5d') },
    { icon: '📖', title: t('home.f6t'), text: t('home.f6d') },
    { icon: '💬', title: t('home.f7t'), text: t('home.f7d') },
    { icon: '⭐', title: t('home.f8t'), text: t('home.f8d') },
  ];

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="logo-mark">⚔️</span>
          <span>LifeQuest</span>
        </Link>
        <div className="landing-nav-actions">
          <LanguageSelect compact id="home-language" />
          <button className="btn-icon" onClick={toggleTheme} title={t('common.toggleTheme')} aria-label={t('common.toggleTheme')}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              <span className="label-wide">{t('home.continueQuest')}</span>
              <span className="label-narrow">{t('home.quest')}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                {t('home.login')}
              </Link>
              <Link to="/register" className="btn btn-primary">
                {t('home.signUp')}
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
        <p className="quest-kicker">{t('home.kicker')}</p>
        <h1>{t('home.title')}</h1>
        <p className="landing-lead">{t('home.lead')}</p>
        <div className="hero-quest-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              {t('home.enterDashboard')}
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">
                {t('home.beginQuest')}
              </Link>
              <Link to="/login" className="btn btn-ghost">
                {t('home.alreadyPath')}
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
        <h2>{t('home.ctaTitle')}</h2>
        <p>{t('home.ctaText')}</p>
        {user ? (
          <Link to="/habits" className="btn btn-primary">
            {t('home.continueTraining')}
          </Link>
        ) : (
          <Link to="/register" className="btn btn-primary">
            {t('home.signUpTraining')}
          </Link>
        )}
      </section>

      <footer className="landing-foot">{t('home.foot')}</footer>

      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            className="back-to-top"
            onClick={goTop}
            aria-label={t('common.backToTop')}
            title={t('common.backToTop')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
