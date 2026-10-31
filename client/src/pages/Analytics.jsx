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
import { useLanguage } from '../context/LanguageContext';
import Loader from '../components/common/Loader';
import { catLabel } from '../i18n';

const COLORS = ['#FFB703', '#06D6A0', '#FF7B54', '#FF5D8F', '#5EEAD4', '#FFD166', '#8B5CF6', '#FB8500', '#EAD6FF'];

export default function Analytics() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressAPI
      .analytics()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!data) return <p>{t('analytics.failed')}</p>;
  const pie = (data.pie || []).map((slice) => ({ ...slice, name: catLabel(t, slice.name) }));

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
          <h2>{t('analytics.title')}</h2>
          <p>{t('analytics.lead')}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass">
          <div className="stat-label">{t('analytics.longest')}</div>
          <div className="stat-value">{data.longestStreak} 🔥</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-label">{t('analytics.avg')}</div>
          <div className="stat-value">{data.averageCompletion}%</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-label">{t('analytics.best')}</div>
          <div className="stat-value" style={{ fontSize: '1.1rem' }}>
            {data.bestHabit?.name || '—'}
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-label">{t('analytics.needs')}</div>
          <div className="stat-value" style={{ fontSize: '1.1rem' }}>
            {data.worstHabit?.name || '—'}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="glass chart-card">
          <h3>{t('analytics.daily')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#241a52', border: 'none', borderRadius: 8 }} />
              <Line type="monotone" dataKey="completion" stroke="#FFB703" strokeWidth={2} dot={{ fill: '#06D6A0' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass chart-card">
          <h3>{t('analytics.weekly')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#241a52', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="completion" fill="#FFB703" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass chart-card">
          <h3>{t('analytics.monthly')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#241a52', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="completion" fill="#06D6A0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass chart-card">
          <h3>{t('analytics.yearly')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.yearly.length ? data.yearly : [{ year: new Date().getFullYear(), count: 0 }]}>
              <XAxis dataKey="year" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#241a52', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#FF7B54" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass chart-card">
          <h3>{t('analytics.category')}</h3>
          {pie.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>{t('analytics.noCategory')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#241a52', border: 'none', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass chart-card">
          <h3>{t('analytics.heatmap')}</h3>
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
