import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CaretLeft, CaretRight, PlayCircle, PauseCircle } from '@phosphor-icons/react';

interface LyricsPresenterProps {
  isOpen: boolean;
  onClose: () => void;
  song: {
    title: string;
    artist: string;
    lyrics?: string;
    filePath?: string;
    url?: string;
  } | null;
}

export default function LyricsPresenter({ isOpen, onClose, song }: LyricsPresenterProps) {
  const [lyrics, setLyrics] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load lyrics when song changes
  useEffect(() => {
    if (!song || !isOpen) return;

      const loadLyrics = async () => {
      setLoading(true);
      try {
        let lyricsText = '';

        if (song.lyrics) {
          // Use lyrics directly if available
          lyricsText = song.lyrics;
          console.log('DEBUG: Using lyrics directly from song object');
        } else if (song.filePath) {
          // Load from file path
          console.log('DEBUG: Loading lyrics from file path:', song.filePath);
          const result = await window.api?.readSong(song.artist, song.title);
          if (result?.success && result.lyrics) {
            lyricsText = result.lyrics;
            console.log('DEBUG: Successfully loaded lyrics from file');
          } else {
            console.log('DEBUG: Failed to load lyrics from file, result:', result);
          }
        } else if (song.url) {
          // Fetch from URL (if needed)
          console.log('Fetching lyrics from URL not yet implemented');
        }

        if (lyricsText) {
          console.log('DEBUG: Original lyrics text:', lyricsText);
          // Split lyrics into slides (by double line breaks or verse markers)
          const slides = lyricsText
            .split(/\n\n+/)
            .map(slide => slide.trim())
            .filter(slide => slide.length > 0);

          console.log('DEBUG: Parsed slides:', slides);
          setLyrics(slides);
          setCurrentSlide(0);
          
          // Send initial slide to presentation window
          window.api?.sendPresentationSlideChange(0);
        } else {
          console.log('DEBUG: No lyrics text available to process');
        }
      } catch (error) {
        console.error('Error loading lyrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLyrics();
  }, [song, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousSlide();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Home':
          e.preventDefault();
          setCurrentSlide(0);
          break;
        case 'End':
          e.preventDefault();
          setCurrentSlide(lyrics.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, lyrics.length, onClose]);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => {
      const newIndex = Math.min(prev + 1, lyrics.length - 1);
      // Send to presentation window
      window.api?.sendPresentationSlideChange(newIndex);
      return newIndex;
    });
  }, [lyrics.length]);

  const previousSlide = useCallback(() => {
    setCurrentSlide(prev => {
      const newIndex = Math.max(prev - 1, 0);
      // Send to presentation window
      window.api?.sendPresentationSlideChange(newIndex);
      return newIndex;
    });
  }, []);

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    // Send to presentation window
    window.api?.sendPresentationSlideChange(index);
  };

  if (!isOpen || !song) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center'
        onClick={onClose}
      >
        {/* Control Panel */}
        <div
          className='relative w-full max-w-6xl h-[90vh] flex flex-col bg-slate-900 rounded-xl shadow-2xl border border-slate-700'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar - Controls */}
          <div className='flex-shrink-0 p-6 border-b border-slate-700'>
            <div className='flex items-center justify-between'>
              {/* Song Info */}
              <div className='flex-1'>
                <h1 className='text-2xl font-bold text-white'>{song.title}</h1>
                <p className='text-lg text-slate-400'>{song.artist}</p>
              </div>

              {/* Controls */}
              <div className='flex items-center gap-4'>
                <button
                  onClick={togglePlayPause}
                  className='p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors'
                  title={isPlaying ? 'Pausar' : 'Reproduzir'}
                >
                  {isPlaying ? (
                    <PauseCircle size={32} weight='fill' className='text-white' />
                  ) : (
                    <PlayCircle size={32} weight='fill' className='text-white' />
                  )}
                </button>

                <button
                  onClick={onClose}
                  className='p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors'
                  title='Fechar (Esc)'
                >
                  <X size={32} weight='bold' className='text-white' />
                </button>
              </div>
            </div>
          </div>

          {/* Center - Lyrics Display (Preview) */}
          <div className='flex-1 flex items-center justify-center p-8 bg-slate-800/50'>
            {loading ? (
              <div className='text-center'>
                <div className='animate-spin h-12 w-12 border-4 border-magenta border-t-transparent rounded-full mx-auto mb-4' />
                <p className='text-white text-xl'>Carregando letra...</p>
              </div>
            ) : lyrics.length > 0 ? (
              <div className='w-full max-w-3xl space-y-4'>
                <div className='text-center mb-6'>
                  <p className='text-slate-400 text-sm'>
                    Prévia do slide atual • Apresentação está em tela cheia no monitor secundário
                  </p>
                </div>
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className='text-center p-8 bg-black/50 rounded-lg border-2 border-magenta/50'
                  >
                    <p className='text-white text-2xl md:text-3xl font-bold leading-relaxed whitespace-pre-wrap'>
                      {lyrics[currentSlide]}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <div className='text-center text-white text-xl'>
                <p>Nenhuma letra disponível</p>
              </div>
            )}
          </div>

          {/* Bottom Bar - Navigation */}
          <div className='flex-shrink-0 p-6 border-t border-slate-700'>
            <div className='flex items-center justify-between mb-4'>
              {/* Previous Button */}
              <button
                onClick={previousSlide}
                disabled={currentSlide === 0}
                className='p-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
                title='Anterior (←)'
              >
                <CaretLeft size={32} weight='bold' className='text-white' />
              </button>

              {/* Slide Indicator */}
              <div className='flex flex-col items-center gap-3'>
                <div className='flex gap-2 max-w-2xl overflow-x-auto px-4'>
                  {lyrics.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`flex-shrink-0 h-3 rounded-full transition-all ${
                        index === currentSlide
                          ? 'w-12 bg-magenta'
                          : 'w-3 bg-slate-600 hover:bg-slate-500'
                      }`}
                      title={`Slide ${index + 1}`}
                    />
                  ))}
                </div>
                <p className='text-slate-400 text-sm font-medium'>
                  Slide {currentSlide + 1} de {lyrics.length}
                </p>
              </div>

              {/* Next Button */}
              <button
                onClick={nextSlide}
                disabled={currentSlide === lyrics.length - 1}
                className='p-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
                title='Próximo (→ ou Espaço)'
              >
                <CaretRight size={32} weight='bold' className='text-white' />
              </button>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className='text-center text-slate-500 text-xs'>
              <p>
                ← Anterior | → Próximo | Espaço: Próximo | Esc: Fechar | Home: Início | End: Fim
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
