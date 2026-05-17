import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeUp } from '../motion';
import { ArrowRight, Lock } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="lg-section lg-section--full" id="cta">
      <div className="lg-cta-final">
        <div className="lg-orb lg-orb--violet" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.3 }} />

        <div className="lg-particles">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="lg-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.1, 0.5, 0.1],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          style={{ position: 'relative', zIndex: 10 }}
        >
          <motion.div variants={fadeUp} custom={0} style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(34,211,238,0.2))',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(99,102,241,0.3)',
            }}>
              <Lock size={24} color="#818cf8" />
            </div>
          </motion.div>

          <motion.h2 className="lg-display" variants={fadeUp} custom={1}>
            Ready to take back your power?
          </motion.h2>

          <motion.p variants={fadeUp} custom={2}
            style={{ color: 'var(--v-muted)', fontSize: '1.1rem', maxWidth: '32ch', margin: '0 auto 3rem', lineHeight: 1.6 }}
          >
            Join 50,000+ professionals who never sign a contract blindly.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/app" className="lg-btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>
              Protect Your First Contract <ArrowRight size={18} />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <footer style={{
        textAlign: 'center', padding: '2.5rem 1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontFamily: 'var(--v-font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--v-white)', letterSpacing: '-0.02em' }}>
            LEXGUARD
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--v-dim)' }}>
            © {new Date().getFullYear()} LexGuard AI Systems. Not legal advice.
          </p>
        </div>
      </footer>
    </section>
  );
}
