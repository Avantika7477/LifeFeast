import { useEffect, useState } from 'react';
import { leaderboardAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

export default function Leaderboard() {
  const { showToast } = useAuth();
  const [tab, setTab] = useState('global');
  const [sort, setSort] = useState('xp');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendEmail, setFriendEmail] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } =
        tab === 'global'
          ? await leaderboardAPI.global(sort)
          : await leaderboardAPI.friends(sort);
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab, sort]);

  const addFriend = async (e) => {
    e.preventDefault();
    try {
      const { data } = await leaderboardAPI.addFriend(friendEmail);
      showToast(data.message);
      setFriendEmail('');
      if (tab === 'friends') load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Leaderboard</h2>
          <p>Compete with heroes worldwide</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'global' ? 'active' : ''}`} onClick={() => setTab('global')}>
          Global
        </button>
        <button className={`tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
          Friends
        </button>
        <button className={`tab ${sort === 'xp' ? 'active' : ''}`} onClick={() => setSort('xp')}>
          Top XP
        </button>
        <button className={`tab ${sort === 'streak' ? 'active' : ''}`} onClick={() => setSort('streak')}>
          Top Streak
        </button>
      </div>

      {tab === 'friends' && (
        <form onSubmit={addFriend} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input
            className="form-control"
            style={{ flex: 1, minWidth: 200 }}
            placeholder="Friend's email"
            value={friendEmail}
            onChange={(e) => setFriendEmail(e.target.value)}
            type="email"
            required
          />
          <button className="btn btn-primary" type="submit">
            Add Friend
          </button>
        </form>
      )}

      {loading ? (
        <Loader />
      ) : (
        <div className="glass table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Hero</th>
                <th>Level</th>
                <th>XP</th>
                <th>Streak</th>
                <th>Coins</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={r.isMe ? { background: 'rgba(79,70,229,0.12)' } : undefined}>
                  <td>
                    {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : `#${r.rank}`}
                  </td>
                  <td>
                    <div className="user-chip">
                      <div className="avatar">{r.name?.[0]}</div>
                      {r.name}
                      {r.isMe && <span className="pill">You</span>}
                    </div>
                  </td>
                  <td>{r.level}</td>
                  <td>{r.xp}</td>
                  <td>🔥 {r.currentStreak}</td>
                  <td>🪙 {r.coins}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="empty-state">No adventurers yet</div>
          )}
        </div>
      )}
    </div>
  );
}
