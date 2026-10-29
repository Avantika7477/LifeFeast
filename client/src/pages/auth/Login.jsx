import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../api/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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
      setError(apiErrorMessage(err, 'Login failed'));
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
        <div className="brand">
          <div className="logo-mark">⚔️</div>
          <h1>LifeQuest</h1>
          <p>Turn your daily life into a game</p>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              className="form-control"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <Link to="/forgot-password" className="auth-link">
              Forgot Password?
            </Link>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Opening the gate...' : 'Enter the quest'}
          </button>
        </form>
        <p className="auth-motto">Small days. Big legend.</p>
        <div className="auth-footer">
          New adventurer? <Link to="/register">Begin your legend</Link>
          <div>
            <Link to="/">Back to home</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
