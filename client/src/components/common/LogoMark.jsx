export default function LogoMark({ className = '' }) {
  return (
    <div className={`logo-mark ${className}`.trim()} aria-hidden>
      <svg className="logo-mark-svg" viewBox="0 0 64 64" fill="none">
        <path d="M32 7 50 18.2V36c0 11-8.4 18.6-18 21.2C22.4 54.6 14 47 14 36V18.2L32 7z" fill="#fff7ea" />
        <path d="M32 10.2 47 19.4V36c0 9.2-6.8 15.6-15 17.8C23.8 51.6 17 45.2 17 36V19.4L32 10.2z" fill="none" stroke="#3b1460" strokeWidth="1.6" />
        <rect x="10" y="36.5" width="44" height="5" rx="2.4" fill="#3b1460" />
        <rect x="6" y="32" width="6" height="14" rx="2" fill="#3b1460" />
        <rect x="52" y="32" width="6" height="14" rx="2" fill="#3b1460" />
        <rect x="11.5" y="29.5" width="8" height="19" rx="2.4" fill="#fb8500" />
        <rect x="44.5" y="29.5" width="8" height="19" rx="2.4" fill="#fb8500" />
        <path d="M32 14c4.2 7.4 11 10.6 11 18.6 0 7.2-4.8 12.2-11 12.2S21 39.8 21 32.6C21 24.6 27.8 21.4 32 14z" fill="#ffb703" />
        <path d="M32 20.5c1.8 3.6 5 5.4 5 9.2 0 3.2-2.2 5.3-5 5.3s-5-2.1-5-5.3c0-3.8 3.2-5.6 5-9.2z" fill="#fff3c4" />
      </svg>
    </div>
  );
}
