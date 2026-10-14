import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil, Trash2 } from 'lucide-react';
import ProgressRing from '../common/ProgressRing';
import { CATEGORY_COLORS, XP_MAP } from '../../utils/constants';

export default function HabitCard({ habit, onComplete, onEdit, onDelete, completing }) {
  const [busy, setBusy] = useState(false);
  const color = CATEGORY_COLORS[habit.category] || '#D4AF37';
  const xp = habit.xpReward || XP_MAP[habit.difficulty] || 10;
  const progress = habit.completedToday ? 100 : 0;

  const handleComplete = async () => {
    if (busy || completing) return;
    setBusy(true);
    try {
      await onComplete(habit._id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="habit-card glass"
      layout
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="habit-card-top">
        <div>
          <h4>{habit.name}</h4>
          <div className="habit-meta">
            <span className="pill" style={{ background: `${color}33`, color }}>
              {habit.category}
            </span>
            <span
              className={`pill ${
                habit.difficulty === 'Hard'
                  ? 'pill-red'
                  : habit.difficulty === 'Medium'
                    ? 'pill-amber'
                    : 'pill-green'
              }`}
            >
              {habit.difficulty}
            </span>
          </div>
        </div>
        <ProgressRing progress={progress} size={52} color={color} />
      </div>

      <div className="habit-card-footer">
        <div className="habit-action">
          <button
            className={`habit-check ${habit.completedToday ? 'done' : ''}`}
            onClick={handleComplete}
            disabled={busy}
            aria-label={habit.completedToday ? 'Mark incomplete' : 'Mark complete'}
            title={habit.completedToday ? 'Undo complete' : 'Mark complete'}
          >
            {habit.completedToday && <Check size={16} strokeWidth={3} />}
          </button>
          <button
            className={`btn btn-sm ${habit.completedToday ? 'btn-ghost' : 'btn-accent'}`}
            onClick={handleComplete}
            disabled={busy}
          >
            {busy ? 'Saving...' : habit.completedToday ? 'Undo' : 'Complete'}
          </button>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div>🔥 {habit.currentStreak} day streak</div>
            <div className="habit-xp">+{xp} XP</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button className="btn-icon" onClick={() => onEdit(habit)} title="Edit habit" aria-label="Edit habit">
            <Pencil size={16} />
          </button>
          <button className="btn-icon" onClick={() => onDelete(habit)} title="Delete habit" aria-label="Delete habit">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className={`habit-status ${habit.completedToday ? 'done' : ''}`}>
        {habit.completedToday ? 'Completed today' : 'Not completed yet'}
        {habit.reminderTime ? ` · Reminder ${habit.reminderTime}` : ''}
      </div>
    </motion.div>
  );
}
