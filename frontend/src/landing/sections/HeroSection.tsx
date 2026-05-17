import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import LexGuardLogo from '../../components/LexGuardLogo';
import { fadeUp } from '../motion';

const TITLE_LINES = ['LexGuard', 'AI', 'Contract', 'Review'];

const STATS = [
  { val: '94%', label: 'Hidden clauses caught' },
  { val: '8–15s', label: 'Fast scan time' },
  { val: '19+', label: 'AI specialist agents' },
];

export default function HeroSection() {
  return (
    <section className="lg-hero lg-hero--advanced" id="hero">
      <motion.div
        className="lg-hero-grid lg-hero-grid--advanced"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div className="lg-hero-copy" variants={fadeUp} custom={0}>
          <p className="lg-eyebrow lg-eyebrow--minimal">
            An AI legal shield for every human
          </p>

          <h1 className="lg-display lg-hero-title-stack" aria-label="LexGuard AI Contract Review">
            {TITLE_LINES.map((line, i) => (
              <motion.span
                key={line}
                className="lg-hero-title-line"
                initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.75, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                {line}
              </motion.span>
            ))}
          </h1>

          <motion.p className="lg-hero-sub" variants={fadeUp} custom={1}>
            Specialist agents debate every clause, simplify language for any literacy level,
            and narrate risks in seven Indian languages—before you sign.
          </motion.p>

          <motion.div className="lg-hero-cta" variants={fadeUp} custom={2}>
            <Link to="/app" className="lg-btn-primary lg-btn-primary--white">
              Start contract review <ArrowRight size={18} />
            </Link>
            <a href="#courtroom" className="lg-btn-ghost">
              <Zap size={16} /> Watch AI courtroom
            </a>
          </motion.div>

          <motion.div className="lg-hero-stats" variants={fadeUp} custom={3}>
            {STATS.map((s) => (
              <motion.div key={s.label} className="lg-hero-stat" whileHover={{ y: -3 }}>
                <span className="lg-hero-stat-val">{s.val}</span>
                <span className="lg-hero-stat-lbl">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div className="lg-hero-visual-wrap" variants={fadeUp} custom={4}>
          <LexGuardLogo size="hero" showWordmark />
        </motion.div>
      </motion.div>

      <motion.div
        className="lg-scroll-hint"
        animate={{ y: [0, 8, 0], opacity: [0.35, 0.85, 0.35] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      >
        <span className="lg-scroll-line" />
        <span>Scroll</span>
      </motion.div>
    </section>
  );
}
