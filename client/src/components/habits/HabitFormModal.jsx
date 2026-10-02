import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { CATEGORIES, DIFFICULTIES } from '../../utils/constants';

const empty = {
  name: '',
  description: '',
  category: 'Personal',
  difficulty: 'Easy',
  target: 1,
  reminderTime: '',
};

export default function HabitFormModal({ open, onClose, onSubmit, habit }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (habit) {
      setForm({
        name: habit.name || '',
        description: habit.description || '',
        category: habit.category || 'Personal',
        difficulty: habit.difficulty || 'Easy',
        target: habit.target || 1,
        reminderTime: habit.reminderTime || '',
      });
    } else {
      setForm(empty);
    }
  }, [habit, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Modal open={open} onClose={onClose} title={habit ? 'Edit Habit' : 'Create Habit'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Habit Name</label>
          <input className="form-control" value={form.name} onChange={set('name')} required placeholder="e.g. Morning Run" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea className="form-control" value={form.description} onChange={set('description')} placeholder="Optional notes" />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select className="form-control select-control" value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Difficulty</label>
          <select className="form-control select-control" value={form.difficulty} onChange={set('difficulty')}>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Daily Target</label>
          <input className="form-control" type="number" min={1} max={20} value={form.target} onChange={set('target')} />
        </div>
        <div className="form-group">
          <label>Reminder Time</label>
          <input className="form-control" type="time" value={form.reminderTime} onChange={set('reminderTime')} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : habit ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
