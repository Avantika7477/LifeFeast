import { useEffect, useState } from 'react';
import { journalAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MOODS, formatDate } from '../utils/constants';
import Loader from '../components/common/Loader';

export default function Journal() {
  const { showToast } = useAuth();
  const { t } = useLanguage();
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
      showToast(t('journal.saved'));
      setContent('');
      setMood('');
      await loadAll();
    } catch (e) {
      showToast(e.response?.data?.message || t('journal.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('journal.title')}</h2>
          <p>{t('journal.lead')}</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? t('common.saving') : t('journal.save')}
        </button>
      </div>

      <div className="charts-grid">
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div className="form-group">
            <label>{t('journal.date')}</label>
            <input className="form-control" type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t('journal.feeling')}</label>
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
            <label>{t('journal.notes')}</label>
            <textarea
              className="form-control"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('journal.placeholder')}
            />
          </div>
        </div>

        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{t('journal.recent')}</h3>
          {entries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>{t('journal.none')}</p>
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
                    {e.content || t('journal.noContent')}
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
