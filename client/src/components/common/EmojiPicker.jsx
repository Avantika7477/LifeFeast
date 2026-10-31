import { useEffect, useRef, useState } from 'react';

const EMOJIS = [
  '😀', '😂', '🥹', '😍', '😎', '🤔', '😴', '🥳',
  '🔥', '⚔️', '🏆', '✨', '💪', '🎯', '⚡', '🌟',
  '❤️', '💜', '🙌', '👏', '👍', '🤝', '🫡', '🫶',
  '☕', '💧', '🌿', '🌙', '☀️', '🌈', '🎉', '🔔',
  '😅', '😭', '😤', '🤯', '😜', '👀', '💯', '✅',
];

export default function EmojiPicker({ onPick, label = 'Add emoji' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="emoji-picker" ref={wrapRef}>
      <button
        type="button"
        className="btn-icon emoji-picker-toggle"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        😊
      </button>
      {open && (
        <div className="emoji-picker-panel" role="listbox" aria-label="Emojis">
          {EMOJIS.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              type="button"
              className="emoji-picker-item"
              onClick={() => {
                onPick(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
