import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Modal from '../components/common/Modal';

export default function Settings() {
  const { user, showToast, updateUserLocal, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      showToast('Profile updated');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const changePw = async (e) => {
    e.preventDefault();
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      showToast('Password changed');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
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
      showToast('Data exported');
    } catch (err) {
      showToast('Export failed', 'error');
    }
  };

  const deleteAccount = async () => {
    try {
      await authAPI.deleteAccount();
      logout();
      navigate('/register');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Profile, theme & account</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Profile</h3>
          <form onSubmit={saveProfile}>
            <div className="form-group">
              <label>Name</label>
              <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" value={user?.email || ''} disabled />
            </div>
            <button className="btn btn-primary" type="submit">
              Save Profile
            </button>
          </form>
        </div>

        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Appearance</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Current theme: <strong>{theme}</strong>
          </p>
          <button className="btn btn-ghost" onClick={toggleTheme}>
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Change Password</h3>
          <form onSubmit={changePw}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                className="form-control"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
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
              Update Password
            </button>
          </form>
        </div>

        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Data & Account</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
            <button className="btn btn-ghost" onClick={exportData}>
              Export Data (JSON)
            </button>
            <button className="btn btn-danger" onClick={() => setDeleteOpen(true)}>
              Delete Account
            </button>
          </div>
        </div>

        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Badges Unlocked</h3>
          <div className="badge-grid">
            {(user?.badges || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No badges yet</p>
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

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Account?">
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          This permanently deletes your account and all data. This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setDeleteOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={deleteAccount}>
            Delete Forever
          </button>
        </div>
      </Modal>
    </div>
  );
}
