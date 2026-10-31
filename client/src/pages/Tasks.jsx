import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { taskAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSignals } from '../context/SignalsContext';
import { combineDueAt, formatDue } from '../utils/constants';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

const empty = {
  title: '',
  description: '',
  type: 'daily',
  priority: 'medium',
  status: 'todo',
  deadline: '',
  dueTime: '',
  notes: '',
};

export default function Tasks() {
  const { showToast } = useAuth();
  const { t, locale } = useLanguage();
  const { refreshUnread } = useSignals();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const focusId = searchParams.get('task');

  const tabLabel = (id) => (id === 'daily' ? t('tasks.daily') : id === 'weekly' ? t('tasks.weekly') : t('tasks.monthly'));

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await taskAPI.getAll({ type: tab });
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && ['daily', 'weekly', 'monthly'].includes(type)) {
      setTab(type);
    }
  }, [searchParams]);

  useEffect(() => {
    load();
  }, [tab]);

  useEffect(() => {
    if (!focusId || loading) return;
    const el = document.getElementById(`task-${focusId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, loading, tasks]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await taskAPI.create({
        ...form,
        type: tab,
        deadline: form.deadline || undefined,
        dueTime: form.dueTime || '',
        dueAt: combineDueAt(form.deadline, form.dueTime),
      });
      showToast(t('tasks.created'));
      setOpen(false);
      setForm(empty);
      await Promise.all([load(), refreshUnread()]);
    } catch (err) {
      showToast(err.response?.data?.message || t('common.failed'), 'error');
    }
  };

  const updateStatus = async (task, status) => {
    if (status === 'completed' && !task.completable) {
      const when = formatDue(task, locale);
      showToast(when ? t('tasks.waitUntil', { when }) : t('tasks.tooEarly'), 'error');
      return;
    }
    try {
      await taskAPI.update(task._id, { status });
      load();
    } catch (err) {
      showToast(err.response?.data?.message || t('tasks.updateFail'), 'error');
    }
  };

  const remove = async (id) => {
    await taskAPI.remove(id);
    showToast(t('tasks.deleted'));
    load();
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const priorityClass = { high: 'pill-red', medium: 'pill-amber', low: 'pill-green' };
  const priorityLabel = (p) => (p === 'high' ? t('tasks.high') : p === 'low' ? t('tasks.low') : t('tasks.med'));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('tasks.title')}</h2>
          <p>{t('tasks.lead')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} /> {t('tasks.add')}
        </button>
      </div>

      <div className="tabs">
        {['daily', 'weekly', 'monthly'].map((id) => (
          <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            {tabLabel(id)}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : tasks.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon">📝</div>
          <h3>{t('tasks.emptyTitle')}</h3>
          <p>{t('tasks.empty', { tab: tabLabel(tab) })}</p>
        </div>
      ) : (
        <div className="glass">
          {tasks.map((task) => {
            const when = formatDue(task, locale);
            return (
              <div
                key={task._id}
                id={`task-${task._id}`}
                className={`task-row ${focusId === task._id ? 'focus-task' : ''} ${
                  !task.completable && task.status !== 'completed' ? 'locked' : ''
                }`}
              >
                <select
                  className="form-control select-control task-status"
                  value={task.status}
                  onChange={(e) => updateStatus(task, e.target.value)}
                >
                  <option value="todo">{t('tasks.todo')}</option>
                  <option value="in-progress">{t('tasks.inProgress')}</option>
                  <option value="completed" disabled={!task.completable && task.status !== 'completed'}>
                    {t('tasks.completed')}
                  </option>
                </select>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {task.description}
                    {when && ` · ${t('tasks.due', { when })}`}
                    {!task.completable && task.status !== 'completed' && ` · ${t('tasks.lockedUntil')}`}
                  </div>
                  {task.notes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 2 }}>📝 {task.notes}</div>
                  )}
                </div>
                <span className={`pill ${priorityClass[task.priority]}`}>{priorityLabel(task.priority)}</span>
                <button className="btn-icon" onClick={() => remove(task._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('tasks.newTask', { tab: tabLabel(tab) })}>
        <form onSubmit={create}>
          <div className="form-group">
            <label>{t('tasks.taskTitle')}</label>
            <input className="form-control" value={form.title} onChange={set('title')} required />
          </div>
          <div className="form-group">
            <label>{t('tasks.description')}</label>
            <textarea className="form-control" value={form.description} onChange={set('description')} />
          </div>
          <div className="form-group">
            <label>{t('tasks.priority')}</label>
            <select className="form-control select-control" value={form.priority} onChange={set('priority')}>
              <option value="low">{t('tasks.low')}</option>
              <option value="medium">{t('tasks.med')}</option>
              <option value="high">{t('tasks.high')}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t('tasks.dueDate')}</label>
            <input className="form-control" type="date" value={form.deadline} onChange={set('deadline')} />
          </div>
          <div className="form-group">
            <label>{t('tasks.dueTime')}</label>
            <input className="form-control" type="time" value={form.dueTime} onChange={set('dueTime')} />
            <small className="field-hint">{t('tasks.dueHint')}</small>
          </div>
          <div className="form-group">
            <label>{t('tasks.notes')}</label>
            <textarea className="form-control" value={form.notes} onChange={set('notes')} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('tasks.create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
