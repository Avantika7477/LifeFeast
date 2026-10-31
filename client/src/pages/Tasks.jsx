import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { taskAPI } from '../api';
import { useAuth } from '../context/AuthContext';
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
  const { refreshUnread } = useSignals();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const focusId = searchParams.get('task');

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
      showToast('Task created');
      setOpen(false);
      setForm(empty);
      await Promise.all([load(), refreshUnread()]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const updateStatus = async (task, status) => {
    if (status === 'completed' && !task.completable) {
      showToast(
        formatDue(task)
          ? `Wait until ${formatDue(task)} to mark this done.`
          : 'Too early to mark this done.',
        'error'
      );
      return;
    }
    try {
      await taskAPI.update(task._id, { status });
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update task', 'error');
    }
  };

  const remove = async (id) => {
    await taskAPI.remove(id);
    showToast('Task deleted');
    load();
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const priorityClass = { high: 'pill-red', medium: 'pill-amber', low: 'pill-green' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Quest Log</h2>
          <p>
            Daily, weekly, and monthly to-dos. Set a due time — you cannot mark a task complete
            before that time, and you can finish it anytime after.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} /> Add Task
        </button>
      </div>

      <div className="tabs">
        {['daily', 'weekly', 'monthly'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'daily' ? 'Daily To-do' : t === 'weekly' ? 'Weekly Tasks' : 'Monthly Goals'}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : tasks.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon">📝</div>
          <h3>Nothing on the log</h3>
          <p>No {tab} tasks yet. Write the next move.</p>
        </div>
      ) : (
        <div className="glass">
          {tasks.map((t) => (
            <div
              key={t._id}
              id={`task-${t._id}`}
              className={`task-row ${focusId === t._id ? 'focus-task' : ''} ${
                !t.completable && t.status !== 'completed' ? 'locked' : ''
              }`}
            >
              <select
                className="form-control select-control task-status"
                value={t.status}
                onChange={(e) => updateStatus(t, e.target.value)}
              >
                <option value="todo">To-do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed" disabled={!t.completable && t.status !== 'completed'}>
                  Completed
                </option>
              </select>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                  {t.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {t.description}
                  {formatDue(t) && ` · Due ${formatDue(t)}`}
                  {!t.completable && t.status !== 'completed' && ' · Locked until due time'}
                </div>
                {t.notes && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 2 }}>📝 {t.notes}</div>
                )}
              </div>
              <span className={`pill ${priorityClass[t.priority]}`}>{t.priority}</span>
              <button className="btn-icon" onClick={() => remove(t._id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`New ${tab} task`}>
        <form onSubmit={create}>
          <div className="form-group">
            <label>Title</label>
            <input className="form-control" value={form.title} onChange={set('title')} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" value={form.description} onChange={set('description')} />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select className="form-control select-control" value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Due date</label>
            <input className="form-control" type="date" value={form.deadline} onChange={set('deadline')} />
          </div>
          <div className="form-group">
            <label>Due time</label>
            <input className="form-control" type="time" value={form.dueTime} onChange={set('dueTime')} />
            <small className="field-hint">You can mark it complete only after this time.</small>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" value={form.notes} onChange={set('notes')} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
