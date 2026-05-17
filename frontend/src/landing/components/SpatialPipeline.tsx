import { motion } from 'framer-motion';

const CUBES = [
  { color: 'amber', offset: 0.12, delay: 0 },
  { color: 'cyan', offset: 0.45, delay: 0.8 },
  { color: 'cyan', offset: 0.72, delay: 1.6 },
];

export default function SpatialPipeline() {
  return (
    <motion.div
      className="lg-pipeline-wrap"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden
    >
      <svg className="lg-pipeline-svg" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
          <filter id="glowAmber">
            <feGaussianBlur stdDeviation="12" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glowCyan">
            <feGaussianBlur stdDeviation="14" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <motion.path
          d="M 40 320 C 120 80, 280 40, 400 200 S 680 360, 760 120"
          fill="none"
          stroke="url(#trackGrad)"
          strokeWidth="28"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d="M 40 320 C 120 80, 280 40, 400 200 S 680 360, 760 120"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      {CUBES.map((cube, i) => (
        <motion.div
          key={i}
          className={`lg-pipeline-cube lg-pipeline-cube--${cube.color}`}
          style={{ offsetPath: 'path("M 40 320 C 120 80, 280 40, 400 200 S 680 360, 760 120")' }}
          initial={{ offsetDistance: `${cube.offset * 100}%`, opacity: 0, scale: 0 }}
          animate={{
            offsetDistance: [`${cube.offset * 100}%`, `${Math.min(cube.offset * 100 + 35, 95)}%`, `${cube.offset * 100}%`],
            opacity: 1,
            scale: 1,
          }}
          transition={{
            offsetDistance: { duration: 8, repeat: Infinity, ease: 'easeInOut', delay: cube.delay },
            opacity: { duration: 0.8, delay: 0.5 + i * 0.2 },
            scale: { duration: 0.8, delay: 0.5 + i * 0.2 },
          }}
        />
      ))}

      <motion.div
        className="lg-pipeline-glow lg-pipeline-glow--amber"
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.15, 1] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="lg-pipeline-glow lg-pipeline-glow--cyan"
        animate={{ opacity: [0.2, 0.55, 0.2], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 6, repeat: Infinity, delay: 1 }}
      />
    </motion.div>
  );
}
