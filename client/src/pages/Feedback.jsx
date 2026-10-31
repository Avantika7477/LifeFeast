import { useEffect, useState } from 'react';
import { feedbackAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const STARS = [1, 2, 3, 4, 5];

function starLabel(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function statusCopy(item) {
  if (item.kind === 'improve') {
    return item.reverted ? 'Archived by admin' : 'Private to admin';
  }
  return item.reverted ? 'Hidden by admin' : 'On the wall';
}

function statusClass(item) {
  if (item.reverted) return 'pill-red';
  if (item.kind === 'improve') return 'pill-amber';
  return 'pill-green';
}

export default function Feedback() {
  const { showToast } = useAuth();
  const [kind, setKind] = useState('review');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ count: 0, average: 0 });
  const [mine, setMine] = useState([]);

  const load = async () => {
    const [{ data: wall }, { data: own }] = await Promise.all([feedbackAPI.wall(), feedbackAPI.mine()]);
    setReviews(wall.reviews || []);
    setStats(wall.stats || { count: 0, average: 0 });
    setMine(own || []);
  };

  useEffect(() => {
    load()
      .catch((e) => showToast(e.response?.data?.message || 'Could not load feedback', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await feedbackAPI.create({
        kind,
        rating: kind === 'review' ? rating : undefined,
        title: title.trim(),
        message: message.trim(),
      });
      showToast(kind === 'review' ? 'Review posted' : 'Private note sent to the admin');
      setTitle('');
      setMessage('');
      setRating(5);
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not send', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this note?')) return;
    try {
      await feedbackAPI.remove(id);
      showToast('Removed');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete', 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Feedback</h2>
          <p>
            Share a public review, or send a private note about what we should update. Improvement
            messages go only to the admin, who can hide a review from the wall.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass">
          <div className="stat-label">Average rating</div>
          <div className="stat-value">{stats.count ? stats.average.toFixed(1) : '—'}</div>
          <p className="stat-hint">{stats.count ? starLabel(Math.round(stats.average)) : 'Be the first review'}</p>
          <span className="stat-icon">⭐</span>
        </div>
        <div className="stat-card glass">
          <div className="stat-label">Public reviews</div>
          <div className="stat-value">{stats.count}</div>
          <p className="stat-hint">Visible on the wall</p>
          <span className="stat-icon">🗣️</span>
        </div>
      </div>

      <div className="charts-grid">
        <form className="glass copy-card" onSubmit={submit}>
          <h3>Write a note</h3>
          <div className="feedback-kind" role="group" aria-label="Feedback type">
            <button
              type="button"
              className={kind === 'review' ? 'active' : ''}
              onClick={() => setKind('review')}
            >
              <strong>Public review</strong>
              <span>Other heroes can read this on the wall.</span>
            </button>
            <button
              type="button"
              className={kind === 'improve' ? 'active' : ''}
              onClick={() => setKind('improve')}
            >
              <strong>Private note</strong>
              <span>Only the admin sees this. Tell us what to improve.</span>
            </button>
          </div>

          {kind === 'review' && (
            <div className="form-group">
              <label>Rating</label>
              <div className="star-picker">
                {STARS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`star-btn ${rating >= n ? 'on' : ''}`}
                    onClick={() => setRating(n)}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                    aria-pressed={rating >= n}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Title (optional)</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 80))}
              placeholder={kind === 'review' ? 'What stood out?' : 'What should we update?'}
              maxLength={80}
            />
          </div>

          <div className="form-group">
            <label>{kind === 'review' ? 'Your review' : 'What can we do better?'}</label>
            <textarea
              className="form-control"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
              placeholder={
                kind === 'review'
                  ? 'How has LifeQuest felt so far?'
                  : 'Bugs, missing features, confusing screens — write it here. Only the admin can read this.'
              }
              required
              minLength={8}
              maxLength={2000}
            />
            <span className="feedback-count">{message.length}/2000</span>
          </div>

          <p className="feedback-privacy">
            {kind === 'review'
              ? 'This review is public unless an admin hides it.'
              : 'This message stays private. Regular users never see it.'}
          </p>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Sending...' : kind === 'review' ? 'Post review' : 'Send to admin'}
          </button>
        </form>

        <div className="glass copy-card">
          <h3>Your notes</h3>
          {mine.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.4rem 0.5rem' }}>
              <div className="empty-icon">📝</div>
              <h3>Nothing sent yet</h3>
              <p>Post a review or a private improvement note.</p>
            </div>
          ) : (
            <ul className="feedback-list">
              {mine.map((item) => (
                <li key={item._id} className={`feedback-card glass ${item.reverted ? 'reverted' : ''}`}>
                  <div className="feedback-meta">
                    <span className={`pill ${statusClass(item)}`}>{statusCopy(item)}</span>
                    {item.kind === 'review' && item.rating ? (
                      <span className="feedback-stars">{starLabel(item.rating)}</span>
                    ) : null}
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  {item.title ? <strong>{item.title}</strong> : null}
                  <p className="feedback-message">{item.message}</p>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => remove(item._id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section className="feedback-wall">
        <h3>Review wall</h3>
        {reviews.length === 0 ? (
          <div className="empty-state glass">
            <div className="empty-icon">⭐</div>
            <h3>The wall is quiet</h3>
            <p>Be the first to leave a public review of LifeQuest.</p>
          </div>
        ) : (
          <div className="cards-grid">
            {reviews.map((item) => (
              <article key={item._id} className="glass feedback-card">
                <div className="feedback-meta">
                  <span className="avatar">{item.user?.name?.[0]?.toUpperCase() || '?'}</span>
                  <strong>{item.user?.name || 'Hero'}</strong>
                  {item.rating ? <span className="feedback-stars">{starLabel(item.rating)}</span> : null}
                </div>
                {item.title ? <h4>{item.title}</h4> : null}
                <p className="feedback-message">{item.message}</p>
                <span className="feedback-date">{new Date(item.createdAt).toLocaleDateString()}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
