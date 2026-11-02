import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { notificationAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSignals } from '../../context/SignalsContext';
import { shoutNotification } from '../../utils/notify';
import { setVisibleInterval } from '../../utils/visibleInterval';

const SEEN_KEY = 'lq_chat_seen';
const POLL_MS = 30_000;

function readSeen() {
  try {
    return JSON.parse(sessionStorage.getItem(SEEN_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeSeen(map) {
  sessionStorage.setItem(SEEN_KEY, JSON.stringify(map));
}

function viewingFriend(pathname, search, friendId) {
  if (!friendId || !pathname.startsWith('/campfire')) return false;
  const params = new URLSearchParams(search);
  return params.get('friend') === String(friendId);
}

/** Toast + desktop notify when a new chat Signal arrives while the app is open. */
export default function ChatNotify() {
  const { user, showToast } = useAuth();
  const { refreshUnread } = useSignals();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;
  const primed = useRef(false);

  useEffect(() => {
    if (!user) {
      primed.current = false;
      return undefined;
    }

    const check = async () => {
      try {
        const { data } = await notificationAPI.unreadChat();
        const chats = (data || []).filter((n) => n.meta?.friendId);
        const seen = readSeen();
        let changed = false;

        for (const n of chats) {
          if (seen[n._id]) continue;
          seen[n._id] = 1;
          changed = true;

          if (!primed.current) continue;

          const friendId = n.meta.friendId;
          const loc = locationRef.current;
          if (viewingFriend(loc.pathname, loc.search, friendId)) continue;

          showToast(n.title ? `${n.title}: ${n.message}` : n.message, 'success');
          shoutNotification({
            title: n.title || 'New message',
            body: n.message,
            url: `/campfire?friend=${friendId}`,
          });
          refreshUnread();
        }

        if (!primed.current) {
          primed.current = true;
          const keep = {};
          chats.forEach((n) => {
            keep[n._id] = 1;
          });
          writeSeen(keep);
          return;
        }

        if (changed) writeSeen(seen);
      } catch {
        /* ignore network blips */
      }
    };

    return setVisibleInterval(check, POLL_MS, { runImmediately: true });
  }, [user, showToast, refreshUnread]);

  return null;
}
