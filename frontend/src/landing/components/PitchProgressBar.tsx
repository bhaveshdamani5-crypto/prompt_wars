import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Play } from 'lucide-react';

export default function PitchProgressBar() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 26 });
  const width = useTransform(smooth, [0, 1], ['6%', '100%']);

  return (
    <motion.footer
      className="lg-pitch-bar"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.7 }}
    >
      <Play size={14} className="lg-pitch-play" fill="currentColor" />
      <motion.div className="lg-pitch-track">
        <motion.div className="lg-pitch-fill" style={{ width }} />
      </motion.div>
      <span className="lg-pitch-label">Pitch journey</span>
    </motion.footer>
  );
}
