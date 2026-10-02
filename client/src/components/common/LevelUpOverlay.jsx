import { motion, AnimatePresence } from 'framer-motion';

export default function LevelUpOverlay({ show, level, onClose }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="levelup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="levelup-card glass"
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>LEVEL UP!</p>
            <div className="lvl">{level}</div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
              You earned +50 coins bonus!
            </p>
            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={onClose}>
              Continue Quest
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
