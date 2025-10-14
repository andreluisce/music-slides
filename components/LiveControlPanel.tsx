import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretLeft,
  CaretRight,
  Broom,
  ArrowsOut,
  Gear,
  Image as ImageIcon,
  TextT,
  Sliders,
  Clock,
  Circle,
} from '@phosphor-icons/react';
import { Button } from './ui/button';
import { useStageMode } from '../hooks/useStageMode';

interface LiveControlSlide {
  id: string;
  content: string;
  type?: 'verse' | 'chorus' | 'bridge';
}

export default function LiveControlPanel({ presentationId }: { presentationId: string }) {
  const { currentSong } = useStageMode();
  const [slides, setSlides] = useState<LiveControlSlide[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionDuration, setSessionDuration] = useState(0);

  // Load lyrics when song changes
  useEffect(() => {
    const loadLyrics = async () => {
      if (!currentSong) {
        setSlides([]);
        return;
      }

      setLoading(true);
      try {
        let lyricsText = '';
        if (currentSong.lyrics) {
          lyricsText = currentSong.lyrics;
        } else if (currentSong.filePath) {
          const result = await window.api?.readSong(currentSong.artist, currentSong.title);
          if (result?.success && result.lyrics) {
            lyricsText = result.lyrics;
          }
        }

        if (lyricsText) {
          // Parse lyrics line by line
          const lines = lyricsText
            .split('\n') // Split by line breaks
            .map(line => line.trim())
            .filter(line => line.length > 0);

          const parsedSlides: LiveControlSlide[] = lines.map((line, index) => ({
            id: `slide-${index}`,
            content: line,
            type: line.toLowerCase().includes('refrão') || line.toLowerCase().includes('chorus')
              ? 'chorus'
              : 'verse'
          }));

          setSlides(parsedSlides);
          setCurrentSlideIndex(0);
        }
      } catch (error) {
        console.error('Error loading lyrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLyrics();
  }, [currentSong]);

  // Clock and timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (isLive) {
        setSessionDuration((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Actions
  const showFeedback = (message: string) => {
    setActionFeedback(message);
    setTimeout(() => setActionFeedback(null), 2000);
  };

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
window.api.presentation.sendControl('slide', { index: newIndex });
      setCurrentSlideIndex(newIndex);
      showFeedback('✓ Próximo slide');
    }
  };

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      const newIndex = currentSlideIndex - 1;
      if (window.api) {
        window.api.presentation.sendControl('slide', { index: newIndex });
      }
      setCurrentSlideIndex(newIndex);
      showFeedback('✓ Slide anterior');
    }
  };

  const clearScreen = () => {
    if (window.api) {
      window.api.presentation.sendControl('clear');
      showFeedback('✓ Tela limpa');
    }
  };

  const toggleFullscreen = () => {
    if (window.api) {
      window.api.presentation.setFullscreen();
      showFeedback('⛶ Tela cheia alternada');
    }
  };

  const toggleLive = () => {
    setIsLive((prev) => !prev);
    showFeedback(isLive ? '⏸ Apresentação pausada' : '▶ Ao vivo!');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSlide = slides[currentSlideIndex];
  const nextSlide_preview = slides[currentSlideIndex + 1];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0E0D12] via-[#161622] to-[#0D0C11]">
      {/* Top Bar */}
      <div className="flex-shrink-0 h-16 border-b border-magenta/20 bg-black/40 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              🎵 {currentSong?.title || 'Nenhuma música selecionada'}
              {isLive && (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-magenta/20 text-magenta text-xs font-semibold"
                >
                  <Circle size={8} weight="fill" />
                  Ao Vivo
                </motion.span>
              )}
            </h1>
            <p className="text-xs text-slate-400">{currentSong?.artist || ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-purple-400" />
            <span className="text-white font-mono">{currentTime.toLocaleTimeString('pt-BR')}</span>
          </div>
          <div className="text-sm text-slate-400">
            Duração: <span className="text-white font-mono">{formatTime(sessionDuration)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 space-y-4">
          {/* Preview Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Current Slide */}
            <div className="relative">
              <h3 className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider">
                Slide Atual
              </h3>
              <div className="aspect-video rounded-lg bg-gradient-to-br from-magenta/20 to-purple-900/30 border-2 border-magenta shadow-lg shadow-magenta/20 backdrop-blur-sm flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-magenta/5 blur-2xl" />
                <p className="relative text-white text-center font-semibold text-lg leading-relaxed">
                  {currentSlide?.content || 'Nenhum slide'}
                </p>
              </div>
            </div>

            {/* Next Slide */}
            <div className="relative">
              <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Próximo
              </h3>
              <div className="aspect-video rounded-lg bg-gradient-to-br from-purple-900/20 to-black/40 border border-purple-500/30 backdrop-blur-sm flex items-center justify-center p-4">
                <p className="text-slate-300 text-center text-sm">
                  {nextSlide_preview?.content || 'Fim'}
                </p>
              </div>
            </div>

            {/* Background */}
            <div className="relative">
              <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Fundo
              </h3>
              <div className="aspect-video rounded-lg bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-cyan-500/30 backdrop-blur-sm flex items-center justify-center p-4">
                <ImageIcon size={32} className="text-cyan-400/50" />
              </div>
            </div>
          </div>

          {/* Slides Grid */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              Slides ({slides.length})
              <span className="text-xs text-slate-500">Use ← → para navegar</span>
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-magenta border-t-transparent mx-auto mb-4" />
                  <p className="text-sm text-slate-400">Carregando letra...</p>
                </div>
              </div>
            ) : slides.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-500">Nenhuma letra carregada</p>
                <p className="text-xs text-slate-600 mt-1">
                  Selecione uma música na biblioteca
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {slides.map((slide, index) => (
                  <motion.button
                    key={slide.id}
                    onClick={() => {
                      setCurrentSlideIndex(index);
                      if (window.api) {
                        window.api.presentation.sendControl('slide', { index });
                      }
                      showFeedback('✓ Slide selecionado');
                    }}
                    className={`relative p-4 rounded-lg border transition-all ${
                      index === currentSlideIndex
                        ? 'bg-gradient-to-br from-magenta/30 to-purple-600/30 border-magenta shadow-lg shadow-magenta/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Slide Number */}
                    <div
                      className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === currentSlideIndex
                          ? 'bg-magenta text-white shadow-lg shadow-magenta/50'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Slide Content */}
                    <p
                      className={`text-sm leading-relaxed whitespace-pre-line ${
                        index === currentSlideIndex ? 'text-white font-medium' : 'text-slate-400'
                      }`}
                    >
                      {slide.content}
                    </p>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex-shrink-0 h-20 border-t border-purple-500/20 bg-black/60 backdrop-blur-md">
        <div className="h-full flex items-center justify-center gap-3 px-6">
          {/* Navigation Controls */}
          <Button
            size="lg"
            onClick={previousSlide}
            disabled={currentSlideIndex === 0}
            className="bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 h-14 px-6"
          >
            <CaretLeft size={24} weight="bold" />
            <span className="ml-2 text-sm">Anterior</span>
          </Button>

          <Button
            size="lg"
            onClick={nextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className="bg-magenta hover:bg-magenta-600 text-white disabled:opacity-30 h-14 px-6 shadow-lg shadow-magenta/30"
          >
            <span className="mr-2 text-sm">Próximo</span>
            <CaretRight size={24} weight="bold" />
          </Button>

          <div className="w-px h-10 bg-purple-500/20 mx-2" />

          {/* Action Buttons */}
          <Button
            size="lg"
            onClick={clearScreen}
            variant="outline"
            className="bg-slate-800/50 border-slate-600 hover:bg-slate-700 text-white h-14 px-6"
          >
            <Broom size={20} />
            <span className="ml-2 text-sm">Limpar</span>
          </Button>

          <Button
            size="lg"
            onClick={async () => {
              if (window.api) {
                const result = await window.api.dialogs.openBackground();
                if (result) {
                  window.api.presentation.setCustomBackground(result);
                  showFeedback('✓ Fundo atualizado');
                }
              }
            }}
            variant="outline"
            className="bg-slate-800/50 border-slate-600 hover:bg-slate-700 text-white h-14 px-6"
          >
            <ImageIcon size={20} />
            <span className="ml-2 text-sm">Fundo</span>
          </Button>

          <Button
            size="lg"
            onClick={async () => {
              if (window.api) {
                const result = await window.api.dialogs.openTheme();
                if (result) {
                  window.api.presentation.sendThemeUpdate(result);
                  showFeedback('✓ Tema atualizado');
                }
              }
            }}
            variant="outline"
            className="bg-slate-800/50 border-slate-600 hover:bg-slate-700 text-white h-14 px-6"
          >
            <TextT size={20} />
            <span className="ml-2 text-sm">Tema</span>
          </Button>

          <Button
            size="lg"
            onClick={async () => {
              if (window.api) {
                const result = await window.api.dialogs.openTransition();
                if (result) {
                  window.api.presentation.sendAction('transition', result);
                  showFeedback('✓ Transição atualizada');
                }
              }
            }}
            variant="outline"
            className="bg-slate-800/50 border-slate-600 hover:bg-slate-700 text-white h-14 px-6"
          >
            <Sliders size={20} />
            <span className="ml-2 text-sm">Transição</span>
          </Button>

          <div className="w-px h-10 bg-purple-500/20 mx-2" />

          <Button
            size="lg"
            onClick={toggleFullscreen}
            variant="outline"
            className="bg-slate-800/50 border-slate-600 hover:bg-slate-700 text-white h-14 px-6"
          >
            <ArrowsOut size={20} />
          </Button>
        </div>
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-magenta text-white px-6 py-3 rounded-full shadow-2xl shadow-magenta/50 flex items-center gap-2 font-semibold">
              {actionFeedback}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}