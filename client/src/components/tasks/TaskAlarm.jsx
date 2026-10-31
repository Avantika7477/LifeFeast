import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskAPI } from '../../api';
import { formatDue } from '../../utils/constants';
import { playSiren, unlockAudio } from '../../utils/siren';

const INTERVAL_MS = 5 * 60 * 1000;
const WATCH_MS = 20 * 1000;
const AUDIO_KEY = 'lq_alarm_audio';
const SNOOZE_KEY = 'lq_alarm_snooze';

const overdueOf = (tasks) =>
  (tasks || []).filter((t) => t.status !== 'completed' && t.dueAt && t.completable);

function readSnooze() {
  try {
    return JSON.parse(sessionStorage.getItem(SNOOZE_KEY) || '{}');
  } catch {
    return {};
  }
}

function activeOverdue(tasks) {
  const now = Date.now();
  const snooze = readSnooze();
  return overdueOf(tasks).filter((t) => !snooze[t._id] || snooze[t._id] <= now);
}

export default function TaskAlarm() {
  const navigate = useNavigate();
  const [armed, setArmed] = useState(() => localStorage.getItem(AUDIO_KEY) === '1');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const seenRef = useRef(new Set());
  const armedRef = useRef(armed);
  armedRef.current = armed;

  const arm = useCallback(async () => {
    await unlockAudio();
    localStorage.setItem(AUDIO_KEY, '1');
    setArmed(true);
  }, []);

  const raise = useCallback(
    async (next, { play }) => {
      setItems(next);
      if (!next.length) {
        setOpen(false);
        return;
      }
      setOpen(true);
      if (play && armedRef.current) {
        playSiren();
      }
    },
    []
  );

  const scan = useCallback(
    async ({ playNew, playAll }) => {
      try {
        const { data } = await taskAPI.getAll();
        const next = activeOverdue(data);
        const fresh = next.filter((t) => !seenRef.current.has(t._id));
        fresh.forEach((t) => seenRef.current.add(t._id));
        const shouldPlay = playAll || (playNew && fresh.length > 0);
        if (next.length) {
          await raise(next, { play: shouldPlay });
        } else {
          setItems([]);
          setOpen(false);
        }
      } catch {
        // stay quiet if the API is down
      }
    },
    [raise]
  );

  useEffect(() => {
    scan({ playNew: true, playAll: false });
    const watch = setInterval(() => scan({ playNew: true, playAll: false }), WATCH_MS);
    const pulse = setInterval(() => {
      seenRef.current = new Set();
      scan({ playNew: false, playAll: true });
    }, INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        scan({ playNew: true, playAll: false });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(watch);
      clearInterval(pulse);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [scan]);

  useEffect(() => {
    const unlock = () => {
      arm();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, [arm]);

  useEffect(() => {
    if (armed && open && items.length) {
      playSiren();
    }
  }, [armed]);

  const snooze = () => {
    const until = Date.now() + INTERVAL_MS;
    const map = readSnooze();
    items.forEach((t) => {
      map[t._id] = until;
    });
    sessionStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
    setOpen(false);
  };

  const openTask = (task) => {
    setOpen(false);
    navigate(`/tasks?task=${task._id}&type=${task.type || 'daily'}`);
  };

  if (!open || !items.length) return null;

  const lead = items[0];

  return (
    <div className="alarm-overlay" role="alertdialog" aria-live="assertive" aria-labelledby="alarm-title">
      <div className="alarm-card">
        <div className="alarm-pulse" aria-hidden="true">
          🚨
        </div>
        <h3 id="alarm-title">You have not completed {lead.title}</h3>
        <p className="alarm-copy">
          {items.length === 1
            ? `This task was due ${formatDue(lead) || 'already'}. Mark it done now.`
            : `${items.length} tasks are past due. The siren will sound again in 5 minutes.`}
        </p>
        <ul className="alarm-list">
          {items.map((t) => (
            <li key={t._id}>
              <button type="button" className="alarm-item" onClick={() => openTask(t)}>
                <span>{t.title}</span>
                <span>{formatDue(t) ? `Due ${formatDue(t)}` : 'Past due'}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="alarm-actions">
          {!armed && (
            <button type="button" className="btn btn-primary" onClick={() => arm()}>
              Enable alarms
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={snooze}>
            Snooze 5 min
          </button>
          <button type="button" className="btn btn-primary" onClick={() => openTask(lead)}>
            Open task
          </button>
        </div>
      </div>
    </div>
  );
}
