import { useEffect, useState } from 'react';

const DISMISS_KEY = 'lq_pwa_dismissed';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIos() {
  const ua = window.navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // iPadOS 13+ can report as Macintosh with touch
  return /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
}

export function usePwaInstall() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const ios = isIos();

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setDeferred(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      localStorage.removeItem(DISMISS_KEY);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return false;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === 'accepted';
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return {
    installed,
    canInstall: Boolean(deferred) && !installed,
    showIosHelp: ios && !installed,
    showBanner: !installed && !dismissed && (Boolean(deferred) || ios),
    install,
    dismiss,
  };
}
