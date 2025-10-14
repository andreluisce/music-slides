import React from 'react';
import { motion } from 'framer-motion';

interface SongGridPreviewProps {
  lyrics: string[];
  gridSize?: 'small' | 'large';
  maxSlides?: number;
  onSlideClick?: (index: number) => void;
}

export default function SongGridPreview({
  lyrics,
  gridSize = 'small',
  maxSlides = 12,
  onSlideClick
}: SongGridPreviewProps) {
  // Filter out empty lines and limit to maxSlides
  const slides = lyrics
    .filter(line => line.trim())
    .slice(0, maxSlides);

  const gridClass = gridSize === 'small'
    ? 'grid-cols-4'
    : 'grid-cols-3';

  const slideClass = gridSize === 'small'
    ? 'h-20'
    : 'h-32';

  return (
    <div
      className={`
        grid ${gridClass} gap-2 rounded-xl border border-white/10
        bg-gradient-to-br from-slate-900 to-purple-900/50 p-4
      `}
    >
      {slides.map((slide, index) => (
        <motion.button
          key={index}
          onClick={() => onSlideClick?.(index)}
          className={`
            ${slideClass} w-full overflow-hidden rounded-lg border border-white/10
            bg-black/20 p-3 transition-all hover:border-purple-500/50
            hover:bg-white/5 backdrop-blur-sm
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex h-full flex-col">
            {/* Slide number */}
            <div className="mb-1 text-xs font-medium text-slate-500">
              #{index + 1}
            </div>

            {/* Slide content */}
            <p className="flex-1 text-sm text-slate-300 line-clamp-3">
              {slide}
            </p>
          </div>
        </motion.button>
      ))}

      {/* Show remaining count if there are more slides */}
      {lyrics.length > maxSlides && (
        <div
          className={`
            ${slideClass} flex w-full items-center justify-center
            rounded-lg border border-dashed border-white/10
            bg-white/5 p-3 text-sm text-slate-400
          `}
        >
          +{lyrics.length - maxSlides} slides
        </div>
      )}
    </div>
  );
}