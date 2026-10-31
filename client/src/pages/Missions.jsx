import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { missionAPI, socialAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import LevelUpOverlay from '../components/common/LevelUpOverlay';

export default function Missions() {
  const { user, showToast, updateUserLocal } = useAuth();
  const [missions, setMissions] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState(null);

  const loadChallenges = () => socialAPI.challenges().then((res) => setChallenges(res.data));

  useEffect(() => {
    Promise.all([
      missionAPI.getAll().then((res) => setMissions(res.data)),
      loadChallenges().catch(() => setChallenges([])),
    ]).finally(() => setLoading(false));
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

  const respond = async (id, action) => {
    try {
      const { data } = await socialAPI.respondChallenge(id, action);
      setChallenges((prev) => prev.map((c) => (c._id === id ? data : c)));
      showToast(action === 'accept' ? 'Challenge accepted' : 'Challenge declined');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed', 'error');
    }
  };

  const finishChallenge = async (id) => {
    try {
      const { data } = await socialAPI.completeChallenge(id);
      showToast(`+${data.coinsGained} coins · +${data.xpGained} XP`, 'xp');
      updateUserLocal(data.user);
      setChallenges((prev) => prev.map((c) => (c._id === id ? data.challenge : c)));
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
          <h2>Today&apos;s Missions</h2>
          <p>Bonus challenges for today. Finish one for extra gold on top of your regular habits.</p>
        </div>
      </div>

      {missions.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon">⚔️</div>
          <h3>No missions posted</h3>
          <p>Come back tomorrow. New challenges spawn with the dawn.</p>
        </div>
      ) : (
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
                  Claim the reward
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      )}

      <div className="page-header" style={{ marginTop: '1.5rem' }}>
        <div>
          <h2>Friend challenges</h2>
          <p>
            Challenges friends send from Campfire. Accept one, finish it, and you both earn a reward.
          </p>
        </div>
        <Link to="/campfire" className="btn btn-ghost btn-sm">
          Open Campfire
        </Link>
      </div>

      {challenges.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon">🔥</div>
          <h3>No friend challenges yet</h3>
          <p>Sit at the Campfire, pick a friend, and send them a dare.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {challenges.map((c, i) => {
            const toMe = String(c.to?._id || c.to) === String(user?.id);
            const fromName = c.from?.name || 'A friend';
            const toName = c.to?.name || 'a friend';
            return (
              <motion.div
                key={c._id}
                className="glass habit-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <h4>{c.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {c.description || (toMe ? `From ${fromName}` : `Sent to ${toName}`)}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="pill pill-amber">🪙 {c.coinReward}</span>
                  <span className="pill">✨ {c.xpReward} XP</span>
                  <span className="pill">{c.status}</span>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {toMe && c.status === 'pending' && (
                    <>
                      <button className="btn btn-accent btn-sm" onClick={() => respond(c._id, 'accept')}>
                        Accept
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => respond(c._id, 'decline')}>
                        Decline
                      </button>
                    </>
                  )}
                  {toMe && c.status === 'accepted' && (
                    <button className="btn btn-primary btn-sm" onClick={() => finishChallenge(c._id)}>
                      Mark complete
                    </button>
                  )}
                  {c.status === 'completed' && <span className="pill pill-green">✓ Completed</span>}
                  {!toMe && c.status === 'pending' && <span className="pill">Waiting on {toName}</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <LevelUpOverlay show={!!levelUp} level={levelUp} onClose={() => setLevelUp(null)} />
    </div>
  );
}
