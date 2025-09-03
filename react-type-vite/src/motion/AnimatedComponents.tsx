import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  fadeInUpVariant,
  fadeInLeftVariant,
  fadeInRightVariant,
  fadeInDownVariant,
  scaleInVariant,
  staggerContainerVariant,
} from "./variants";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

interface ViewportOptions {
  once?: boolean;
  amount?: number;
}

const defaultViewport: ViewportOptions = {
  once: true,
  amount: 0.3,
};

// Fade In Up Animation
export const FadeInUp = ({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
}: AnimatedSectionProps) => {
  const customVariant = {
    ...fadeInUpVariant,
    visible: {
      ...fadeInUpVariant.visible,
      transition: {
        duration,
        delay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={customVariant}
    >
      {children}
    </motion.div>
  );
};

// Fade In Down Animation
export const FadeInDown = ({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
}: AnimatedSectionProps) => {
  const customVariant = {
    ...fadeInDownVariant,
    visible: {
      ...fadeInDownVariant.visible,
      transition: {
        duration,
        delay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={customVariant}
    >
      {children}
    </motion.div>
  );
};

// Fade In Left Animation
export const FadeInLeft = ({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
}: AnimatedSectionProps) => {
  const customVariant = {
    ...fadeInLeftVariant,
    visible: {
      ...fadeInLeftVariant.visible,
      transition: {
        duration,
        delay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={customVariant}
    >
      {children}
    </motion.div>
  );
};

// Fade In Right Animation
export const FadeInRight = ({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
}: AnimatedSectionProps) => {
  const customVariant = {
    ...fadeInRightVariant,
    visible: {
      ...fadeInRightVariant.visible,
      transition: {
        duration,
        delay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={customVariant}
    >
      {children}
    </motion.div>
  );
};

// Scale In Animation
export const ScaleIn = ({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
}: AnimatedSectionProps) => {
  const customVariant = {
    ...scaleInVariant,
    visible: {
      ...scaleInVariant.visible,
      transition: {
        duration,
        delay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={customVariant}
    >
      {children}
    </motion.div>
  );
};

// Stagger Container
export const StaggerContainer = ({
  children,
  className = "",
  delay = 0.1,
}: AnimatedSectionProps) => {
  const customVariant = {
    ...staggerContainerVariant,
    visible: {
      ...staggerContainerVariant.visible,
      transition: {
        ...staggerContainerVariant.visible.transition,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={customVariant}
    >
      {children}
    </motion.div>
  );
};

// Animated Section - Generic wrapper
export const AnimatedSection = ({
  children,
  className = "",
  variant = "fadeInUp",
}: AnimatedSectionProps & { variant?: string }) => {
  const getVariant = () => {
    switch (variant) {
      case "fadeInLeft":
        return fadeInLeftVariant;
      case "fadeInRight":
        return fadeInRightVariant;
      case "fadeInDown":
        return fadeInDownVariant;
      case "scaleIn":
        return scaleInVariant;
      default:
        return fadeInUpVariant;
    }
  };

  return (
    <motion.section
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={getVariant()}
    >
      {children}
    </motion.section>
  );
};
