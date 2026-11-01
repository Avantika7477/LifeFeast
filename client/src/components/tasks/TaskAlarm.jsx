import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { habitAPI, taskAPI } from '../../api';
import { formatDue } from '../../utils/constants';
import { shoutNotification, requestNotify, subscribePush } from '../../utils/notify';
import { playSiren, unlockAudio } from '../../utils/siren';

const INTERVAL_MS = 5 * 60 * 1000;
const WATCH_MS = 20 * 1000;
const AUDIO_KEY = 'lq_alarm_audio';
const SNOOZE_KEY = 'lq_alarm_snooze';

function readSnooze() {
  try {
    return JSON.parse(sessionStorage.getItem(SNOOZE_KEY) || '{}');
  } catch {
    return {};
  }
}

function localDayKey(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** In-progress tasks stay quiet the day you start them; they alarm again from the next day. */
function inProgressIsDue(task) {
  const started = task.inProgressAt || task.updatedAt;
  if (!started) return true;
  const startedDay = localDayKey(started);
  const today = localDayKey();
  return Boolean(startedDay) && startedDay < today;
}

function openTasks(tasks) {
  return (tasks || []).filter((t) => {
    if (t.status === 'completed') return false;
    if (t.status === 'in-progress') {
      if (!inProgressIsDue(t)) return false;
    } else if (t.status !== 'todo') {
      return false;
    }
    if (t.dueAt) return Boolean(t.completable);
    return true;
  });
}

function openHabits(habits) {
  return (habits || []).filter((h) => h.isActive !== false && !h.completedToday);
}

function toItems(tasks, habits) {
  const taskItems = openTasks(tasks).map((t) => ({
    id: `task:${t._id}`,
    title: t.title,
    kind: 'task',
    href: `/tasks?task=${t._id}&type=${t.type || 'daily'}`,
    meta: formatDue(t) ? `Due ${formatDue(t)}` : 'No due time — still open',
  }));
  const habitItems = openHabits(habits).map((h) => ({
    id: `habit:${h._id}`,
    title: h.name,
    kind: 'habit',
    href: `/habits?habit=${h._id}`,
    meta: h.reminderTime ? `Training · reminder ${h.reminderTime}` : 'Training · not done today',
  }));
  return [...habitItems, ...taskItems];
}

function activeItems(items) {
  const now = Date.now();
  const snooze = readSnooze();
  return items.filter((item) => !snooze[item.id] || snooze[item.id] <= now);
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
    await requestNotify();
    await subscribePush();
    localStorage.setItem(AUDIO_KEY, '1');
    setArmed(true);
  }, []);

  const announce = useCallback(async (next, { play }) => {
    if (!next.length) return;
    const lead = next[0];
    const title = `You have not completed ${lead.title}`;
    const body =
      next.length === 1
        ? `${lead.kind === 'habit' ? 'Training' : 'Quest'} is still open. Finish it to silence the alarm.`
        : `${next.length} items are still open. The siren repeats every 5 minutes until they are done.`;
    if (play && armedRef.current) {
      playSiren();
      shoutNotification({ title, body, url: lead.href });
    }
  }, []);

  const raise = useCallback(
    async (next, { play }) => {
      setItems(next);
      if (!next.length) {
        setOpen(false);
        return;
      }
      setOpen(true);
      await announce(next, { play });
    },
    [announce]
  );

  const scan = useCallback(
    async ({ playNew, playAll }) => {
      try {
        const [taskRes, habitRes] = await Promise.all([taskAPI.getAll(), habitAPI.getAll()]);
        const next = activeItems(toItems(taskRes.data, habitRes.data));
        const fresh = next.filter((item) => !seenRef.current.has(item.id));
        fresh.forEach((item) => seenRef.current.add(item.id));
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
      announce(items, { play: true });
    }
  }, [armed]);

  const snooze = () => {
    const until = Date.now() + INTERVAL_MS;
    const map = readSnooze();
    items.forEach((item) => {
      map[item.id] = until;
    });
    sessionStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
    setOpen(false);
  };

  const openItem = (item) => {
    setOpen(false);
    navigate(item.href);
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
            ? `${lead.kind === 'habit' ? 'This habit' : 'This task'} is still open. The siren and notification return every 5 minutes until you mark it done.`
            : `${items.length} habits and tasks are still open. The siren and notification return every 5 minutes until they are done.`}
        </p>
        <ul className="alarm-list">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="alarm-item" onClick={() => openItem(item)}>
                <span>{item.title}</span>
                <span>{item.meta}</span>
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
          <button type="button" className="btn btn-primary" onClick={() => openItem(lead)}>
            Open {lead.kind === 'habit' ? 'habit' : 'task'}
          </button>
        </div>
      </div>
    </div>
  );
}
