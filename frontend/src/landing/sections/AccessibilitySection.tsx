import { motion } from 'framer-motion';
import { fadeUp } from '../motion';
import { Mic, Globe, BookOpen, Headphones, MessageCircle, Eye } from 'lucide-react';

const FEATURES = [
  {
    icon: <Mic size={24} />,
    title: 'Voice-to-Text Intake',
    desc: 'Dictate your concerns in any language. LexGuard transcribes and maps them to contract clauses automatically.',
    color: '#6366f1',
  },
  {
    icon: <Globe size={24} />,
    title: '42-Language Support',
    desc: 'Legal explanations in your native tongue. Full multilingual output for summaries, risks, and redlines.',
    color: '#22d3ee',
  },
  {
    icon: <BookOpen size={24} />,
    title: '3-Level Simplifier',
    desc: 'Choose Professional, Simple, or Conversational. Complex legalese becomes crystal-clear in seconds.',
    color: '#10b981',
  },
  {
    icon: <Headphones size={24} />,
    title: 'Audio Narration',
    desc: 'Have your contract read to you. Perfect for visual impairments, long commutes, or multitasking.',
    color: '#f59e0b',
  },
  {
    icon: <MessageCircle size={24} />,
    title: 'Chat with Your Contract',
    desc: 'Ask any question about your document. Our AI answers in plain English, instantly.',
    color: '#f43f5e',
  },
  {
    icon: <Eye size={24} />,
    title: 'Accessibility-First',
    desc: 'Screen-reader optimized, high-contrast modes, and WCAG 2.2 AA compliant throughout.',
    color: '#8b5cf6',
  },
];

export default function AccessibilitySection() {
  return (
    <section className="lg-section" id="accessibility">
      <div className="lg-orb lg-orb--violet" style={{ bottom: '0', right: '10%', opacity: 0.25 }} />

      <motion.div
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.p className="lg-eyebrow" variants={fadeUp} custom={0} style={{ marginBottom: '1.5rem' }}>
          Accessibility & Language
        </motion.p>
        <motion.h2 className="lg-display" variants={fadeUp} custom={1}
          style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', maxWidth: '22ch', marginBottom: '0.75rem' }}
        >
          Legal protection in every language, for every person.
        </motion.h2>
        <motion.p variants={fadeUp} custom={2}
          style={{ color: 'var(--v-muted)', fontSize: '1.05rem', maxWidth: '44ch', lineHeight: 1.65, marginBottom: '3.5rem' }}
        >
          LexGuard is built for the 99% — not just those who can afford a lawyer. Speak it, read it, or hear it.
        </motion.p>

        <div className="lg-feature-grid">
          {FEATURES.map((f, i) => {
            const rgb = f.color === '#6366f1' ? '99,102,241'
              : f.color === '#22d3ee' ? '34,211,238'
              : f.color === '#10b981' ? '16,185,129'
              : f.color === '#f59e0b' ? '245,158,11'
              : f.color === '#f43f5e' ? '244,63,94'
              : '139,92,246';
            return (
              <motion.div
                key={i}
                className="lg-glass lg-feature-card"
                variants={fadeUp} custom={i + 3}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                style={{
                  background: `linear-gradient(135deg, rgba(${rgb},0.06) 0%, rgba(255,255,255,0.02) 60%)`,
                  borderColor: `rgba(${rgb},0.15)`,
                }}
              >
                <div className="lg-feature-icon"
                  style={{
                    background: `rgba(${rgb},0.12)`,
                    border: `1px solid rgba(${rgb},0.25)`,
                    color: f.color,
                    boxShadow: `0 0 25px rgba(${rgb},0.2)`,
                  }}
                >
                  {f.icon}
                </div>
                <div className="lg-feature-title">{f.title}</div>
                <div className="lg-feature-desc">{f.desc}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
