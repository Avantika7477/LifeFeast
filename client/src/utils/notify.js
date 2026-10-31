import { notificationAPI } from '../api';

export function supportsPush() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export async function requestNotify() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

/** Subscribe for web push. No-ops safely when PushManager is missing (common on iOS Safari tabs). */
export async function subscribePush() {
  if (!supportsPush()) return false;
  const allowed = await requestNotify();
  if (!allowed) return false;
  try {
    const { data } = await notificationAPI.vapidKey();
    if (!data?.publicKey) return false;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });
    }
    await notificationAPI.subscribe(sub.toJSON());
    return true;
  } catch {
    return false;
  }
}

export async function shoutNotification({ title, body, url = '/dashboard' }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const payload = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'lifequest-unfinished',
    renotify: true,
    requireInteraction: true,
    data: { url },
  };
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    payload.vibrate = [220, 80, 220, 80, 420];
  }

  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg?.showNotification) {
      await reg.showNotification(title, payload);
      return;
    }
  } catch {
    // fall through to page notification
  }

  try {
    new Notification(title, payload);
  } catch {
    // some browsers block this outside a gesture
  }
}
