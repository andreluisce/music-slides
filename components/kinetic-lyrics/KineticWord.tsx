import React from 'react';
import { motion, Variants } from 'framer-motion';
import clsx from 'clsx';

interface KineticWordProps {
  children: React.ReactNode;
  variants: Variants;
  className?: string;
}

const KineticWord: React.FC<KineticWordProps> = ({ children, variants, className }) => {
  return (
    <motion.span
      variants={variants}
      className={clsx('inline-block', className)}
    >
      {children}
    </motion.span>
  );
};

export default KineticWord;
