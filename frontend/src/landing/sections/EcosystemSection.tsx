import { motion } from 'framer-motion';
import { fadeUp } from '../motion';
import { Cpu, FileSearch, Brain, Zap, Shield, Layers } from 'lucide-react';

const NODES = [
  { label: 'Upload Engine', icon: <FileSearch size={16} />, angle: 0, color: '#6366f1' },
  { label: 'OCR Parser', icon: <Layers size={16} />, angle: 60, color: '#22d3ee' },
  { label: 'Multi-Agent AI', icon: <Brain size={16} />, angle: 120, color: '#10b981' },
  { label: 'Risk Scorer', icon: <Zap size={16} />, angle: 180, color: '#f59e0b' },
  { label: 'Redline Engine', icon: <Shield size={16} />, angle: 240, color: '#f43f5e' },
  { label: 'Voice Output', icon: <Cpu size={16} />, angle: 300, color: '#8b5cf6' },
];

const PIPELINE = [
  { step: '01', label: 'Upload Contract', desc: 'PDF, DOCX, image or paste text', color: '#6366f1' },
  { step: '02', label: 'AI Extraction', desc: 'OCR + clause segmentation in 2s', color: '#22d3ee' },
  { step: '03', label: 'Agent Debate', desc: '12 specialist AI agents analyze clauses', color: '#10b981' },
  { step: '04', label: 'Risk Matrix', desc: 'Severity-ranked risk list generated', color: '#f59e0b' },
  { step: '05', label: 'Your Report', desc: 'Redlines, simplifications & negotiation', color: '#f43f5e' },
];

export default function EcosystemSection() {
  const orbitR = 190;

  return (
    <section className="lg-section lg-section--wide" id="ecosystem">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>

        {/* Left: Orbital diagram */}
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.p className="lg-eyebrow" variants={fadeUp} custom={0} style={{ marginBottom: '1.5rem' }}>
            The Ecosystem
          </motion.p>
          <motion.h2 className="lg-display" variants={fadeUp} custom={1}
            style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', maxWidth: '22ch', marginBottom: '0.75rem' }}
          >
            A full AI legal OS in one platform.
          </motion.h2>
          <motion.p variants={fadeUp} custom={2}
            style={{ color: 'var(--v-muted)', fontSize: '1rem', maxWidth: '38ch', lineHeight: 1.65 }}
          >
            Every component is purpose-built and interconnected — from document parsing to voice narration.
          </motion.p>

          {/* Orbit diagram */}
          <motion.div className="lg-eco-orbit" variants={fadeUp} custom={3}>
            {/* Center */}
            <div className="lg-glass lg-eco-center"
              style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.35)',
                boxShadow: '0 0 60px rgba(99,102,241,0.3)',
                flexDirection: 'column', gap: '0.25rem',
              }}
            >
              <Brain size={28} color="#818cf8" />
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#818cf8', textAlign: 'center' }}>
                LEXGUARD<br />CORE
              </div>
            </div>

            {/* Orbit rings */}
            {[orbitR, orbitR * 0.65].map((r, ri) => (
              <motion.div key={ri}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: r * 2, height: r * 2,
                  borderRadius: '50%',
                  border: `1px dashed rgba(99,102,241,${0.15 - ri * 0.05})`,
                  marginTop: -r, marginLeft: -r,
                }}
                animate={{ rotate: ri % 2 === 0 ? 360 : -360 }}
                transition={{ duration: 30 + ri * 10, repeat: Infinity, ease: 'linear' }}
              />
            ))}

            {/* Nodes */}
            {NODES.map((node, i) => {
              const rad = (node.angle * Math.PI) / 180;
              const x = Math.cos(rad) * orbitR;
              const y = Math.sin(rad) * orbitR;
              return (
                <motion.div
                  key={i}
                  className="lg-glass lg-eco-node"
                  style={{
                    top: `calc(50% + ${y}px)`,
                    left: `calc(50% + ${x}px)`,
                    transform: 'translate(-50%,-50%)',
                    borderColor: `${node.color}30`,
                    background: `rgba(${node.color === '#6366f1' ? '99,102,241' : node.color === '#22d3ee' ? '34,211,238' : node.color === '#10b981' ? '16,185,129' : node.color === '#f59e0b' ? '245,158,11' : node.color === '#f43f5e' ? '244,63,94' : '139,92,246'},0.1)`,
                    color: node.color,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5, type: 'spring' }}
                  whileHover={{ scale: 1.15 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                    {node.icon}
                    <span style={{ fontSize: '0.62rem', lineHeight: 1.3 }}>{node.label}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Right: Pipeline steps */}
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.p className="lg-eyebrow" variants={fadeUp} custom={0} style={{ marginBottom: '2rem' }}>
            How It Works
          </motion.p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: '19px', top: '28px',
              bottom: '28px', width: '2px',
              background: 'linear-gradient(to bottom, #6366f1, #22d3ee, #10b981, #f59e0b, #f43f5e)',
              opacity: 0.3,
            }} />

            {PIPELINE.map((item, i) => (
              <motion.div key={i} variants={fadeUp} custom={i + 1}
                style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', padding: '1.25rem 0' }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: `${item.color}15`, border: `2px solid ${item.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 800, color: item.color,
                  boxShadow: `0 0 20px ${item.color}25`,
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--v-font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--v-muted)' }}>{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
