// Create: frontend/src/components/AnimatedBackground.tsx

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const AnimatedBackground: React.FC = () => {
  // Generate random circle properties only once
  const circles = useMemo(
    () =>
      Array.from({ length: 6 }).map(() => ({
        width: Math.random() * 300 + 100,
        height: Math.random() * 300 + 100,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: Math.random() * 20 + 10,
      })),
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 opacity-80" />
      {circles.map((circle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/10 backdrop-blur-sm"
          style={{
            width: circle.width,
            height: circle.height,
            left: circle.left,
            top: circle.top,
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: circle.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};