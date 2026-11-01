import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskAPI } from '../../api';
import { formatDue } from '../../utils/constants';
import Modal from '../common/Modal';

const NUDGE_KEY = 'lq_task_nudge';

export default function UnfinishedReminder() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (sessionStorage.getItem(NUDGE_KEY)) return undefined;
    let cancelled = false;
    taskAPI
      .getAll()
      .then(({ data }) => {
        if (cancelled) return;
        const unfinished = (data || []).filter((t) => t.status === 'todo');
        sessionStorage.setItem(NUDGE_KEY, '1');
        if (unfinished.length) {
          setItems(unfinished.slice(0, 8));
          setOpen(true);
        }
      })
      .catch(() => {
        sessionStorage.setItem(NUDGE_KEY, '1');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openTask = (task) => {
    setOpen(false);
    navigate(`/tasks?task=${task._id}&type=${task.type || 'daily'}`);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Unfinished quests">
      <p className="reminder-lead">
        You still have tasks open. After the due time you can mark them done — anytime after that
        is fine.
      </p>
      <ul className="reminder-list">
        {items.map((t) => (
          <li key={t._id}>
            <button type="button" className="reminder-item" onClick={() => openTask(t)}>
              <span className="reminder-item-title">{t.title}</span>
              <span className="reminder-item-meta">
                {t.completable
                  ? 'Ready to complete'
                  : formatDue(t)
                    ? `After ${formatDue(t)}`
                    : 'Still open'}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="modal-actions">
        <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
          Got it
        </button>
      </div>
    </Modal>
  );
}
