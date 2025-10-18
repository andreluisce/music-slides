'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { kineticStyles, KineticStylePreset } from './kinetic-styles';
import clsx from 'clsx';

interface KineticTextProps {
  text: string;
  stylePreset: KineticStylePreset;
}

export default function KineticText({ text, stylePreset }: KineticTextProps) {
  const style = kineticStyles[stylePreset].text;
  const words = text.split(' ');

  return (
    <motion.div
      key={text} // Change key to re-trigger animation when text changes
      className={clsx('w-full', style.className)}
      variants={style.lineVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          className={clsx('inline-block', style.wordClassName)}
          variants={style.wordVariants}
        >
          {word}{' '}
        </motion.span>
      ))}
    </motion.div>
  );
}
