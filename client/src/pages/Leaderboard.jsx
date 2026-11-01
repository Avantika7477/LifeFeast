import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { leaderboardAPI, socialAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Loader from '../components/common/Loader';

function FriendAction({ row, onRequest, onRespond, onUnfriend, busy, t }) {
  if (row.isMe || row.relation === 'me') return null;
  if (row.relation === 'friends') {
    return (
      <div className="hero-actions">
        <span className="pill pill-green">{t('heroes.friendsLabel')}</span>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          disabled={busy}
          onClick={() => onUnfriend(row)}
        >
          {t('heroes.unfriend')}
        </button>
      </div>
    );
  }
  if (row.relation === 'outgoing') return <span className="pill">{t('heroes.requested')}</span>;
  if (row.relation === 'incoming') {
    return (
      <div className="hero-actions">
        <button className="btn btn-accent btn-sm" disabled={busy} onClick={() => onRespond(row.requestId, 'accept')}>
          {t('heroes.accept')}
        </button>
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onRespond(row.requestId, 'decline')}>
          {t('heroes.decline')}
        </button>
      </div>
    );
  }
  return (
    <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => onRequest(row.id)}>
      {t('heroes.add')}
    </button>
  );
}

export default function Leaderboard() {
  const { showToast } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'friends' ? 'friends' : 'global';
  const [sort, setSort] = useState('xp');
  const [rows, setRows] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState('');

  const setTab = (next) => {
    if (next === 'friends') setSearchParams({ tab: 'friends' });
    else setSearchParams({});
  };

  const loadBoard = async () => {
    setLoading(true);
    try {
      const [{ data }, reqs] = await Promise.all([
        tab === 'global' ? leaderboardAPI.global(sort) : leaderboardAPI.friends(sort),
        socialAPI.requests().catch(() => ({ data: { incoming: [], outgoing: [] } })),
      ]);
      setRows(data);
      setRequests(reqs.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoard();
  }, [tab, sort]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      socialAPI
        .people(q)
        .then((res) => setResults(res.data))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const refreshAll = async () => {
    await loadBoard();
    const q = query.trim();
    if (q.length >= 2) {
      const { data } = await socialAPI.people(q);
      setResults(data);
    }
  };

  const requestById = async (userId) => {
    setBusyId(userId);
    try {
      const { data } = await socialAPI.requestFriend({ userId });
      showToast(data.message);
      await refreshAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('campfire.sendFailed'), 'error');
    } finally {
      setBusyId('');
    }
  };

  const requestByQuery = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setBusyId('search');
    try {
      const payload = q.includes('@') ? { email: q } : results[0] ? { userId: results[0].id } : null;
      if (!payload) {
        showToast(t('heroes.noMatchToast'), 'error');
        return;
      }
      const { data } = await socialAPI.requestFriend(payload);
      showToast(data.message);
      setQuery('');
      await refreshAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('campfire.sendFailed'), 'error');
    } finally {
      setBusyId('');
    }
  };

  const respond = async (id, action) => {
    setBusyId(id);
    try {
      const { data } = await socialAPI.respondFriend(id, action);
      showToast(data.message);
      await refreshAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('common.failed'), 'error');
    } finally {
      setBusyId('');
    }
  };

  const unfriend = async (row) => {
    const name = row.name || t('campfire.yourFriend');
    if (!window.confirm(t('heroes.unfriendConfirm', { name }))) return;
    setBusyId(row.id);
    try {
      const { data } = await socialAPI.unfriend(row.id);
      showToast(data.message || t('heroes.unfriended'));
      await refreshAll();
    } catch (err) {
      showToast(err.response?.data?.message || t('common.failed'), 'error');
    } finally {
      setBusyId('');
    }
  };

  const showSearch = query.trim().length >= 2;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('heroes.title')}</h2>
          <p>{t('heroes.lead')}</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'global' ? 'active' : ''}`} onClick={() => setTab('global')}>
          {t('heroes.global')}
        </button>
        <button className={`tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
          {t('heroes.friends')}
          {requests.incoming.length > 0 && (
            <span className="nav-unread">{requests.incoming.length > 9 ? '9+' : requests.incoming.length}</span>
          )}
        </button>
        <button className={`tab ${sort === 'xp' ? 'active' : ''}`} onClick={() => setSort('xp')}>
          {t('heroes.topXp')}
        </button>
        <button className={`tab ${sort === 'streak' ? 'active' : ''}`} onClick={() => setSort('streak')}>
          {t('heroes.topStreak')}
        </button>
      </div>

      <form className="hero-search" onSubmit={requestByQuery}>
        <input
          className="form-control"
          placeholder={t('heroes.searchPh')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={busyId === 'search' || query.trim().length < 2}>
          {t('heroes.sendRequest')}
        </button>
      </form>

      {showSearch && (
        <div className="glass hero-search-results">
          {searching && <p className="install-help">{t('heroes.looking')}</p>}
          {!searching && results.length === 0 && (
            <p className="install-help">{t('heroes.noMatch')}</p>
          )}
          {results.map((r) => (
            <div key={r.id} className="hero-row">
              <div className="avatar">{r.name?.[0]}</div>
              <div className="hero-row-copy">
                <strong>{r.name}</strong>
                <div className="hero-row-meta">
                  <span>{t('heroes.lv', { level: r.level })}</span>
                  <span>{r.xp} XP</span>
                </div>
              </div>
              <FriendAction
                row={r}
                onRequest={requestById}
                onRespond={respond}
                onUnfriend={unfriend}
                busy={!!busyId}
                t={t}
              />
            </div>
          ))}
        </div>
      )}

      {tab === 'friends' && requests.incoming.length > 0 && (
        <div className="cards-grid" style={{ marginBottom: '1.25rem' }}>
          {requests.incoming.map((r) => (
            <div key={r.id} className="glass habit-card">
              <h4>{r.user?.name}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {t('heroes.wantsFriends', { level: r.user?.level })}
              </p>
              <div className="hero-actions" style={{ marginTop: '0.85rem' }}>
                <button className="btn btn-accent btn-sm" disabled={!!busyId} onClick={() => respond(r.id, 'accept')}>
                  {t('heroes.accept')}
                </button>
                <button className="btn btn-ghost btn-sm" disabled={!!busyId} onClick={() => respond(r.id, 'decline')}>
                  {t('heroes.decline')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'friends' && requests.outgoing.length > 0 && !showSearch && (
        <p className="install-help">
          {t('heroes.waitingOn', { names: requests.outgoing.map((r) => r.user?.name).filter(Boolean).join(', ') })}
        </p>
      )}

      {loading ? (
        <Loader />
      ) : (
        <div className="glass hero-list">
          {rows.map((r) => (
            <div key={r.id} className={`hero-row${r.isMe ? ' is-me' : ''}`}>
              <div className="hero-rank">{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : `#${r.rank}`}</div>
              <div className="avatar">{r.name?.[0]}</div>
              <div className="hero-row-copy">
                <strong>
                  {r.name}
                  {r.isMe && <span className="pill">{t('heroes.you')}</span>}
                </strong>
                <div className="hero-row-meta">
                  <span>{t('heroes.lv', { level: r.level })}</span>
                  <span>{r.xp} XP</span>
                  <span>🔥 {r.currentStreak}</span>
                  <span>🪙 {r.coins}</span>
                </div>
              </div>
              <FriendAction
                row={r}
                onRequest={requestById}
                onRespond={respond}
                onUnfriend={unfriend}
                busy={!!busyId}
                t={t}
              />
            </div>
          ))}
          {rows.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <h3>{tab === 'friends' ? t('heroes.emptyFriends') : t('heroes.emptyHall')}</h3>
              <p>
                {tab === 'friends' ? t('heroes.emptyFriendsLead') : t('heroes.emptyHallLead')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
