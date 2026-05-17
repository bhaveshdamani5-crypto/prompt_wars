/** Shared Framer Motion variants — LexGuard landing */
import type { Variants, Transition } from 'framer-motion';

export const easeLuxury: Transition = {
  duration: 0.85,
  ease: [0.22, 1, 0.36, 1],
};

export const easeSoft: Transition = {
  duration: 0.55,
  ease: [0.25, 0.46, 0.45, 0.94],
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...easeLuxury, delay: i * 0.08 },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeLuxury },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: easeLuxury,
  },
};

export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: easeLuxury },
};

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: easeLuxury },
};

export const floatY = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const breathe = {
  animate: {
    scale: [1, 1.03, 1],
    opacity: [0.6, 0.85, 0.6],
    transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
  },
};
