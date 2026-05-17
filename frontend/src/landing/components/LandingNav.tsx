import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      className={`lg-nav ${scrolled ? 'lg-nav--scrolled' : ''}`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to="/" className="lg-nav-logo">
        <img src="/favicon.svg" alt="" width={26} height={26} className="lg-nav-logo-img" />
        LexGuard
      </Link>
      <ul className="lg-nav-links">
        <li><a href="#problem">The Threat</a></li>
        <li><a href="#courtroom">AI Courtroom</a></li>
        <li><a href="#access">Every Human</a></li>
        <li><a href="#ecosystem">Platform</a></li>
        <li><a href="#live">Live Demo</a></li>
      </ul>
      <Link to="/app" className="lg-btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.8rem' }}>
        Launch System
      </Link>
    </motion.nav>
  );
}
