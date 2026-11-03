export default function CampFlame({ days = 0, size = 'md' }) {
  const n = Math.min(21, Math.max(0, Number(days) || 0));
  const height = size === 'sm' ? 36 + n : size === 'lg' ? 72 + n * 3 : 52 + n * 2;
  return (
    <div
      className={`camp-flame camp-flame-${size}`}
      style={{ '--flame-h': `${height}px` }}
      aria-hidden
    >
      <span className="camp-flame-glow" />
      <span className="camp-flame-core" />
      <span className="camp-flame-tip" />
      <span className="camp-flame-logs" />
    </div>
  );
}
