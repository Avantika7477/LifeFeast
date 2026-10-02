import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { missionAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import LevelUpOverlay from '../components/common/LevelUpOverlay';

export default function Missions() {
  const { showToast, updateUserLocal } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState(null);

  useEffect(() => {
    missionAPI
      .getAll()
      .then((res) => setMissions(res.data))
      .finally(() => setLoading(false));
  }, []);

  const complete = async (id) => {
    try {
      const { data } = await missionAPI.complete(id);
      showToast(`+${data.coinsGained} coins · +${data.xpGained} XP`, 'xp');
      updateUserLocal(data.user);
      setMissions((prev) => prev.map((m) => (m._id === id ? data.mission : m)));
      if (data.leveledUp) setLevelUp(data.user.level);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed', 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Daily Missions</h2>
          <p>Complete missions for bonus coins & XP</p>
        </div>
      </div>

      <div className="cards-grid">
        {missions.map((m, i) => (
          <motion.div
            key={m._id}
            className="glass habit-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <h4>{m.title}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{m.description}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className="pill pill-amber">🪙 {m.coinReward}</span>
              <span className="pill">✨ {m.xpReward} XP</span>
            </div>
            <div style={{ marginTop: '1rem' }}>
              {m.completed ? (
                <span className="pill pill-green">✓ Completed</span>
              ) : (
                <button className="btn btn-accent btn-sm" onClick={() => complete(m._id)}>
                  Complete Mission
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <LevelUpOverlay show={!!levelUp} level={levelUp} onClose={() => setLevelUp(null)} />
    </div>
  );
}
