import { motion } from 'framer-motion';
import { fadeUp } from '../motion';
import { Star, Shield, Lock, Award } from 'lucide-react';

const STATS = [
  { val: '50K+', label: 'Contracts analyzed' },
  { val: '94%', label: 'Risks caught' },
  { val: '3s', label: 'Average analysis time' },
  { val: '42', label: 'Languages supported' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Startup Founder',
    avatar: 'SC',
    text: 'LexGuard found a non-compete clause that would have barred me from my industry for 3 years. Saved my career.',
    stars: 5,
    color: '#6366f1',
  },
  {
    name: 'Marcus Williams',
    role: 'Freelance Developer',
    avatar: 'MW',
    text: 'The AI agents debate each clause like actual lawyers. The redline suggestions are spot-on. Worth every penny.',
    stars: 5,
    color: '#22d3ee',
  },
  {
    name: 'Priya Sharma',
    role: 'Operations Manager',
    avatar: 'PS',
    text: 'I uploaded a vendor contract and had a complete risk report in 4 seconds. Incredible. Our legal bills dropped 60%.',
    stars: 5,
    color: '#10b981',
  },
];

const TRUST_MARKS = [
  { icon: <Shield size={18} />, label: 'SOC 2 Type II', color: '#6366f1' },
  { icon: <Lock size={18} />, label: 'End-to-end encrypted', color: '#22d3ee' },
  { icon: <Award size={18} />, label: 'ABA Compliant', color: '#10b981' },
];

export default function TrustSection() {
  return (
    <section className="lg-section" id="trust">
      <div className="lg-orb lg-orb--cyan" style={{ top: '0', left: '20%', opacity: 0.2 }} />

      <motion.div
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {/* Stats row */}
        <motion.div
          className="lg-stat-row"
          variants={fadeUp} custom={0}
          style={{ marginBottom: '5rem' }}
        >
          {STATS.map((s, i) => (
            <motion.div key={i} className="lg-stat"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <div className="lg-stat-value">{s.val}</div>
              <div className="lg-stat-label">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.p className="lg-eyebrow" variants={fadeUp} custom={1} style={{ marginBottom: '1.5rem' }}>
          <Star size={12} /> Trusted by professionals worldwide
        </motion.p>
        <motion.h2 className="lg-display" variants={fadeUp} custom={2}
          style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', maxWidth: '22ch', marginBottom: '3rem' }}
        >
          Real people. Real protection.
        </motion.h2>

        {/* Testimonials */}
        <motion.div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem', marginBottom: '4rem' }}
          variants={fadeUp} custom={3}
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              className="lg-glass"
              style={{ padding: '1.75rem', borderRadius: 20, borderColor: `${t.color}20` }}
              whileHover={{ y: -8, boxShadow: `0 30px 60px -20px ${t.color}25` }}
              transition={{ duration: 0.35 }}
            >
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                {Array.from({ length: t.stars }).map((_, si) => (
                  <Star key={si} size={14} fill={t.color} color={t.color} />
                ))}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--v-muted)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${t.color}40, ${t.color}20)`,
                  border: `1px solid ${t.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: t.color,
                }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--v-dim)' }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust marks */}
        <motion.div
          variants={fadeUp} custom={7}
          style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          {TRUST_MARKS.map((tm, i) => (
            <div key={i} className="lg-glass"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.65rem 1.25rem', borderRadius: 100,
                borderColor: `${tm.color}25`, color: tm.color,
                fontSize: '0.82rem', fontWeight: 500,
              }}
            >
              {tm.icon} {tm.label}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
