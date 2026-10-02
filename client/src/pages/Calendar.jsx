import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { progressAPI } from '../api';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [dayDetail, setDayDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await progressAPI.calendar(year, month);
      setDays(data.days);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [year, month]);

  const prev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const next = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const openDay = async (day) => {
    setSelected(day);
    const { data } = await progressAPI.day(day.date);
    setDayDetail(data);
  };

  const firstDow = new Date(year, month - 1, 1).getDay();
  const today = now.toISOString().slice(0, 10);
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const heatColor = (pct) => {
    if (pct >= 80) return '#22c55e';
    if (pct >= 50) return '#86efac';
    if (pct >= 25) return '#fbbf24';
    if (pct > 0) return '#f87171';
    return 'var(--text-dim)';
  };

  if (loading && !days.length) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Calendar</h2>
          <p>Track completions across the month</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn-icon" onClick={prev}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: 600, minWidth: 160, textAlign: 'center' }}>{monthName}</span>
          <button className="btn-icon" onClick={next}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="glass" style={{ padding: '1.25rem' }}>
        <div className="calendar-grid">
          {WEEKDAYS.map((d) => (
            <div key={d} className="cal-weekday">
              {d}
            </div>
          ))}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {days.map((day) => {
            const dayNum = parseInt(day.date.slice(-2), 10);
            return (
              <button
                key={day.date}
                className={`cal-day ${day.date === today ? 'today' : ''} ${selected?.date === day.date ? 'selected' : ''}`}
                onClick={() => openDay(day)}
              >
                <span style={{ fontWeight: 600 }}>{dayNum}</span>
                <span className="cal-pct" style={{ color: heatColor(day.completionPercentage) }}>
                  {day.total ? `${day.completionPercentage}%` : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setDayDetail(null);
        }}
        title={selected?.date}
      >
        {dayDetail ? (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {dayDetail.completed.length} habit(s) completed
            </p>
            {dayDetail.completed.length === 0 ? (
              <p className="empty-state" style={{ padding: '1rem' }}>
                No completions this day
              </p>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dayDetail.completed.map((h) => (
                  <li key={h.id} className="glass" style={{ padding: '0.75rem 1rem' }}>
                    <strong>{h.name}</strong>
                    <span className="pill" style={{ marginLeft: '0.5rem' }}>
                      {h.category}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {selected?.missed?.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Missed ({selected.missed.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {selected.missed.map((h) => (
                    <span key={h.id} className="pill pill-red">
                      {h.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Loader text="Loading..." />
        )}
      </Modal>
    </div>
  );
}
