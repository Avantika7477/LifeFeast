import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil, Trash2 } from 'lucide-react';
import ProgressRing from '../common/ProgressRing';
import { CATEGORY_COLORS, XP_MAP } from '../../utils/constants';
import { useLanguage } from '../../context/LanguageContext';
import { catLabel, diffLabel } from '../../i18n';

export default function HabitCard({ habit, onComplete, onEdit, onDelete, completing, focused }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const color = CATEGORY_COLORS[habit.category] || '#FFB703';
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
      id={`habit-${habit._id}`}
      className={`habit-card glass ${focused ? 'focus-task' : ''}`}
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
              {catLabel(t, habit.category)}
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
              {diffLabel(t, habit.difficulty)}
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
            aria-label={habit.completedToday ? t('habits.markIncomplete') : t('habits.markComplete')}
            title={habit.completedToday ? t('habits.undoComplete') : t('habits.markComplete')}
          >
            {habit.completedToday && <Check size={16} strokeWidth={3} />}
          </button>
          <button
            className={`btn btn-sm ${habit.completedToday ? 'btn-ghost' : 'btn-accent'}`}
            onClick={handleComplete}
            disabled={busy}
          >
            {busy ? t('common.saving') : habit.completedToday ? t('habits.undo') : t('habits.complete')}
          </button>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div>🔥 {t('habits.dayStreak', { n: habit.currentStreak })}</div>
            <div className="habit-xp">+{xp} XP</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button className="btn-icon" onClick={() => onEdit(habit)} title={t('habits.editHabit')} aria-label={t('habits.editHabit')}>
            <Pencil size={16} />
          </button>
          <button className="btn-icon" onClick={() => onDelete(habit)} title={t('habits.deleteHabit')} aria-label={t('habits.deleteHabit')}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className={`habit-status ${habit.completedToday ? 'done' : ''}`}>
        {habit.completedToday ? t('habits.completedToday') : t('habits.notCompleted')}
        {habit.reminderTime ? t('habits.reminderAt', { time: habit.reminderTime }) : ''}
      </div>
    </motion.div>
  );
}
