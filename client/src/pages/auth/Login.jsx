import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiErrorMessage } from '../../api/client';
import LanguageSelect from '../../components/common/LanguageSelect';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const afterLogin = from && from !== '/login' && from !== '/register' ? from : '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(afterLogin);
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.loginFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card glass"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-lang">
          <LanguageSelect compact id="login-language" />
        </div>
        <div className="brand">
          <div className="logo-mark">⚔️</div>
          <h1>LifeQuest</h1>
          <p>{t('auth.loginLead')}</p>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('common.email')}</label>
            <input
              className="form-control"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label>{t('common.password')}</label>
            <input
              className="form-control"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <Link to="/forgot-password" className="auth-link">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? t('auth.openingGate') : t('auth.enterQuest')}
          </button>
        </form>
        <p className="auth-motto">{t('auth.motto')}</p>
        <div className="auth-footer">
          {t('auth.newAdventurer')} <Link to="/register">{t('auth.beginLegend')}</Link>
          <div>
            <Link to="/">{t('auth.backHome')}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
