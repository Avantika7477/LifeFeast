import { useId } from 'react';

function Ember({ gid }) {
  return (
    <svg viewBox="0 0 64 72" className="camp-companion-svg">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="55%" stopColor="#fb8500" />
          <stop offset="100%" stopColor="#ff5d8f" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gid})`}
        d="M32 6c8 14 22 22 22 38 0 14-10 24-22 24S10 58 10 44C10 28 24 20 32 6z"
      />
      <path fill="rgba(255,247,234,0.45)" d="M28 22c4 8 12 12 12 22 0 7-4 12-8 12s-8-5-8-12c0-10 4-16 4-22z" />
    </svg>
  );
}

function Fox({ gid }) {
  return (
    <svg viewBox="0 0 64 72" className="camp-companion-svg">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb703" />
          <stop offset="100%" stopColor="#e85d04" />
        </linearGradient>
      </defs>
      <path fill={`url(#${gid})`} d="M10 22 24 8l8 10 8-10 14 14-6 8H16z" />
      <ellipse cx="32" cy="46" rx="18" ry="16" fill={`url(#${gid})`} />
      <circle cx="26" cy="44" r="2.2" fill="#1a1240" />
      <circle cx="38" cy="44" r="2.2" fill="#1a1240" />
      <path d="M28 52h8" stroke="#1a1240" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Knight({ gid }) {
  return (
    <svg viewBox="0 0 64 72" className="camp-companion-svg">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ead6ff" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>
      </defs>
      <path fill={`url(#${gid})`} d="M18 18h28l4 10-6 6v8l-12 16-12-16v-8l-6-6z" />
      <path fill="#1a1240" d="M26 30h12v6H26z" opacity="0.55" />
      <rect x="28" y="14" width="8" height="8" fill={`url(#${gid})`} />
    </svg>
  );
}

function Owl({ gid }) {
  return (
    <svg viewBox="0 0 64 72" className="camp-companion-svg">
      <defs>
        <linearGradient id={gid} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#2e2263" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="40" rx="20" ry="22" fill={`url(#${gid})`} />
      <circle cx="24" cy="36" r="7" fill="#fff7ea" />
      <circle cx="40" cy="36" r="7" fill="#fff7ea" />
      <circle cx="24" cy="36" r="2.4" fill="#1a1240" />
      <circle cx="40" cy="36" r="2.4" fill="#1a1240" />
      <path d="M30 46h4l-2 5z" fill="#ffd166" />
    </svg>
  );
}

const FACES = { ember: Ember, fox: Fox, knight: Knight, owl: Owl };

export default function CampCompanion({ id = 'ember', mood = 'idle', size = 'md' }) {
  const gid = useId().replace(/:/g, '');
  const Face = FACES[id] || Ember;
  return (
    <div className={`camp-companion camp-companion-${size} is-${mood}`} aria-hidden>
      <Face gid={gid} />
    </div>
  );
}
