import { useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import './landing.css';
import LandingNav from './components/LandingNav';
import HeroSection from './sections/HeroSection';
import ProblemSection from './sections/ProblemSection';
import CourtroomSection from './sections/CourtroomSection';
import AccessibilitySection from './sections/AccessibilitySection';
import FeaturesSection from './sections/FeaturesSection';
import PitchProgressBar from './components/PitchProgressBar';
import LiveDocSection from './sections/LiveDocSection';
import TrustSection from './sections/TrustSection';
import CTASection from './sections/CTASection';

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <motion.div
      className="landing-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, #e879f9, #818cf8, #22d3ee)',
          transformOrigin: '0%',
          scaleX,
          zIndex: 200,
        }}
      />
      <motion.div className="lg-mesh-bg" aria-hidden animate={{ opacity: [0.95, 1, 0.95] }} transition={{ duration: 12, repeat: Infinity }} />
      <div className="lg-grain" aria-hidden />
      <LandingNav />
      <main>
        <HeroSection />
        <ProblemSection />
        <CourtroomSection />
        <AccessibilitySection />
        <FeaturesSection />
        <LiveDocSection />
        <TrustSection />
        <CTASection />
      </main>
      <PitchProgressBar />
    </motion.div>
  );
}
