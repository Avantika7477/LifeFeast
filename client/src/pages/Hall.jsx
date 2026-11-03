import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hallAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import CampCompanion from '../components/camp/CampCompanion';
import CampFlame from '../components/camp/CampFlame';
import Loader from '../components/common/Loader';

const REACTIONS = [
  { id: 'cheer', glyph: '👏' },
  { id: 'keep', glyph: '🔥' },
  { id: 'gotthis', glyph: '💪' },
];

export default function Hall() {
  const { showToast, updateUserLocal, user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data: next } = await hallAPI.feed();
      setData(next);
      if (next.todayPost?.text) setText(next.todayPost.text);
    } catch (err) {
      showToast(err.response?.data?.message || t('common.failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const share = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await hallAPI.share(text);
      showToast(t('hall.shared'));
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || t('common.failed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const react = async (postId, kind) => {
    try {
      const { data: next } = await hallAPI.react(postId, kind);
      setData((prev) => ({
        ...prev,
        feed: prev.feed.map((p) => (p.id === postId ? next.post : p)),
        todayPost: prev.todayPost?.id === postId ? next.post : prev.todayPost,
      }));
    } catch (err) {
      showToast(err.response?.data?.message || t('common.failed'), 'error');
    }
  };

  const buy = async (id) => {
    try {
      const { data: next } = await hallAPI.buy(id);
      updateUserLocal(next.user);
      setData((prev) => ({ ...prev, shop: next.shop }));
      showToast(t('hall.unlocked'));
    } catch (err) {
      showToast(err.response?.data?.message || t('common.failed'), 'error');
    }
  };

  const equip = async (id) => {
    try {
      const { data: next } = await hallAPI.equip(id);
      updateUserLocal(next.user);
      setData((prev) => ({ ...prev, shop: next.shop }));
    } catch (err) {
      showToast(err.response?.data?.message || t('common.failed'), 'error');
    }
  };

  if (loading) return <Loader />;

  const shop = data?.shop;
  const snap = data?.snapshot;
  const equipped = shop?.equipped || user?.equippedCompanion || 'ember';

  return (
    <div className="hall-page">
      <section className="camp-ground hall-hero">
        <div className="camp-embers" aria-hidden />
        <div className="camp-ring">
          <div className="camp-figures">
            <CampFlame days={shop?.streak || 0} size="lg" />
            <CampCompanion id={equipped} mood="idle" size="lg" />
          </div>
          <div className="camp-copy">
            <p className="quest-kicker">{t('hall.kicker')}</p>
            <h2>{t('hall.title')}</h2>
            <p>{t('hall.lead')}</p>
          </div>
        </div>
      </section>

      <form className="lantern-card glass hall-compose" onSubmit={share}>
        <div className="hall-compose-top">
          <CampCompanion id={equipped} size="sm" />
          <div>
            <strong>{t('hall.shareTitle')}</strong>
            <p>
              {t('hall.snapshot', {
                done: snap?.habitsDone || 0,
                total: snap?.habitsTotal || 0,
                streak: snap?.streak || 0,
              })}
            </p>
          </div>
        </div>
        <textarea
          className="form-control"
          maxLength={140}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('hall.placeholder')}
        />
        <div className="hall-compose-actions">
          <span>{text.length}/140</span>
          <button className="btn btn-primary" type="submit" disabled={busy || text.trim().length < 2}>
            {data?.postedToday ? t('hall.update') : t('hall.share')}
          </button>
        </div>
      </form>

      {!data?.friendCount && (
        <div className="lantern-card glass hall-empty">
          <h3>{t('hall.emptyFriendsTitle')}</h3>
          <p>{t('hall.emptyFriends')}</p>
          <Link to="/leaderboard?tab=friends" className="btn btn-ghost">
            {t('hall.findFriends')}
          </Link>
        </div>
      )}

      <div className="hall-feed">
        {(data?.feed || []).length === 0 ? (
          <div className="lantern-card glass hall-empty">
            <h3>{t('hall.emptyTitle')}</h3>
            <p>{t('hall.empty')}</p>
          </div>
        ) : (
          data.feed.map((post) => (
            <article key={post.id} className="lantern-card glass hall-post">
              <header className="hall-post-head">
                <CampCompanion id={post.companion} mood={post.counts.cheer ? 'cheer' : 'idle'} />
                <div>
                  <strong>{post.mine ? t('common.you') : post.author?.name}</strong>
                  <p>
                    {t('hall.postMeta', {
                      streak: post.streak,
                      done: post.habitsDone,
                      total: post.habitsTotal,
                    })}
                  </p>
                </div>
              </header>
              <p className="hall-post-text">{post.text}</p>
              <div className="hall-reacts">
                {REACTIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`hall-react ${post.mineReaction === r.id ? 'on' : ''}`}
                    onClick={() => react(post.id, r.id)}
                  >
                    <span aria-hidden>{r.glyph}</span>
                    {t(`hall.${r.id}`)}
                    {post.counts[r.id] ? <em>{post.counts[r.id]}</em> : null}
                  </button>
                ))}
              </div>
            </article>
          ))
        )}
      </div>

      <section className="lantern-card glass hall-shop">
        <h3>{t('hall.shopTitle')}</h3>
        <p>{shop?.weekUnlocked ? t('hall.shopOpen') : t('hall.shopLocked', { n: Math.max(0, 7 - (shop?.streak || 0)) })}</p>
        <div className="hall-shop-grid">
          {(shop?.catalog || []).map((item) => (
            <div key={item.id} className={`hall-shop-item ${shop.equipped === item.id ? 'equipped' : ''}`}>
              <CampCompanion id={item.id} size="md" />
              <strong>{item.name}</strong>
              <p>{item.blurb}</p>
              {item.owned ? (
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => equip(item.id)} disabled={shop.equipped === item.id}>
                  {shop.equipped === item.id ? t('hall.seated') : t('hall.seat')}
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  disabled={!item.available}
                  onClick={() => buy(item.id)}
                >
                  {item.cost ? t('hall.buy', { n: item.cost }) : t('hall.claim')}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
