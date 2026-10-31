let audioCtx;

export async function unlockAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  return audioCtx;
}

/** Rising two-tone siren. Loud on purpose. */
export async function playSiren(seconds = 4) {
  const ctx = await unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.55, now + 0.06);
  master.gain.setValueAtTime(0.55, now + seconds - 0.25);
  master.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  master.connect(ctx.destination);

  const low = ctx.createOscillator();
  const high = ctx.createOscillator();
  low.type = 'sawtooth';
  high.type = 'square';

  const lowGain = ctx.createGain();
  const highGain = ctx.createGain();
  lowGain.gain.value = 0.85;
  highGain.gain.value = 0.28;
  low.connect(lowGain).connect(master);
  high.connect(highGain).connect(master);

  const step = 0.32;
  let t = now;
  let up = true;
  while (t < now + seconds) {
    const next = Math.min(t + step, now + seconds);
    low.frequency.setValueAtTime(up ? 560 : 880, t);
    low.frequency.linearRampToValueAtTime(up ? 920 : 520, next);
    high.frequency.setValueAtTime(up ? 1120 : 740, t);
    high.frequency.linearRampToValueAtTime(up ? 1480 : 680, next);
    t = next;
    up = !up;
  }

  low.start(now);
  high.start(now);
  low.stop(now + seconds);
  high.stop(now + seconds);
}
