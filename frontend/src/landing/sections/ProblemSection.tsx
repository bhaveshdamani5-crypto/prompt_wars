import { motion } from 'framer-motion';
import { fadeUp } from '../motion';
import { AlertTriangle, FileX, Clock, DollarSign } from 'lucide-react';

const PROBLEMS = [
  {
    icon: <AlertTriangle size={28} />,
    title: 'Hidden Liability Traps',
    desc: '73% of contracts contain clauses that silently transfer liability to you. Without a lawyer, you&apos;d never know.',
    color: '#f43f5e',
    num: '01',
  },
  {
    icon: <FileX size={28} />,
    title: 'Unfair Auto-Renewals',
    desc: 'Buried auto-renewal clauses lock millions into contracts they never intended to extend.',
    color: '#f59e0b',
    num: '02',
  },
  {
    icon: <Clock size={28} />,
    title: 'Non-Competes That Trap You',
    desc: 'Overly broad non-compete terms restrict your career for years — often without you realizing their scope.',
    color: '#6366f1',
    num: '03',
  },
  {
    icon: <DollarSign size={28} />,
    title: 'Legal Costs Are Prohibitive',
    desc: 'Hiring a contract attorney costs $350–$650/hr. Most people sign without any protection.',
    color: '#22d3ee',
    num: '04',
  },
];

export default function ProblemSection() {
  return (
    <section className="lg-section" id="problem">
      <div className="lg-orb lg-orb--violet" style={{ top: '20%', right: '-150px', opacity: 0.3 }} />

      <motion.div
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.p className="lg-eyebrow" variants={fadeUp} custom={0} style={{ marginBottom: '1.5rem' }}>
          The Problem
        </motion.p>
        <motion.h2 className="lg-display" variants={fadeUp} custom={1}
          style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', maxWidth: '20ch', marginBottom: '0.75rem' }}
        >
          The legal system wasn&apos;t built for you.
        </motion.h2>
        <motion.p variants={fadeUp} custom={2}
          style={{ color: 'var(--v-muted)', fontSize: '1.05rem', maxWidth: '40ch', lineHeight: 1.65, marginBottom: '3rem' }}
        >
          Every day, millions of people sign contracts they don&apos;t understand. LexGuard changes that.
        </motion.p>

        <div className="lg-problem-grid">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={i}
              className="lg-glass lg-problem-card"
              variants={fadeUp} custom={i + 3}
              whileHover={{ scale: 1.02, transition: { duration: 0.25 } }}
              style={{
                borderTop: `2px solid ${p.color}`,
                background: `linear-gradient(135deg, rgba(${p.color === '#f43f5e' ? '244,63,94' : p.color === '#f59e0b' ? '245,158,11' : p.color === '#6366f1' ? '99,102,241' : '34,211,238'},0.05) 0%, transparent 60%)`,
              }}
            >
              <div className="lg-problem-number">{p.num}</div>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: `rgba(${p.color === '#f43f5e' ? '244,63,94' : p.color === '#f59e0b' ? '245,158,11' : p.color === '#6366f1' ? '99,102,241' : '34,211,238'},0.12)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: p.color, marginBottom: '1rem',
                boxShadow: `0 0 20px ${p.color}30`,
              }}>
                {p.icon}
              </div>
              <h3 style={{ fontFamily: 'var(--v-font-display)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {p.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--v-muted)', lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: p.desc }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
