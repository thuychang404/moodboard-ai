import React from "react";
import { motion, Variants } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  animate = true,
}) => {
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }, // safer easing
    },
  };

  const Card = animate ? motion.div : "div";

  return (
    <Card
      className={`glassmorphism rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}
      {...(animate && {
        variants: cardVariants,
        initial: "hidden",
        animate: "visible",
        whileHover: { scale: 1.02 },
      })}
    >
      {children}
    </Card>
  );
};
