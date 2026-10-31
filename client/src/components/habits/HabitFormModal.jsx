import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { CATEGORIES, DIFFICULTIES } from '../../utils/constants';
import { useLanguage } from '../../context/LanguageContext';
import { catLabel, diffLabel } from '../../i18n';

const empty = {
  name: '',
  description: '',
  category: 'Personal',
  difficulty: 'Easy',
  target: 1,
  reminderTime: '',
};

export default function HabitFormModal({ open, onClose, onSubmit, habit }) {
  const { t } = useLanguage();
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
    <Modal open={open} onClose={onClose} title={habit ? t('habits.edit') : t('habits.create')}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('habits.name')}</label>
          <input className="form-control" value={form.name} onChange={set('name')} required placeholder={t('habits.namePh')} />
        </div>
        <div className="form-group">
          <label>{t('habits.description')}</label>
          <textarea className="form-control" value={form.description} onChange={set('description')} placeholder={t('habits.notesPh')} />
        </div>
        <div className="form-group">
          <label>{t('habits.category')}</label>
          <select className="form-control select-control" value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{catLabel(t, c)}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>{t('habits.difficulty')}</label>
          <select className="form-control select-control" value={form.difficulty} onChange={set('difficulty')}>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{diffLabel(t, d)}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>{t('habits.target')}</label>
          <input className="form-control" type="number" min={1} max={20} value={form.target} onChange={set('target')} />
        </div>
        <div className="form-group">
          <label>{t('habits.reminder')}</label>
          <input className="form-control" type="time" value={form.reminderTime} onChange={set('reminderTime')} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? t('common.saving') : habit ? t('habits.update') : t('habits.createBtn')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
