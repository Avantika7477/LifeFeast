/** Run `fn` on an interval only while the tab is visible; also fires when the tab becomes visible again. */
export function setVisibleInterval(fn, ms, { runImmediately = false } = {}) {
  let id = null;

  const tick = () => {
    if (document.visibilityState === 'visible') fn();
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') fn();
  };

  if (runImmediately) tick();
  id = setInterval(tick, ms);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    clearInterval(id);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
