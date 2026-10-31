import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { socialAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Loader from '../components/common/Loader';
import EmojiPicker from '../components/common/EmojiPicker';

export default function Campfire() {
  const { user, showToast } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeNote, setChallengeNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const friendId = searchParams.get('friend');
  const active = friends.find((f) => f.id === friendId);

  const loadFriends = async () => {
    const { data } = await socialAPI.friends();
    setFriends(data);
    setLoading(false);
    if (!friendId && data[0]) setSearchParams({ friend: data[0].id });
  };

  const loadMessages = async () => {
    if (!friendId) return;
    const { data } = await socialAPI.messages(friendId);
    setMessages(data);
  };

  useEffect(() => {
    loadFriends().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMessages().catch(() => {});
    if (!friendId) return undefined;
    const timer = setInterval(() => {
      loadFriends().catch(() => {});
      loadMessages().catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, [friendId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!friendId || !text.trim()) return;
    setSending(true);
    try {
      const { data } = await socialAPI.sendMessage(friendId, text.trim());
      setMessages((prev) => [...prev, data]);
      setText('');
      inputRef.current?.focus();
      loadFriends();
    } catch (err) {
      showToast(err.response?.data?.message || t('campfire.sendFailed'), 'error');
    } finally {
      setSending(false);
    }
  };

  const challenge = async (e) => {
    e.preventDefault();
    if (!friendId || !challengeTitle.trim()) return;
    try {
      await socialAPI.sendChallenge({
        to: friendId,
        title: challengeTitle.trim(),
        description: challengeNote.trim(),
      });
      showToast(t('campfire.challengeSent', { name: active?.name || t('campfire.yourFriend') }));
      setChallengeTitle('');
      setChallengeNote('');
    } catch (err) {
      showToast(err.response?.data?.message || t('campfire.challengeFail'), 'error');
    }
  };

  const insertEmoji = (emoji) => {
    const field = inputRef.current;
    const start = field?.selectionStart ?? text.length;
    const end = field?.selectionEnd ?? text.length;
    const next = `${text.slice(0, start)}${emoji}${text.slice(end)}`.slice(0, 500);
    setText(next);
    requestAnimationFrame(() => {
      field?.focus();
      const cursor = Math.min(start + emoji.length, 500);
      field?.setSelectionRange(cursor, cursor);
    });
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('campfire.title')}</h2>
          <p>{t('campfire.lead')}</p>
        </div>
      </div>

      {friends.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon">🔥</div>
          <h3>{t('campfire.emptyTitle')}</h3>
          <p>{t('campfire.empty')}</p>
        </div>
      ) : (
        <div className={`campfire ${friendId ? 'has-thread' : ''}`}>
          <aside className="campfire-friends glass">
            {friends.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`campfire-friend ${friendId === f.id ? 'active' : ''}`}
                onClick={() => setSearchParams({ friend: f.id })}
              >
                <div className="avatar">{f.name?.[0]?.toUpperCase()}</div>
                <div className="campfire-friend-copy">
                  <strong>
                    <span className="campfire-friend-name">{f.name}</span>
                    {f.unread > 0 && <span className="nav-unread">{f.unread > 9 ? '9+' : f.unread}</span>}
                  </strong>
                  <span>{f.lastMessage || t('campfire.sayHello')}</span>
                </div>
              </button>
            ))}
          </aside>

          <section className="campfire-thread glass">
            {active ? (
              <>
                <header className="campfire-thread-head">
                  <button type="button" className="btn btn-ghost btn-sm campfire-back" onClick={() => setSearchParams({})}>
                    {t('campfire.friendsBack')}
                  </button>
                  <div>
                    <strong>{active.name}</strong>
                    <span>{t('campfire.levelN', { level: active.level })}</span>
                  </div>
                </header>
                <div className="campfire-messages">
                  {messages.length === 0 && <p className="install-help">{t('campfire.noMessages')}</p>}
                  {messages.map((m) => {
                    const mine = String(m.from?._id || m.from) === String(user?.id);
                    const emojiOnly = !/[A-Za-z0-9]/.test(m.text || '');
                    return (
                      <div
                        key={m._id}
                        className={`campfire-bubble ${mine ? 'mine' : 'theirs'}${emojiOnly ? ' emoji-only' : ''}`}
                      >
                        {m.text}
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <form className="campfire-compose" onSubmit={send}>
                  <EmojiPicker onPick={insertEmoji} />
                  <input
                    ref={inputRef}
                    className="form-control"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('campfire.messagePh', { name: active.name })}
                    maxLength={500}
                  />
                  <button className="btn btn-primary" type="submit" disabled={sending || !text.trim()}>
                    {t('campfire.send')}
                  </button>
                </form>
                <form className="campfire-challenge" onSubmit={challenge}>
                  <strong>{t('campfire.sendChallenge')}</strong>
                  <input
                    className="form-control"
                    value={challengeTitle}
                    onChange={(e) => setChallengeTitle(e.target.value)}
                    placeholder={t('campfire.challengePh')}
                    maxLength={80}
                  />
                  <input
                    className="form-control"
                    value={challengeNote}
                    onChange={(e) => setChallengeNote(e.target.value)}
                    placeholder={t('campfire.notePh')}
                    maxLength={240}
                  />
                  <button className="btn btn-ghost" type="submit" disabled={!challengeTitle.trim()}>
                    {t('campfire.challengeName', { name: active.name })}
                  </button>
                </form>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔥</div>
                <h3>{t('campfire.pickTitle')}</h3>
                <p>{t('campfire.pick')}</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
