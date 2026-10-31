import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { habitAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import HabitCard from '../components/habits/HabitCard';
import HabitFormModal from '../components/habits/HabitFormModal';
import LevelUpOverlay from '../components/common/LevelUpOverlay';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

export default function Habits() {
  const { showToast, updateUserLocal, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get('habit');
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [levelUp, setLevelUp] = useState(null);

  const load = async () => {
    try {
      const { data } = await habitAPI.getAll();
      setHabits(data);
    } catch (e) {
      showToast(e.response?.data?.message || t('habits.loadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!focusId || loading) return;
    document.getElementById(`habit-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, loading, habits]);

  const handleSubmit = async (form) => {
    if (editing) {
      await habitAPI.update(editing._id, form);
      showToast(t('habits.updated'));
    } else {
      await habitAPI.create(form);
      showToast(t('habits.created'));
    }
    setEditing(null);
    await load();
  };

  const handleComplete = async (id) => {
    try {
      const { data } = await habitAPI.complete(id);
      if (data.completed) {
        showToast(`+${data.xpGained} XP · +${data.coinsGained} ${t('dash.coins').toLowerCase()}`, 'xp');
        updateUserLocal({
          xp: data.newXp,
          level: data.newLevel,
          coins: data.newCoins,
          currentStreak: data.userStreak,
        });
        if (data.leveledUp) setLevelUp(data.newLevel);
        if (data.newBadges?.length) {
          showToast(t('habits.badgeUnlocked', { name: data.newBadges[0].name }), 'xp');
          refreshUser();
        }
      } else {
        showToast(t('habits.unmarked'));
        refreshUser();
      }
      await load();
    } catch (e) {
      showToast(e.response?.data?.message || t('common.failed'), 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await habitAPI.remove(deleteTarget._id);
      showToast(t('habits.deleted'));
      setDeleteTarget(null);
      await load();
    } catch (e) {
      showToast(e.response?.data?.message || t('habits.deleteFailed'), 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('habits.title')}</h2>
          <p>{t('habits.lead')}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus size={18} /> {t('habits.forge')}
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon">🎯</div>
          <h3>{t('habits.emptyTitle')}</h3>
          <p>{t('habits.empty')}</p>
        </div>
      ) : (
        <div className="cards-grid">
          {habits.map((h) => (
            <HabitCard
              key={h._id}
              habit={h}
              focused={focusId === h._id}
              onComplete={handleComplete}
              onEdit={(habit) => {
                setEditing(habit);
                setModalOpen(true);
              }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <HabitFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        habit={editing}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('habits.deleteTitle')}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          {t('habits.deleteWarn', { name: deleteTarget?.name })}
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>
            {t('common.cancel')}
          </button>
          <button className="btn btn-danger" onClick={confirmDelete}>
            {t('common.delete')}
          </button>
        </div>
      </Modal>

      <LevelUpOverlay show={!!levelUp} level={levelUp} onClose={() => setLevelUp(null)} />
    </div>
  );
}
