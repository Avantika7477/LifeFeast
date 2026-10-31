import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { CREATOR_NAME, CREATOR_URL, INSTALL_URL } from '../utils/constants';
import Modal from '../components/common/Modal';
import LanguageSelect from '../components/common/LanguageSelect';

export default function Settings() {
  const { user, showToast, updateUserLocal, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { installed, canInstall, showIosHelp, install } = usePwaInstall();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await authAPI.updateProfile({ name });
      updateUserLocal(data.user);
      showToast(t('settings.profileUpdated'));
    } catch (err) {
      showToast(err.response?.data?.message || t('common.failed'), 'error');
    }
  };

  const changePw = async (e) => {
    e.preventDefault();
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      showToast(t('settings.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || t('common.failed'), 'error');
    }
  };

  const exportData = async () => {
    try {
      const { data } = await authAPI.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifequest-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t('settings.exported'));
    } catch {
      showToast(t('settings.exportFailed'), 'error');
    }
  };

  const deleteAccount = async () => {
    try {
      await authAPI.deleteAccount();
      logout();
      navigate('/register');
    } catch (err) {
      showToast(err.response?.data?.message || t('common.failed'), 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('settings.title')}</h2>
          <p>{t('settings.lead')}</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="glass copy-card">
          <h3>{t('settings.profile')}</h3>
          <form onSubmit={saveProfile}>
            <div className="form-group">
              <label>{t('common.name')}</label>
              <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('common.email')}</label>
              <input className="form-control" value={user?.email || ''} disabled />
            </div>
            <button className="btn btn-primary" type="submit">
              {t('settings.saveProfile')}
            </button>
          </form>
        </div>

        <div className="glass copy-card">
          <h3>{t('settings.language')}</h3>
          <p className="install-help">{t('settings.languageHelp')}</p>
          <LanguageSelect id="settings-language" />
        </div>

        <div className="glass copy-card">
          <h3>{t('settings.install')}</h3>
          {installed ? (
            <p className="install-help">{t('settings.installed')}</p>
          ) : (
            <>
              <p className="install-help">{t('settings.installHelp')}</p>
              {showIosHelp && !canInstall ? (
                <p className="install-help">{t('settings.iosHelp')}</p>
              ) : (
                <p className="install-help">{t('settings.computerHelp')}</p>
              )}
              <p className="install-help">
                {t('settings.installFrom')}{' '}
                <a href={INSTALL_URL} target="_blank" rel="noreferrer">
                  {INSTALL_URL.replace('https://', '')}
                </a>
              </p>
              {canInstall ? (
                <button className="btn btn-primary" type="button" onClick={install}>
                  {t('settings.installLifeQuest')}
                </button>
              ) : (
                <a className="btn btn-primary" href={INSTALL_URL} target="_blank" rel="noreferrer">
                  {t('settings.openInstall')}
                </a>
              )}
            </>
          )}
        </div>

        <div className="glass copy-card">
          <h3>{t('settings.about')}</h3>
          <p className="install-help">{t('settings.about1')}</p>
          <p className="install-help">{t('settings.about2')}</p>
          <p className="install-help">
            {t('settings.builtBy')} <strong>{CREATOR_NAME}</strong>. {t('settings.knowMore')}{' '}
            <a href={CREATOR_URL} target="_blank" rel="noreferrer">
              {t('settings.visitPortfolio')}
            </a>
            .
          </p>
          <p className="install-help">
            {t('settings.feedbackHint')} <Link to="/feedback">{t('settings.feedbackLink')}</Link>. {t('settings.privateNotes')}
          </p>
        </div>

        <div className="glass copy-card">
          <h3>{t('settings.appearance')}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {t('settings.currentTheme')} <strong>{theme === 'dark' ? t('settings.dark') : t('settings.light')}</strong>
          </p>
          <button className="btn btn-ghost" onClick={toggleTheme}>
            {t('settings.switchTo', { mode: theme === 'dark' ? t('settings.light') : t('settings.dark') })}
          </button>
        </div>

        <div className="glass copy-card">
          <h3>{t('settings.password')}</h3>
          <form onSubmit={changePw}>
            <div className="form-group">
              <label>{t('settings.currentPassword')}</label>
              <input
                className="form-control"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('auth.newPassword')}</label>
              <input
                className="form-control"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              {t('settings.updatePassword')}
            </button>
          </form>
        </div>

        <div className="glass copy-card">
          <h3>{t('settings.data')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
            <button className="btn btn-ghost" onClick={exportData}>
              {t('settings.export')}
            </button>
            <button className="btn btn-danger" onClick={() => setDeleteOpen(true)}>
              {t('settings.deleteAccount')}
            </button>
          </div>
        </div>

        <div className="glass copy-card">
          <h3>{t('settings.badges')}</h3>
          <div className="badge-grid">
            {(user?.badges || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>{t('settings.noBadges')}</p>
            ) : (
              user.badges.map((b) => (
                <div key={b.id} className="badge-item glass">
                  <div className="badge-icon">{b.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{b.name}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t('settings.deleteTitle')}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('settings.deleteWarn')}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setDeleteOpen(false)}>
            {t('common.cancel')}
          </button>
          <button className="btn btn-danger" onClick={deleteAccount}>
            {t('settings.deleteForever')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
