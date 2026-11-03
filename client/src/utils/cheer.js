import { unlockAudio } from './siren';

/** Short major-key fanfare. Stops on its own after ~1.4s. */
export async function playCheer() {
  const ctx = await unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.04);
  master.gain.setValueAtTime(0.2, now + 1.05);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
  master.connect(ctx.destination);

  const notes = [
    { freq: 523.25, at: 0, len: 0.16 },
    { freq: 659.25, at: 0.12, len: 0.16 },
    { freq: 783.99, at: 0.24, len: 0.18 },
    { freq: 1046.5, at: 0.4, len: 0.55 },
    { freq: 1318.51, at: 0.52, len: 0.35 },
  ];

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, now + note.at);
    gain.gain.setValueAtTime(0.0001, now + note.at);
    gain.gain.exponentialRampToValueAtTime(0.9, now + note.at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.len);
    osc.connect(gain).connect(master);
    osc.start(now + note.at);
    osc.stop(now + note.at + note.len + 0.02);
  }
}
