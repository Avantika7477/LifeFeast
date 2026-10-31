export async function requestNotify() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
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
    vibrate: [220, 80, 220, 80, 420],
    data: { url },
  };

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
