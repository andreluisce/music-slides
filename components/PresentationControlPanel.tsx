import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CaretLeft,
  CaretRight,
  PlayCircle,
  PauseCircle,
  TextT,
  Palette,
  Image as ImageIcon,
  VideoCamera,
  MagnifyingGlass,
  Gear,
} from '@phosphor-icons/react';
import { Button } from './ui/button';
import { FONTS } from '../lib/fonts-service';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { useSettings } from '../contexts/SettingsContext';

interface Slide {
  id: string;
  content: string;
  type?: 'verse' | 'chorus' | 'bridge' | 'title';
}

interface Theme {
  fontSize: number;
  fontFamily: string;
  textColor: string;
  textShadow: string;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: number;
}

interface PresentationControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  song: {
    title: string;
    artist: string;
    lyrics?: string;
    filePath?: string;
  } | null;
  presentationId: string; // Add presentationId prop
}

export default function PresentationControlPanel({
  isOpen,
  onClose,
  song,
  presentationId,
}: PresentationControlPanelProps) {
  const { settings } = useSettings();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'slides' | 'theme' | 'background'>('slides');
  const [showPagination, setShowPagination] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  const [theme, setTheme] = useState<Theme>({
    fontSize: 80,
    fontFamily: 'Arial, sans-serif',
    textColor: '#ffffff',
    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
    backgroundColor: '#000000',
    textAlign: 'center',
    fontWeight: 700,
  });

  // Load settings on mount
  useEffect(() => {
    if (settings) {
      setShowPagination(settings.showPagination);
      setShowLogo(settings.showLogo);
    }
  }, [settings]);

  // Parse lyrics into slides (one line = one slide)
  useEffect(() => {
    if (!song || !isOpen) return;

    const loadLyrics = async () => {
      setLoading(true);
      try {
        let lyricsText = '';

        if (song.lyrics) {
          lyricsText = song.lyrics;
        } else if (song.filePath) {
          const result = await window.api?.readSong(song.artist, song.title);
          if (result?.success && result.lyrics) {
            lyricsText = result.lyrics;
          }
        }

        if (lyricsText) {
          // Split by lines - each line is a slide
          const lines = lyricsText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

          const parsedSlides: Slide[] = lines.map((line, index) => ({
            id: `slide-${index}`,
            content: line,
            type: 'verse',
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
  }, [song, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // Don't interfere with input fields

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, slides.length]);

  const goToSlide = useCallback(async (index: number) => {
    setCurrentSlideIndex(index);
    const slideId = slides[index]?.id; // Get the ID of the slide
    if (presentationId && slideId) {
      await window.electron.updatePresentationCurrentSlide(presentationId, slideId);
    }
    window.api?.sendPresentationSlideChange(index);
  }, [presentationId, slides]);

  const nextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      goToSlide(currentSlideIndex + 1);
    }
  }, [currentSlideIndex, slides.length, goToSlide]);

  const previousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      goToSlide(currentSlideIndex - 1);
    }
  }, [currentSlideIndex, goToSlide]);

  const updateTheme = (updates: Partial<Theme>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    console.log('Sending theme update:', newTheme);
    window.api?.sendPresentationThemeUpdate(newTheme);
  };

  const currentSlide = slides[currentSlideIndex];

  // Log para debug
  console.log('PresentationControlPanel:', { isOpen, song, slides });

  if (!isOpen) return null;
  
  // Mesmo sem música selecionada, mostramos o painel
  if (!song) {
    return (
      <div className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm'>
        <div className='h-full w-full flex items-center justify-center'>
          <div className='text-center text-slate-400'>
            <p className='text-xl'>Nenhuma música selecionada</p>
            <p className='mt-2'>Selecione uma música na biblioteca para começar</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm'>
      <div className='h-full w-full flex'>
        {/* Main Control Panel */}
        <div className='flex-1 flex flex-col bg-slate-900'>
          {/* Top Bar */}
          <div className='flex-shrink-0 border-b border-slate-700 bg-slate-800'>
            <div className='flex items-center justify-between p-4'>
              <div>
                <h1 className='text-xl font-bold text-white'>{song.title}</h1>
                <p className='text-sm text-slate-400'>{song.artist}</p>
              </div>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className='p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors'
                >
                  {isPlaying ? (
                    <PauseCircle size={24} weight='fill' className='text-white' />
                  ) : (
                    <PlayCircle size={24} weight='fill' className='text-white' />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className='p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors'
                >
                  <X size={24} weight='bold' className='text-white' />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className='flex border-t border-slate-700'>
              <button
                onClick={() => setActiveTab('slides')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'slides'
                    ? 'bg-slate-900 text-white border-b-2 border-magenta'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Slides ({slides.length})
              </button>
              <button
                onClick={() => setActiveTab('theme')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'theme'
                    ? 'bg-slate-900 text-white border-b-2 border-magenta'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette size={16} className='inline mr-2' />
                Tema
              </button>
              <button
                onClick={() => setActiveTab('background')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'background'
                    ? 'bg-slate-900 text-white border-b-2 border-magenta'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon size={16} className='inline mr-2' />
                Background
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className='flex-1 overflow-auto p-4'>
            {loading ? (
              <div className='flex items-center justify-center h-full'>
                <div className='animate-spin h-12 w-12 border-4 border-magenta border-t-transparent rounded-full' />
              </div>
            ) : (
              <>
                {/* Slides Tab */}
                {activeTab === 'slides' && (
                  <div className='space-y-2'>
                    {slides.map((slide, index) => (
                      <motion.button
                        key={slide.id}
                        onClick={() => goToSlide(index)}
                        className={`w-full text-left p-4 rounded-lg transition-all ${
                          index === currentSlideIndex
                            ? 'bg-magenta text-white shadow-lg'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className='flex items-start gap-3'>
                          <span className='flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold'>
                            {index + 1}
                          </span>
                          <p className='flex-1 text-sm font-medium line-clamp-2'>
                            {slide.content}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Theme Tab */}
                {activeTab === 'theme' && (
                  <div className='space-y-6'>
                    {/* Font Size */}
                    <div>
                      <label className='text-sm font-medium text-white mb-2 block'>
                        Tamanho da Fonte: {theme.fontSize}px
                      </label>
                      <Slider
                        value={[theme.fontSize]}
                        onValueChange={([value]) => updateTheme({ fontSize: value })}
                        min={40}
                        max={200}
                        step={5}
                        className='w-full'
                      />
                    </div>

                    {/* Font Family */}
                    <div>
                      <label className='text-sm font-medium text-white mb-2 block'>
                        Fonte
                      </label>
                      <div className='space-y-2'>
                        {FONTS.map((font) => (
                          <button
                            key={font.name}
                            onClick={() => updateTheme({ 
                              fontFamily: font.family,
                              titleFont: font.family,
                              bodyFont: font.family
                            })}
                            className={`w-full p-3 rounded-lg transition-all flex items-center justify-between ${theme.fontFamily === font.family ? 'bg-magenta/20 border-magenta' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'} border`}
                          >
                            <div className='flex items-center gap-3'>
                              <span 
                                className='text-lg text-white'
                                style={{ fontFamily: font.family }}
                              >
                                Aa
                              </span>
                              <div className='text-left'>
                                <span className='block text-sm text-white'>{font.name}</span>
                                <span className='text-xs text-slate-400 capitalize'>{font.category}</span>
                              </div>
                            </div>
                            {font.variants.length > 0 && (
                              <div className='flex gap-1'>
                                {font.variants.map((weight) => (
                                  <button
                                    key={weight}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateTheme({ fontWeight: parseInt(weight) });
                                    }}
                                    className={`w-6 h-6 rounded ${theme.fontWeight === parseInt(weight) ? 'bg-magenta text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'} text-xs flex items-center justify-center`}
                                  >
                                    {weight}
                                  </button>
                                ))}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Weight */}
                    <div>
                      <label className='text-sm font-medium text-white mb-2 block'>
                        Peso da Fonte: {theme.fontWeight}
                      </label>
                      <Slider
                        value={[theme.fontWeight]}
                        onValueChange={([value]) => updateTheme({ fontWeight: value })}
                        min={400}
                        max={900}
                        step={100}
                        className='w-full'
                      />
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className='text-sm font-medium text-white mb-2 block'>
                        Cor do Texto
                      </label>
                      <input
                        type='color'
                        value={theme.textColor}
                        onChange={(e) => updateTheme({ textColor: e.target.value })}
                        className='w-full h-12 rounded-lg cursor-pointer'
                      />
                    </div>

                    {/* Text Align */}
                    <div>
                      <label className='text-sm font-medium text-white mb-2 block'>
                        Alinhamento
                      </label>
                      <div className='flex gap-2'>
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            onClick={() => updateTheme({ textAlign: align })}
                            className={`flex-1 p-2 rounded-lg transition-colors ${
                              theme.textAlign === align
                                ? 'bg-magenta text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {align === 'left' && '← Esquerda'}
                            {align === 'center' && '↔ Centro'}
                            {align === 'right' && 'Direita →'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Background Tab */}
                {activeTab === 'background' && (
                  <div className='space-y-6'>
                    {/* Background Color */}
                    <div>
                      <label className='text-sm font-medium text-white mb-2 block'>
                        Cor de Fundo
                      </label>
                      <input
                        type='color'
                        value={theme.backgroundColor}
                        onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                        className='w-full h-12 rounded-lg cursor-pointer'
                      />
                    </div>

                    {/* Background Image */}
                    <div>
                      <label className='text-sm font-medium text-white mb-2 block'>
                        Imagem de Fundo
                      </label>
                      <Button
                        variant='outline'
                        className='w-full'
                        onClick={async () => {
                          const result = await window.api?.getBackgroundImages();
                          if (result && result.length > 0) {
                            window.api?.setCustomBackground({
                              type: 'image',
                              path: result[0]
                            });
                          }
                        }}
                      >
                        <ImageIcon size={20} className='mr-2' />
                        Selecionar Imagem
                      </Button>
                    </div>

                    {/* Background Video */}
                    <div>
                      <label className='text-sm font-medium text-white mb-2 block'>
                        Vídeo de Fundo
                      </label>
                      <Button
                        variant='outline'
                        className='w-full'
                        onClick={async () => {
                          const result = await window.api?.getBackgroundVideos();
                          if (result && result.length > 0) {
                            window.api?.setCustomBackground({
                              type: 'video',
                              path: result[0]
                            });
                          }
                        }}
                      >
                        <VideoCamera size={20} className='mr-2' />
                        Selecionar Vídeo
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className='flex-shrink-0 border-t border-slate-700 p-4 bg-slate-800'>
            <div className='flex items-center justify-between'>
              <button
                onClick={previousSlide}
                disabled={currentSlideIndex === 0}
                className='p-3 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
              >
                <CaretLeft size={24} weight='bold' className='text-white' />
              </button>

              <div className='text-center'>
                <p className='text-sm font-medium text-white'>
                  Slide {currentSlideIndex + 1} de {slides.length}
                </p>
              </div>

              <button
                onClick={nextSlide}
                disabled={currentSlideIndex === slides.length - 1}
                className='p-3 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
              >
                <CaretRight size={24} weight='bold' className='text-white' />
              </button>
            </div>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className='w-96 bg-slate-950 border-l border-slate-700 p-4'>
          <h3 className='text-sm font-medium text-slate-400 mb-3'>Preview</h3>
          {currentSlide && (
            <div
              className='aspect-video rounded-lg flex items-center justify-center p-6'
              style={{
                backgroundColor: theme.backgroundColor,
                backgroundImage: theme.backgroundImage
                  ? `url(${theme.backgroundImage})`
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <p
                style={{
                  fontSize: `${theme.fontSize / 6}px`,
                  fontFamily: theme.fontFamily,
                  color: theme.textColor,
                  textShadow: theme.textShadow,
                  textAlign: theme.textAlign,
                  fontWeight: theme.fontWeight,
                  lineHeight: '1.5',
                }}
                className='max-w-full break-words'
              >
                {currentSlide.content}
              </p>
                  </div>
                )}

                {/* Theme Presets */}
                <div className='mt-4 space-y-2'>
                  <h4 className='text-xs font-medium text-slate-500 uppercase'>Temas</h4>
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => updateTheme(preset)}
                      className='w-full p-4 rounded bg-slate-800 hover:bg-slate-700 text-left'
                    >
                      <div className='flex flex-col gap-1'>
                        <span className='text-sm font-medium text-white'>{preset.name}</span>
                        <div className='flex items-center gap-2 text-xs text-slate-400'>
                          <span style={{ fontFamily: preset.titleFont }}>{preset.titleFont}</span>
                          <span>•</span>
                          <span>{preset.fontSize}px</span>
                          <span>•</span>
                          <span className='capitalize'>{preset.animation}</span>
                        </div>
                        <div 
                          className='mt-2 aspect-video rounded-lg p-4 flex items-center justify-center'
                          style={{
                            backgroundColor: preset.backgroundColor,
                            color: preset.textColor,
                            textShadow: preset.textShadow,
                            fontFamily: preset.titleFont,
                            fontSize: `${preset.fontSize / 3}px`,
                            fontWeight: preset.fontWeight,
                          }}
                        >
                          Exemplo
                        </div>
                      </div>
                    </button>
                  ))}
          </div>
        </div>
      </div>
    </div>
  );
}
