import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface InteractiveProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

// Hover Scale Effect
export const HoverScale = ({
  children,
  className = "",
  disabled = false,
}: InteractiveProps) => {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

// Button with Click Animation
export const AnimatedButton = ({
  children,
  className = "",
  disabled = false,
}: InteractiveProps) => {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

// Card Hover Effect
export const HoverCard = ({
  children,
  className = "",
  disabled = false,
}: InteractiveProps) => {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{
        scale: 1.02,
        y: -5,
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// Floating Animation
export const FloatingElement = ({
  children,
  className = "",
  disabled = false,
}: InteractiveProps) => {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        y: [-5, 5, -5],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
};

// Rotating Element
export const RotatingElement = ({
  children,
  className = "",
  disabled = false,
}: InteractiveProps) => {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {children}
    </motion.div>
  );
};

// Pulse Animation
export const PulseElement = ({
  children,
  className = "",
  disabled = false,
}: InteractiveProps) => {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
};
