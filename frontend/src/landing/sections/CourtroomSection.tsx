import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '../motion';
import { Scale, Shield, Users, Gavel } from 'lucide-react';

const AGENTS = [
  {
    id: 'defender',
    role: 'Corporate Defender',
    name: 'Agent LEXIS',
    icon: <Shield size={20} />,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.25)',
    argument: 'This indemnification clause is standard practice in enterprise SaaS. It protects both parties from third-party IP claims and limits consequential damages to 12 months of fees paid.',
  },
  {
    id: 'consumer',
    role: 'Consumer Protector',
    name: 'Agent ARIA',
    icon: <Users size={20} />,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
    argument: 'Clause §12.3 grants unlimited indemnification with zero cap. This exposes you to uncapped liability. Recommend capping at 2× annual contract value and excluding consequential damages.',
  },
  {
    id: 'judge',
    role: 'Neutral Judge',
    name: 'Agent NEXUS',
    icon: <Gavel size={20} />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    argument: 'Balanced verdict: Indemnification is necessary but must be mutual. Recommend mutual indemnification, cap at 12-month fees, and explicit IP ownership carve-out for pre-existing materials.',
  },
];

export default function CourtroomSection() {
  const [active, setActive] = useState(0);

  return (
    <section className="lg-section" id="courtroom">
      <div className="lg-orb lg-orb--cyan" style={{ top: '10%', left: '-100px', opacity: 0.3 }} />

      <motion.div
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.p className="lg-eyebrow" variants={fadeUp} custom={0} style={{ marginBottom: '1.5rem' }}>
          <Scale size={12} /> AI Courtroom
        </motion.p>
        <motion.h2 className="lg-display" variants={fadeUp} custom={1}
          style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', maxWidth: '22ch', marginBottom: '0.75rem' }}
        >
          Three AI agents argue your case simultaneously.
        </motion.h2>
        <motion.p variants={fadeUp} custom={2}
          style={{ color: 'var(--v-muted)', fontSize: '1.05rem', maxWidth: '44ch', lineHeight: 1.65, marginBottom: '3rem' }}
        >
          Our Multi-Agent Debate Engine deploys competing legal perspectives on every clause, then synthesizes a balanced verdict.
        </motion.p>

        {/* Agent cards */}
        <motion.div className="lg-courtroom" variants={fadeUp} custom={3}>
          {AGENTS.map((agent, i) => (
            <motion.div
              key={agent.id}
              className="lg-glass lg-agent-card"
              onClick={() => setActive(i)}
              style={{
                background: active === i ? agent.bg : 'rgba(255,255,255,0.03)',
                borderColor: active === i ? agent.border : 'rgba(255,255,255,0.07)',
                cursor: 'pointer',
                '--accent-color': agent.color,
              } as React.CSSProperties}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              animate={{ boxShadow: active === i ? `0 0 40px ${agent.color}25` : 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${agent.color}20`,
                  border: `1px solid ${agent.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: agent.color,
                }}>
                  {agent.icon}
                </div>
                <div>
                  <div className="lg-agent-role" style={{ color: agent.color }}>{agent.role}</div>
                  <div className="lg-agent-name">{agent.name}</div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {active === i && (
                  <motion.div
                    className="lg-debate-bubble"
                    key={agent.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35 }}
                    style={{ borderLeftColor: agent.color, marginTop: '0.5rem' }}
                  >
                    {agent.argument}
                  </motion.div>
                )}
              </AnimatePresence>

              {active !== i && (
                <div style={{ fontSize: '0.78rem', color: 'var(--v-dim)', marginTop: 'auto' }}>
                  Click to see argument →
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Verdict bar */}
        <motion.div
          className="lg-glass lg-verdict-bar"
          variants={fadeUp} custom={7}
          style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Gavel size={18} color="#f59e0b" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Final Verdict
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--v-muted)', maxWidth: '55ch', lineHeight: 1.55 }}>
            Clause flagged as <strong style={{ color: '#f43f5e' }}>HIGH RISK</strong>. Recommend renegotiating §12.3 with mutual
            indemnification cap before signing.
          </p>
          <div style={{
            padding: '0.5rem 1rem', borderRadius: 100,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
            fontSize: '0.78rem', fontWeight: 600, color: '#10b981',
          }}>
            Redline Suggested ✓
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
