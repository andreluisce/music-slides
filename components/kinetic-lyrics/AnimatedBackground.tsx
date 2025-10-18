'use client';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { kineticStyles, KineticStylePreset } from './kinetic-styles';

interface AnimatedBackgroundProps {
  preset?: KineticStylePreset;
  speed?: number;
  intensity?: number;
  hueShift?: boolean;
  blur?: number;
  className?: string;
}

export default function AnimatedBackground({
  preset = 'nebula-fade',
  speed = 1,
  intensity = 1,
  hueShift = false, // Defaulting to false for more control
  blur = 0,
  className = '',
}: AnimatedBackgroundProps) {
  const style = kineticStyles[preset].background;

  const gradient = useMemo(() => {
    const colorStops = style.colors
      .map((c, i) => `${c} ${(i / (style.colors.length - 1)) * 100}%`)
      .join(', ');
    return `linear-gradient(270deg, ${colorStops})`;
  }, [style.colors]);

  const duration = 20 / (style.baseSpeed * speed);
  const filterIntensity = intensity * style.baseIntensity;

  // Animate hue-rotate only if enabled
  const animateProps = {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    ...(hueShift && { filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'] }),
  };

  return (
    <motion.div
      initial={{ backgroundPosition: '0% 50%' }}
      animate={animateProps}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        background: gradient,
        backgroundSize: '400% 400%',
        filter: `
          saturate(${1 + filterIntensity})
          brightness(${0.9 + filterIntensity / 3})
          blur(${blur}px)
        `,
      }}
      className={`absolute inset-0 -z-10 ${className}`}>
      {/* Subtle overlay layer for depth */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: duration * 1.5, // Slightly different timing for variation
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05), transparent 50%)',
        }}
      />
    </motion.div>
  );
}
