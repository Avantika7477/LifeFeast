import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { progressAPI } from '../api';
import Loader from '../components/common/Loader';

const COLORS = ['#4F46E5', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#8B5CF6', '#14B8A6', '#3B82F6'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressAPI
      .analytics()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!data) return <p>Failed to load analytics</p>;

  const heatClass = (rate) => {
    if (rate >= 80) return 'heat-4';
    if (rate >= 50) return 'heat-3';
    if (rate >= 25) return 'heat-2';
    if (rate > 0) return 'heat-1';
    return 'heat-0';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Analytics</h2>
          <p>Your progress at a glance</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass">
          <div className="stat-label">Longest Streak</div>
          <div className="stat-value">{data.longestStreak} 🔥</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-label">Avg Completion</div>
          <div className="stat-value">{data.averageCompletion}%</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-label">Best Habit</div>
          <div className="stat-value" style={{ fontSize: '1.1rem' }}>
            {data.bestHabit?.name || '—'}
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-label">Needs Work</div>
          <div className="stat-value" style={{ fontSize: '1.1rem' }}>
            {data.worstHabit?.name || '—'}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="glass chart-card">
          <h3>Daily Progress (7 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
              <Line type="monotone" dataKey="completion" stroke="#4F46E5" strokeWidth={2} dot={{ fill: '#22C55E' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass chart-card">
          <h3>Weekly Progress</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="completion" fill="#4F46E5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass chart-card">
          <h3>Monthly Progress</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="completion" fill="#22C55E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass chart-card">
          <h3>Yearly Completions</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.yearly.length ? data.yearly : [{ year: new Date().getFullYear(), count: 0 }]}>
              <XAxis dataKey="year" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass chart-card">
          <h3>Category Breakdown</h3>
          {data.pie.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Complete habits to see category data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {data.pie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass chart-card">
          <h3>Completion Heatmap (90 days)</h3>
          <div className="heatmap" title="Completion rate by day">
            {data.heatmap.map((h) => (
              <div
                key={h.date}
                className={`heat-cell ${heatClass(h.rate)}`}
                title={`${h.date}: ${h.rate}% (${h.count})`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
