import { Variants } from 'framer-motion';

export type KineticStylePreset = 'vibrant-flow' | 'nebula-fade' | 'electric-blocks';

export interface KineticStyle {
  name: string;
  // Background properties
  background: {
    colors: string[];
    baseSpeed: number;
    baseIntensity: number;
  };
  // Text properties
  text: {
    animateBy: 'word' | 'line';
    className: string;
    wordClassName?: string;
    lineVariants: Variants;
    wordVariants: Variants;
  };
}

export const kineticStyles: Record<KineticStylePreset, KineticStyle> = {
  'nebula-fade': {
    name: 'Nebula Fade',
    background: {
      colors: ['#6a11cb', '#2575fc', '#1b2735'],
      baseSpeed: 0.4,
      baseIntensity: 0.5,
    },
    text: {
      animateBy: 'word',
      className: 'text-6xl font-bold text-blue-200 text-center drop-shadow-[0_0_10px_#00aaff55]',
      lineVariants: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.3 } },
      },
      wordVariants: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
      },
    },
  },
  'vibrant-flow': {
    name: 'Vibrant Flow',
    background: {
      colors: ['#ff00cc', '#3333ff', '#ff6600'],
      baseSpeed: 1.2,
      baseIntensity: 1.0,
    },
    text: {
      animateBy: 'word',
      className: 'text-7xl font-black uppercase text-pink-400 text-center drop-shadow-[0_0_12px_#ff00cc99]',
      lineVariants: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { staggerChildren: 0.05 } },
        exit: { opacity: 0, transition: { duration: 0.5 } },
      },
      wordVariants: {
        initial: { opacity: 0, scale: 0.5 },
        animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 12 } },
      },
    },
  },
  'electric-blocks': {
    name: 'Electric Blocks',
    background: {
      colors: ['#000000', '#1a1a1a', '#333333', '#1a1a1a'],
      baseSpeed: 1.0,
      baseIntensity: 0.2,
    },
    text: {
      animateBy: 'word',
      className: 'flex justify-center items-center flex-wrap gap-4',
      wordClassName: 'p-4 rounded-lg bg-black/50 text-5xl font-extrabold uppercase text-yellow-300 drop-shadow-[0_0_12px_#ffff0080]',
      lineVariants: {
        initial: {},
        animate: { transition: { staggerChildren: 0.1 } },
        exit: {},
      },
      wordVariants: {
        initial: { opacity: 0, y: 50, scale: 0.8 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 150, damping: 20 } },
      },
    },
  },
};
