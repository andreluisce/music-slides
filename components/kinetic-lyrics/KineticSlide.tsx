'use client';
import React from 'react';
import AnimatedBackground from './AnimatedBackground';
import KineticText from './KineticText';
import { KineticStylePreset } from './kinetic-styles';

// This configuration would come from the slide or song settings
export interface KineticConfig {
  preset: KineticStylePreset;
  speed?: number;
  intensity?: number;
  blur?: number;
}

interface KineticSlideProps {
  text: string;
  config: KineticConfig;
}

const KineticSlide: React.FC<KineticSlideProps> = ({ text, config }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Layer 1: Animated Background */}
      <AnimatedBackground
        preset={config.preset}
        speed={config.speed}
        intensity={config.intensity}
        blur={config.blur}
      />

      {/* Layer 2: Kinetic Text */}
      <div className="relative z-10 w-full max-w-4xl p-8">
        <KineticText text={text} stylePreset={config.preset} />
      </div>
    </div>
  );
};

export default KineticSlide;
