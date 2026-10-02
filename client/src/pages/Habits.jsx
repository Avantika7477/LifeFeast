import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { habitAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import HabitCard from '../components/habits/HabitCard';
import HabitFormModal from '../components/habits/HabitFormModal';
import LevelUpOverlay from '../components/common/LevelUpOverlay';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

export default function Habits() {
  const { showToast, updateUserLocal, refreshUser } = useAuth();
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
      showToast(e.response?.data?.message || 'Failed to load habits', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (form) => {
    if (editing) {
      await habitAPI.update(editing._id, form);
      showToast('Habit updated');
    } else {
      await habitAPI.create(form);
      showToast('Habit created');
    }
    setEditing(null);
    await load();
  };

  const handleComplete = async (id) => {
    try {
      const { data } = await habitAPI.complete(id);
      if (data.completed) {
        showToast(`+${data.xpGained} XP · +${data.coinsGained} coins`, 'xp');
        updateUserLocal({
          xp: data.newXp,
          level: data.newLevel,
          coins: data.newCoins,
          currentStreak: data.userStreak,
        });
        if (data.leveledUp) setLevelUp(data.newLevel);
        if (data.newBadges?.length) {
          showToast(`Badge unlocked: ${data.newBadges[0].name}!`, 'xp');
          refreshUser();
        }
      } else {
        showToast('Habit unmarked');
        refreshUser();
      }
      await load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await habitAPI.remove(deleteTarget._id);
      showToast('Habit deleted');
      setDeleteTarget(null);
      await load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Delete failed', 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Habits</h2>
          <p>Build your daily quests</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus size={18} /> Create Habit
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon">🎯</div>
          <p>No habits yet. Create your first quest!</p>
        </div>
      ) : (
        <div className="cards-grid">
          {habits.map((h) => (
            <HabitCard
              key={h._id}
              habit={h}
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

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Habit?">
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Delete &ldquo;{deleteTarget?.name}&rdquo;? This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </Modal>

      <LevelUpOverlay show={!!levelUp} level={levelUp} onClose={() => setLevelUp(null)} />
    </div>
  );
}
