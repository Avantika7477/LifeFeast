import { useEffect, useState } from 'react';
import { journalAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { MOODS, formatDate } from '../utils/constants';
import Loader from '../components/common/Loader';

export default function Journal() {
  const { showToast } = useAuth();
  const [date, setDate] = useState(formatDate());
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadEntry = async (d) => {
    const { data } = await journalAPI.getByDate(d);
    setContent(data.content || '');
    setMood(data.mood || '');
  };

  const loadAll = async () => {
    const { data } = await journalAPI.getAll();
    setEntries(data);
  };

  useEffect(() => {
    Promise.all([loadEntry(date), loadAll()]).finally(() => setLoading(false));
  }, []);

  const onDateChange = async (d) => {
    setDate(d);
    await loadEntry(d);
  };

  const save = async () => {
    setSaving(true);
    try {
      await journalAPI.upsert({ date, content, mood });
      showToast('Journal saved');
      setContent('');
      setMood('');
      await loadAll();
    } catch (e) {
      showToast(e.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Journal & Mood</h2>
          <p>Reflect on your day</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      <div className="charts-grid">
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div className="form-group">
            <label>Date</label>
            <input className="form-control" type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
          </div>
          <div className="form-group">
            <label>How are you feeling?</label>
            <div className="mood-picker">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`mood-btn ${mood === m ? 'selected' : ''}`}
                  onClick={() => setMood(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              className="form-control"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write about your day..."
            />
          </div>
        </div>

        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Recent Entries</h3>
          {entries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No entries yet</p>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {entries.slice(0, 10).map((e) => (
                <li
                  key={e._id}
                  className="glass"
                  style={{ padding: '0.85rem 1rem', cursor: 'pointer' }}
                  onClick={() => onDateChange(e.date)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{e.date}</strong>
                    <span style={{ fontSize: '1.25rem' }}>{e.mood}</span>
                  </div>
                  <p
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      marginTop: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {e.content || 'No content'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
