import { motion } from 'framer-motion';

const spring = { type: 'spring', stiffness: 400, damping: 16 };

export function AnimatedCheck({ size = 26, color = '#ffffff' }) {
  return (
    <motion.span
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={spring}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <motion.path
          d="M4 12.5l5 5L20 6.5"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.15 }}
        />
      </svg>
    </motion.span>
  );
}

export function AnimatedX({ size = 26, color = '#ffffff' }) {
  return (
    <motion.span
      initial={{ scale: 0, rotate: 30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={spring}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <motion.path
          d="M6 6l12 12M18 6L6 18"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
        />
      </svg>
    </motion.span>
  );
}

export function AnimatedTrash({ size = 22, color = '#ffffff' }) {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={spring}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <motion.path
          d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </svg>
    </motion.span>
  );
}

export function AnimatedThumbsDown({ size = 24, color = '#ffffff' }) {
  return (
    <motion.span
      initial={{ y: -8, rotate: 8 }}
      animate={{ y: 0, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 14 }}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <motion.path
          d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.7a2 2 0 0 0-2 1.6l-1.6 8A2 2 0 0 0 4 14h6zM22 2h-4v11h4V2z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        />
      </svg>
    </motion.span>
  );
}
