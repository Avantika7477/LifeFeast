import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { taskAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

const empty = {
  title: '',
  description: '',
  type: 'daily',
  priority: 'medium',
  status: 'todo',
  deadline: '',
  notes: '',
};

export default function Tasks() {
  const { showToast } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

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
    load();
  }, [tab]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await taskAPI.create({ ...form, type: tab, deadline: form.deadline || undefined });
      showToast('Task created');
      setOpen(false);
      setForm(empty);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const updateStatus = async (id, status) => {
    await taskAPI.update(id, { status });
    load();
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
          <h2>Tasks</h2>
          <p>Daily to-dos, weekly tasks & monthly goals</p>
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
          <p>No {tab} tasks yet</p>
        </div>
      ) : (
        <div className="glass">
          {tasks.map((t) => (
            <div key={t._id} className="task-row">
              <select
                className="form-control select-control"
                style={{ width: 140, padding: '0.4rem 0.6rem' }}
                value={t.status}
                onChange={(e) => updateStatus(t._id, e.target.value)}
              >
                <option value="todo">To-do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                  {t.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {t.description}
                  {t.deadline && ` · Due ${new Date(t.deadline).toLocaleDateString()}`}
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
            <label>Deadline</label>
            <input className="form-control" type="date" value={form.deadline} onChange={set('deadline')} />
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
