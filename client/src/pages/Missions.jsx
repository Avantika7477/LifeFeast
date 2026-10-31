import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { missionAPI, socialAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Loader from '../components/common/Loader';
import LevelUpOverlay from '../components/common/LevelUpOverlay';

export default function Missions() {
  const { user, showToast, updateUserLocal } = useAuth();
  const { t } = useLanguage();
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
      showToast(e.response?.data?.message || t('common.failed'), 'error');
    }
  };

  const respond = async (id, action) => {
    try {
      const { data } = await socialAPI.respondChallenge(id, action);
      setChallenges((prev) => prev.map((c) => (c._id === id ? data : c)));
      showToast(action === 'accept' ? t('missions.accepted') : t('missions.declined'));
    } catch (e) {
      showToast(e.response?.data?.message || t('common.failed'), 'error');
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
      showToast(e.response?.data?.message || t('common.failed'), 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('missions.title')}</h2>
          <p>{t('missions.lead')}</p>
        </div>
      </div>

      {missions.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon">⚔️</div>
          <h3>{t('missions.emptyTitle')}</h3>
          <p>{t('missions.empty')}</p>
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
                <span className="pill pill-green">✓ {t('missions.completed')}</span>
              ) : (
                <button className="btn btn-accent btn-sm" onClick={() => complete(m._id)}>
                  {t('missions.claim')}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      )}

      <div className="page-header" style={{ marginTop: '1.5rem' }}>
        <div>
          <h2>{t('missions.friendsTitle')}</h2>
          <p>{t('missions.friendsLead')}</p>
        </div>
        <Link to="/campfire" className="btn btn-ghost btn-sm">
          {t('missions.openCampfire')}
        </Link>
      </div>

      {challenges.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon">🔥</div>
          <h3>{t('missions.friendsEmptyTitle')}</h3>
          <p>{t('missions.friendsEmpty')}</p>
        </div>
      ) : (
        <div className="cards-grid">
          {challenges.map((c, i) => {
            const toMe = String(c.to?._id || c.to) === String(user?.id);
            const fromName = c.from?.name || t('missions.aFriend');
            const toName = c.to?.name || t('missions.aFriend');
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
                  {c.description || (toMe ? t('missions.fromName', { name: fromName }) : t('missions.sentTo', { name: toName }))}
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
                        {t('heroes.accept')}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => respond(c._id, 'decline')}>
                        {t('heroes.decline')}
                      </button>
                    </>
                  )}
                  {toMe && c.status === 'accepted' && (
                    <button className="btn btn-primary btn-sm" onClick={() => finishChallenge(c._id)}>
                      {t('habits.markComplete')}
                    </button>
                  )}
                  {c.status === 'completed' && <span className="pill pill-green">✓ {t('missions.completed')}</span>}
                  {!toMe && c.status === 'pending' && <span className="pill">{t('missions.waitingOn', { name: toName })}</span>}
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
