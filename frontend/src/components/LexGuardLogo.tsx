import { motion } from 'framer-motion';

type Size = 'hero' | 'compact' | 'mini';

const MARK = { hero: 88, compact: 56, mini: 40 } as const;

export default function LexGuardLogo({
  size = 'hero',
  showWordmark = false,
}: {
  size?: Size;
  showWordmark?: boolean;
}) {
  const mark = MARK[size];

  return (
    <motion.div
      className={`lexguard-logo lexguard-logo--${size}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="lexguard-logo__frame"
        animate={{
          boxShadow: [
            '0 0 40px rgba(99, 102, 241, 0.2)',
            '0 0 56px rgba(34, 211, 238, 0.25)',
            '0 0 40px rgba(99, 102, 241, 0.2)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src="/favicon.svg"
          alt="LexGuard AI"
          width={mark}
          height={mark}
          className="lexguard-logo__img"
          draggable={false}
        />
      </motion.div>
      {showWordmark && (
        <span className="lexguard-logo__wordmark">LexGuard AI</span>
      )}
    </motion.div>
  );
}
