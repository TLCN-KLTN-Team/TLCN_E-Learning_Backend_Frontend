/**
 * Utility functions for Framer Motion
 */

// Generate stagger delay for items
export const generateStaggerDelay = (
  index: number,
  baseDelay = 0.1
): number => {
  return baseDelay * index;
};

// Common viewport configuration
export const defaultViewport = {
  once: true,
  amount: 0.3,
};

// Custom transition presets
export const transitions = {
  smooth: { duration: 0.6, ease: "easeOut" },
  bouncy: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] },
  quick: { duration: 0.3, ease: "easeInOut" },
  slow: { duration: 1.2, ease: "easeOut" },
};

// Common animation presets
export const presets = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  },
  slideDown: {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  rotate: {
    hidden: { opacity: 0, rotate: -180 },
    visible: { opacity: 1, rotate: 0 },
  },
};

// Create custom variant with transition
export const createVariant = (
  preset: keyof typeof presets,
  customTransition?: object
) => {
  const selectedPreset = presets[preset];
  return {
    ...selectedPreset,
    visible: {
      ...selectedPreset.visible,
      transition: customTransition || transitions.smooth,
    },
  };
};

// Stagger container generator
export const createStaggerContainer = (
  staggerChildren = 0.1,
  delayChildren = 0
) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

// Generate item variant for stagger animation
export const createStaggerItem = (customTransition?: object) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: customTransition || transitions.smooth,
  },
});
