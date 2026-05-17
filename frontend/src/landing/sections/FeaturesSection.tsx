import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Scan, AlertTriangle, Scale, Globe, Mic, Handshake, BookOpen,
  MapPin, FileSearch, Swords, Gavel, Sparkles, ArrowRight,
} from 'lucide-react';
import { fadeUp, staggerContainer } from '../motion';

const FEATURES = [
  { icon: Scan, title: 'Contract analysis', desc: 'Fast-scan: local clause map + single Gemini compliance pass.', tag: 'API /analyze' },
  { icon: AlertTriangle, title: 'Exploit detection', desc: 'HIGH/MEDIUM/LOW risks with exact clause quotes.', tag: 'Risk matrix' },
  { icon: Scale, title: 'Fairness scoring', desc: '0–100 score from multi-agent debate per clause.', tag: 'AI Court' },
  { icon: Globe, title: '7-language translate', desc: 'Legal-meaning preserved across Indian languages.', tag: '/simplify' },
  { icon: Mic, title: 'Voice assistant', desc: 'Pause-optimized TTS for illiterate & elderly users.', tag: '/voice-script' },
  { icon: Handshake, title: 'Negotiation AI', desc: 'Session memory for salary vs non-compete tradeoffs.', tag: '/negotiate' },
  { icon: BookOpen, title: 'Clause simplification', desc: 'Professional · Simple · Conversational tiers.', tag: 'Literacy' },
  { icon: MapPin, title: 'Real-world mapping', desc: 'Concrete harm scenarios—not legal jargon alone.', tag: 'Impact' },
  { icon: FileSearch, title: 'OCR & vision', desc: 'PDF, DOCX, TXT, scanned images via Gemini Vision.', tag: 'Ingest' },
  { icon: Swords, title: 'AI debate engine', desc: 'Alpha ∥ Beta → Gamma verdict + revised clause.', tag: '/analyze/clause' },
  { icon: Gavel, title: 'Final verdict', desc: 'Compliance score, executive summary, policy fit.', tag: 'Verdict' },
  { icon: Sparkles, title: 'Trust & confidence', desc: 'Escalation when fairness extreme or confidence low.', tag: 'Trust' },
];

export default function FeaturesSection() {
  return (
    <section className="lg-section lg-section--wide" id="ecosystem">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}>
        <motion.p className="lg-eyebrow" variants={fadeUp}>SaaS product surface</motion.p>
        <motion.h2 className="lg-display lg-section-title" variants={fadeUp} custom={1}>
          Every capability is a live API—not a mockup label.
        </motion.h2>
        <motion.p className="lg-section-lead" variants={fadeUp} custom={2}>
          Upload → scan → debate → simplify → voice → negotiate. One workspace, production endpoints.
        </motion.p>
      </motion.div>

      <motion.div
        className="lg-feature-grid lg-bento-grid"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        {FEATURES.map((f, i) => (
          <motion.article
            key={f.title}
            className={`lg-glass lg-feature-card ${i % 5 === 0 ? 'lg-bento-wide' : ''}`}
            variants={fadeUp}
            custom={i % 4}
            whileHover={{ y: -8, scale: 1.01 }}
          >
            <span className="lg-feature-tag">{f.tag}</span>
            <div className="lg-feature-icon"><f.icon size={22} strokeWidth={1.5} /></div>
            <h3 className="lg-feature-title">{f.title}</h3>
            <p className="lg-feature-desc">{f.desc}</p>
          </motion.article>
        ))}
      </motion.div>

      <motion.div className="lg-features-cta" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <Link to="/app" className="lg-btn-primary">
          Open full workspace <ArrowRight size={18} />
        </Link>
      </motion.div>
    </section>
  );
}
