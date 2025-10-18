import React from 'react';
import { motion, Variants } from 'framer-motion';
import KineticWord from './KineticWord';
import clsx from 'clsx';

interface KineticLineProps {
  text: string;
  lineVariants: Variants;
  wordVariants: Variants;
  className?: string;
  wordClassName?: string;
}

const KineticLine: React.FC<KineticLineProps> = ({ text, lineVariants, wordVariants, className, wordClassName }) => {
  const words = text.split(' ');

  return (
    <motion.div
      variants={lineVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={clsx('whitespace-pre-wrap', className)}
    >
      {words.map((word, index) => (
        <React.Fragment key={index}>
          <KineticWord variants={wordVariants} className={wordClassName}>
            {word}
          </KineticWord>
          {index < words.length - 1 && ' '}
        </React.Fragment>
      ))}
    </motion.div>
  );
};

export default KineticLine;
