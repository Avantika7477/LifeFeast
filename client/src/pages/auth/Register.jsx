import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiErrorMessage } from '../../api/client';
import LanguageSelect from '../../components/common/LanguageSelect';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.registerFailed')));
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
      >
        <div className="auth-lang">
          <LanguageSelect compact id="register-language" />
        </div>
        <div className="brand">
          <div className="logo-mark">⚔️</div>
          <h1>LifeQuest</h1>
          <p>{t('auth.registerLead')}</p>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('common.name')}</label>
            <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t('auth.heroName')} />
          </div>
          <div className="form-group">
            <label>{t('common.email')}</label>
            <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>{t('common.password')}</label>
            <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder={t('auth.minChars')} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? t('auth.forging') : t('auth.startQuest')}
          </button>
        </form>
        <p className="auth-motto">{t('auth.showUp')}</p>
        <div className="auth-footer">
          {t('auth.alreadyPath')} <Link to="/login">{t('auth.enterQuest')}</Link>
          <div>
            <Link to="/">{t('auth.backHome')}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
