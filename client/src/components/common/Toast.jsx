import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function Toast() {
  const { toast } = useAuth();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className={`toast glass ${toast.type}`}
          initial={{ opacity: 0, y: 40, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
