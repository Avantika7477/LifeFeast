import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSelect from '../../components/common/LanguageSelect';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword(email);
      setResetToken(data.resetToken);
      setToken(data.resetToken);
      setMessage(data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.requestFailed'));
    } finally {
      setLoading(false);
    }
  };

  const doReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password });
      setMessage(t('auth.resetDone'));
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div className="auth-card glass" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-lang">
          <LanguageSelect compact id="forgot-language" />
        </div>
        <div className="brand">
          <div className="logo-mark">⚔️</div>
          <h1>LifeQuest</h1>
          <p>{t('auth.forgotLead')}</p>
        </div>
        {error && <div className="auth-error">{error}</div>}
        {message && step !== 1 && (
          <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', padding: '0.75rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.9rem' }}>
            {message}
            {resetToken && step === 2 && (
              <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {t('auth.token')}: {resetToken}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={requestReset}>
            <div className="form-group">
              <label>{t('common.email')}</label>
              <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? t('auth.sending') : t('auth.sendReset')}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={doReset}>
            <div className="form-group">
              <label>{t('auth.resetToken')}</label>
              <input className="form-control" value={token} onChange={(e) => setToken(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>{t('auth.newPassword')}</label>
              <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? t('auth.resetting') : t('auth.resetPassword')}
            </button>
          </form>
        )}

        {step === 3 && (
          <Link to="/login" className="btn btn-primary" style={{ width: '100%', display: 'block', textAlign: 'center' }}>
            {t('auth.goLogin')}
          </Link>
        )}

        <div className="auth-footer">
          <Link to="/login">{t('auth.backLogin')}</Link>
          <div>
            <Link to="/">{t('auth.backHome')}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
