import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '../motion';
import { FileText, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const CLAUSES = [
  {
    text: '§12.3 — Indemnification. The Customer shall indemnify, defend, and hold harmless the Company from any claims, damages, or losses arising out of Customer\'s use of the Service, without limitation.',
    risk: 'HIGH',
    label: 'Uncapped Indemnification',
    explanation: 'This exposes you to unlimited liability. Industry standard caps indemnification at 12 months of fees paid.',
    color: '#f43f5e',
  },
  {
    text: '§8.1 — Auto-Renewal. This Agreement shall automatically renew for successive 12-month periods unless either party provides 90 days written notice of non-renewal prior to the end of each term.',
    risk: 'MEDIUM',
    label: 'Auto-Renewal Risk',
    explanation: '90 days notice window is unusually long. Standard is 30 days. You may miss the window and be locked in.',
    color: '#f59e0b',
  },
  {
    text: '§5.2 — Confidentiality. Both parties agree to maintain the confidentiality of the other\'s proprietary information for a period of 3 years following termination.',
    risk: 'LOW',
    label: 'Standard Confidentiality',
    explanation: '3-year confidentiality is industry standard. This clause appears fair and balanced.',
    color: '#6366f1',
  },
  {
    text: '§2.1 — License Grant. Subject to the terms of this Agreement, Company grants Customer a limited, non-exclusive, non-transferable license to access and use the Service.',
    risk: 'INFO',
    label: 'Standard License',
    explanation: 'This is a standard SaaS license grant. No concerns identified.',
    color: '#10b981',
  },
];

const RISK_COLORS: Record<string, string> = {
  HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#6366f1', INFO: '#10b981',
};

export default function LiveDocSection() {
  const [selected, setSelected] = useState(0);

  return (
    <section className="lg-section" id="live-doc">
      <div className="lg-orb lg-orb--violet" style={{ top: '30%', right: '-50px', opacity: 0.2 }} />

      <motion.div
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.p className="lg-eyebrow" variants={fadeUp} custom={0} style={{ marginBottom: '1.5rem' }}>
          Live Document Analysis
        </motion.p>
        <motion.h2 className="lg-display" variants={fadeUp} custom={1}
          style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', maxWidth: '24ch', marginBottom: '0.75rem' }}
        >
          See every risk, highlighted in real time.
        </motion.h2>
        <motion.p variants={fadeUp} custom={2}
          style={{ color: 'var(--v-muted)', fontSize: '1.05rem', maxWidth: '44ch', lineHeight: 1.65, marginBottom: '3rem' }}
        >
          Click any clause to instantly see AI risk assessment, severity rating, and a plain-English explanation.
        </motion.p>

        <motion.div variants={fadeUp} custom={3}
          style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem' }}
        >
          {/* Document viewer */}
          <div className="lg-glass" style={{ borderRadius: 20, overflow: 'hidden' }}>
            {/* Header bar */}
            <div style={{
              padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <FileText size={15} color="#6366f1" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>contract_review.pdf</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                {['#f43f5e', '#f59e0b', '#6366f1', '#10b981'].map((c, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.7 }} />
                ))}
              </div>
            </div>

            {/* Clauses */}
            <div style={{ padding: '0.5rem' }}>
              {CLAUSES.map((clause, i) => (
                <motion.div
                  key={i}
                  className="lg-doc-line"
                  onClick={() => setSelected(i)}
                  style={{
                    borderLeftColor: RISK_COLORS[clause.risk],
                    background: selected === i
                      ? `${RISK_COLORS[clause.risk]}12`
                      : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                    borderRadius: 8, marginBottom: '0.25rem',
                    cursor: 'pointer',
                    boxShadow: selected === i ? `0 0 20px ${RISK_COLORS[clause.risk]}15` : 'none',
                  }}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{
                      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em',
                      color: RISK_COLORS[clause.risk],
                      background: `${RISK_COLORS[clause.risk]}15`,
                      padding: '2px 6px', borderRadius: 100, flexShrink: 0, marginTop: '2px',
                    }}>
                      {clause.risk}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(248,250,252,0.7)', lineHeight: 1.5 }}>
                      {clause.text}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Insight panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                className="lg-glass"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
                style={{
                  padding: '1.5rem', borderRadius: 20,
                  borderColor: `${CLAUSES[selected].color}30`,
                  background: `${CLAUSES[selected].color}08`,
                  boxShadow: `0 0 40px ${CLAUSES[selected].color}15`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <AlertTriangle size={16} color={CLAUSES[selected].color} />
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: CLAUSES[selected].color,
                  }}>
                    {CLAUSES[selected].risk} RISK
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--v-font-display)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  {CLAUSES[selected].label}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--v-muted)', lineHeight: 1.65 }}>
                  {CLAUSES[selected].explanation}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Quick actions */}
            {['Simplify Clause', 'Suggest Redline', 'Start Negotiation'].map((action, i) => (
              <motion.button
                key={i}
                className="lg-glass"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ x: 4, borderColor: 'rgba(99,102,241,0.4)' }}
                style={{
                  padding: '0.85rem 1.25rem', borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                  color: 'var(--v-white)', border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.03)', textAlign: 'left',
                  width: '100%',
                }}
              >
                {action}
                <CheckCircle size={15} color="#6366f1" />
              </motion.button>
            ))}

            <motion.div
              className="lg-glass"
              style={{ padding: '1rem', borderRadius: 14, display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Info size={15} color="#22d3ee" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--v-muted)', lineHeight: 1.5 }}>
                Click any highlighted clause in the document to instantly load its AI risk report.
              </span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
