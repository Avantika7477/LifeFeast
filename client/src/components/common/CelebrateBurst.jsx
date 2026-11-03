import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCelebrate } from '../../context/CelebrateContext';
import { useLanguage } from '../../context/LanguageContext';

const COLORS = ['#ffd166', '#ffb703', '#06d6a0', '#ff5d8f', '#ead6ff', '#5eead4'];

export default function CelebrateBurst() {
  const { burst, enabled } = useCelebrate();
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  const bits = useMemo(() => {
    if (!burst) return [];
    return Array.from({ length: 22 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 22 + (burst % 3) * 0.2;
      const dist = 90 + ((i * 37) % 80);
      return {
        id: `${burst}-${i}`,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        rot: (i * 47) % 360,
        color: COLORS[i % COLORS.length],
        size: 7 + (i % 5),
      };
    });
  }, [burst]);

  useEffect(() => {
    if (!burst || !enabled) return undefined;
    setShow(true);
    const timer = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(timer);
  }, [burst, enabled]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="celebrate-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-live="polite"
        >
          <div className="celebrate-stage">
            {bits.map((bit) => (
              <motion.span
                key={bit.id}
                className="celebrate-bit"
                style={{ background: bit.color, width: bit.size, height: bit.size }}
                initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
                animate={{ x: bit.x, y: bit.y, scale: 1, opacity: 0, rotate: bit.rot }}
                transition={{ duration: 1.05, ease: 'easeOut' }}
              />
            ))}
            <motion.div
              className="celebrate-card"
              initial={{ scale: 0.7, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            >
              <span className="celebrate-emoji" aria-hidden>
                ✨
              </span>
              <strong>{t('celebrate.title')}</strong>
              <p>{t('celebrate.line')}</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
