import React, { Fragment, useEffect, useState } from 'react';
import Head from 'next/head';
import queryString from 'query-string';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Palette, Type, Video, Play, Image as ImageIcon, Droplet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';
import { Label } from 'components/ui/label';
import { Input } from 'components/ui/input';
import { getAllThemes } from '../lib/supabase-service';
import type { Theme } from '../lib/supabase';

const api = typeof window !== 'undefined' ? window.api : undefined;

type BackgroundType = 'none' | 'video' | 'color' | 'gradient' | 'image';

const GRADIENT_PRESETS = [
  { name: 'Roxo Escuro', start: '#667eea', end: '#764ba2' },
  { name: 'Azul Oceano', start: '#2E3192', end: '#1BFFFF' },
  { name: 'Pôr do Sol', start: '#FF512F', end: '#F09819' },
  { name: 'Floresta', start: '#134E5E', end: '#71B280' },
  { name: 'Rosa Suave', start: '#ee9ca7', end: '#ffdde1' },
  { name: 'Noite Estrelada', start: '#0f2027', end: '#2c5364' },
  { name: 'Fogo', start: '#f12711', end: '#f5af19' },
  { name: 'Aurora', start: '#a8edea', end: '#fed6e3' },
];

function LyricsDisplaySettingsPage() {
  const [songLyric, setSongLyric] = useState([]);
  const [backgroundVideos, setBackgroundVideos] = useState([]);
  const [documentsPath, setDocumentsPath] = useState('');
  const [windowId, setWindowId] = useState(2);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [fontSize, setFontSize] = useState(72);

  // Background settings
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('none');
  const [solidColor, setSolidColor] = useState('#1a1a2e');
  const [gradientStart, setGradientStart] = useState('#667eea');
  const [gradientEnd, setGradientEnd] = useState('#764ba2');
  const [backgroundImage, setBackgroundImage] = useState<string>('');

  // Logo settings
  const [logoImage, setLogoImage] = useState<string>('');

  const handleSlideClick = (index: number) => {
    setActiveSlideIndex(index);
    api?.setActiveSlide(windowId, index);
    api?.focusTargetWindow(windowId);
  };

  // Load themes
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const themesData = await getAllThemes();
        setThemes(themesData);
        const defaultTheme = themesData.find(t => t.is_default) || themesData[0];
        if (defaultTheme) {
          setSelectedThemeId(defaultTheme.id);
          setFontSize(defaultTheme.font_size);
          applyTheme(defaultTheme);
        }
      } catch (error) {
        console.error('Error loading themes:', error);
      }
    };
    loadThemes();
  }, []);

  const applyTheme = (theme: Theme) => {
    setFontSize(theme.font_size);
    api?.updateLyricsTheme?.(windowId, {
      fontFamily: theme.font_family,
      fontSize: theme.font_size,
      fontWeight: theme.font_weight,
      textColor: theme.text_color,
      textShadow: theme.text_shadow,
      animationType: theme.animation_type,
    });
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedThemeId(themeId);
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      applyTheme(theme);
    }
  };

  const handleFontSizeChange = (value: number) => {
    setFontSize(value);
    const theme = themes.find(t => t.id === selectedThemeId);
    if (theme) {
      api?.updateLyricsTheme?.(windowId, {
        fontFamily: theme.font_family,
        fontSize: value,
        fontWeight: theme.font_weight,
        textColor: theme.text_color,
        textShadow: theme.text_shadow,
        animationType: theme.animation_type,
      });
    }
  };

  const selectVideoBackground = (value: string) => {
    api?.selectVideoBackground(windowId, value);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        setBackgroundImage(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Logo = reader.result as string;
        setLogoImage(base64Logo);
        // Save to settings
        api?.setSetting('customLogo', base64Logo);
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply background based on type
  useEffect(() => {
    if (windowId === 2) return; // Wait for window ID to be set

    switch (backgroundType) {
      case 'none':
        api?.selectVideoBackground(windowId, '');
        api?.setCustomBackground(windowId, '');
        break;
      case 'color':
        api?.setCustomBackground(windowId, solidColor);
        api?.selectVideoBackground(windowId, ''); // Clear video
        break;
      case 'gradient':
        api?.setCustomBackground(windowId, `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`);
        api?.selectVideoBackground(windowId, ''); // Clear video
        break;
      case 'video':
        api?.setCustomBackground(windowId, ''); // Clear custom background
        break;
      case 'image':
        if (backgroundImage) {
          api?.setCustomBackground(windowId, `url(${backgroundImage}) center/cover no-repeat`);
          api?.selectVideoBackground(windowId, ''); // Clear video
        }
        break;
    }
  }, [backgroundType, solidColor, gradientStart, gradientEnd, backgroundImage, windowId]);

  // Set up lyrics listener only once
  useEffect(() => {
    console.log('🎵 Settings: Setting up onLoadedLyrics listener');

    const handleLoadedLyrics = (loadedLyrics: string[]) => {
      console.log('📥 Settings: Received lyrics:', loadedLyrics?.length || 0, 'lines');
      setSongLyric(loadedLyrics);
    };

    api?.onLoadedLyrics(handleLoadedLyrics);
  }, []); // Empty deps - run only once

  // Set up window ID and paths
  useEffect(() => {
    const { windowid } = queryString.parse(location.search);
    console.log('🪟 Settings: Window ID set to:', windowid);
    setWindowId(Number(windowid));

    api?.getPath('documents').then(path => {
      const videosPath = `${path}/lyrics-slide-show/videos`;
      setDocumentsPath(videosPath);
    });

    api?.getBackgroundVideos().then(videos => setBackgroundVideos(videos));

    // Load custom logo from settings
    api?.getSetting('customLogo').then(logo => {
      if (logo) {
        setLogoImage(logo);
      }
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.keyCode === 37 || event.keyCode === 38) {
        const newIndex = activeSlideIndex === 0 ? 0 : activeSlideIndex - 1;
        handleSlideClick(newIndex);
      } else if (event.keyCode === 39 || event.keyCode === 40) {
        const newIndex = activeSlideIndex === songLyric.length - 1 ? activeSlideIndex : activeSlideIndex + 1;
        handleSlideClick(newIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSlideIndex, songLyric.length, windowId]);

  return (
    <Fragment>
      <Head>
        <title>Controle - Lyrics Slideshow</title>
      </Head>

      <div className='flex h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950'>
        {/* Sidebar - Controls */}
        <div className='w-80 flex-shrink-0 border-r border-white/10 bg-black/20 backdrop-blur-sm overflow-y-auto'>
          <div className='p-6 space-y-6'>
            {/* Header */}
            <div>
              <h1 className='text-xl font-bold text-white'>Controle</h1>
              <p className='text-sm text-slate-400'>Apresentação de letras</p>
            </div>

            {/* Theme */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className='space-y-3'>
              <div className='flex items-center gap-2 text-white'>
                <Palette className='h-4 w-4' />
                <h3 className='text-sm font-semibold'>Tema</h3>
              </div>
              <Select value={selectedThemeId} onValueChange={handleThemeChange}>
                <SelectTrigger className='border-white/20 bg-white/5 text-white'>
                  <SelectValue placeholder='Selecionar tema' />
                </SelectTrigger>
                <SelectContent className='border-white/20 bg-slate-900'>
                  {themes.map(theme => (
                    <SelectItem
                      key={theme.id}
                      value={theme.id}
                      className='text-white hover:bg-white/10'>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            {/* Font Size - Minimalista */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 text-white'>
                  <Type className='h-4 w-4' />
                  <h3 className='text-sm font-semibold'>Tamanho</h3>
                </div>
                <span className='text-sm font-semibold text-purple-400'>{fontSize}px</span>
              </div>
              <input
                type='range'
                min='24'
                max='120'
                value={fontSize}
                onChange={e => handleFontSizeChange(Number(e.target.value))}
                className='w-full h-1 accent-purple-500'
              />
            </motion.div>

            {/* Background */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='space-y-3'>
              <div className='flex items-center gap-2 text-white'>
                <Palette className='h-4 w-4' />
                <h3 className='text-sm font-semibold'>Fundo</h3>
              </div>

              {/* Background Type Selector */}
              <Select value={backgroundType} onValueChange={(value: BackgroundType) => setBackgroundType(value)}>
                <SelectTrigger className='border-white/20 bg-white/5 text-white'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='border-white/20 bg-slate-900'>
                  <SelectItem value='none' className='text-white hover:bg-white/10'>
                    Nenhum
                  </SelectItem>
                  <SelectItem value='color' className='text-white hover:bg-white/10'>
                    Cor Sólida
                  </SelectItem>
                  <SelectItem value='gradient' className='text-white hover:bg-white/10'>
                    Gradiente
                  </SelectItem>
                  <SelectItem value='video' className='text-white hover:bg-white/10'>
                    Vídeo
                  </SelectItem>
                  <SelectItem value='image' className='text-white hover:bg-white/10'>
                    Imagem
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Background Options */}
              <AnimatePresence mode='wait'>
                {backgroundType === 'color' && (
                  <motion.div
                    key='color'
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className='space-y-2'>
                    <input
                      type='color'
                      value={solidColor}
                      onChange={e => setSolidColor(e.target.value)}
                      className='w-full h-10 cursor-pointer rounded border border-white/20'
                    />
                  </motion.div>
                )}

                {backgroundType === 'gradient' && (
                  <motion.div
                    key='gradient'
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className='space-y-3'>
                    {/* Gradient Presets */}
                    <div className='space-y-2'>
                      <Label className='text-xs text-slate-400'>Presets</Label>
                      <div className='grid grid-cols-2 gap-2'>
                        {GRADIENT_PRESETS.map(preset => (
                          <button
                            key={preset.name}
                            onClick={() => {
                              setGradientStart(preset.start);
                              setGradientEnd(preset.end);
                            }}
                            className='group relative overflow-hidden rounded-lg border border-white/10 p-3 text-left transition-all hover:border-white/30 hover:scale-105'
                            style={{
                              background: `linear-gradient(135deg, ${preset.start}, ${preset.end})`,
                            }}>
                            <span className='relative z-10 text-xs font-semibold text-white drop-shadow-lg'>
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Colors */}
                    <div className='flex gap-2'>
                      <div className='flex-1'>
                        <Label className='text-xs text-slate-400'>Início</Label>
                        <input
                          type='color'
                          value={gradientStart}
                          onChange={e => setGradientStart(e.target.value)}
                          className='w-full h-8 cursor-pointer rounded border border-white/20'
                        />
                      </div>
                      <div className='flex-1'>
                        <Label className='text-xs text-slate-400'>Fim</Label>
                        <input
                          type='color'
                          value={gradientEnd}
                          onChange={e => setGradientEnd(e.target.value)}
                          className='w-full h-8 cursor-pointer rounded border border-white/20'
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {backgroundType === 'video' && (
                  <motion.div
                    key='video'
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}>
                    <Select onValueChange={selectVideoBackground}>
                      <SelectTrigger className='border-white/20 bg-white/5 text-white text-sm'>
                        <SelectValue placeholder='Selecionar vídeo' />
                      </SelectTrigger>
                      <SelectContent className='border-white/20 bg-slate-900'>
                        {backgroundVideos.map(video => (
                          <SelectItem
                            key={video}
                            value={`${documentsPath}/${video}`}
                            className='text-white hover:bg-white/10'>
                            {video}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}

                {backgroundType === 'image' && (
                  <motion.div
                    key='image'
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className='space-y-2'>
                    {backgroundImage ? (
                      <div className='relative'>
                        <img
                          src={backgroundImage}
                          alt='Background preview'
                          className='w-full h-32 object-cover rounded-lg border border-white/20'
                        />
                        <button
                          onClick={() => setBackgroundImage('')}
                          className='absolute top-2 right-2 rounded-full bg-red-500/80 p-2 text-white hover:bg-red-600 transition-colors'>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='16'
                            height='16'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'>
                            <line x1='18' y1='6' x2='6' y2='18'></line>
                            <line x1='6' y1='6' x2='18' y2='18'></line>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className='flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-purple-500/50 transition-colors bg-white/5'>
                        <ImageIcon className='h-8 w-8 text-slate-400' />
                        <p className='mt-2 text-xs text-slate-400'>Clique para selecionar</p>
                        <input
                          type='file'
                          accept='image/*'
                          onChange={handleImageUpload}
                          className='hidden'
                        />
                      </label>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='space-y-3'>
              <div className='flex items-center gap-2 text-white'>
                <ImageIcon className='h-4 w-4' />
                <h3 className='text-sm font-semibold'>Logo</h3>
              </div>

              {logoImage ? (
                <div className='relative'>
                  <img
                    src={logoImage}
                    alt='Logo preview'
                    className='w-full h-24 object-contain rounded-lg border border-white/20 bg-white/5 p-2'
                  />
                  <button
                    onClick={() => {
                      setLogoImage('');
                      api?.setSetting('customLogo', '');
                    }}
                    className='absolute top-2 right-2 rounded-full bg-red-500/80 p-1.5 text-white hover:bg-red-600 transition-colors'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'>
                      <line x1='18' y1='6' x2='6' y2='18'></line>
                      <line x1='6' y1='6' x2='18' y2='18'></line>
                    </svg>
                  </button>
                </div>
              ) : (
                <label className='flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-purple-500/50 transition-colors bg-white/5'>
                  <ImageIcon className='h-6 w-6 text-slate-400' />
                  <p className='mt-1 text-xs text-slate-400'>Selecionar logo</p>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleLogoUpload}
                    className='hidden'
                  />
                </label>
              )}
            </motion.div>
          </div>
        </div>

        {/* Main - Slides Grid */}
        <div className='flex-1 overflow-hidden'>
          <div className='h-full p-6'>
            <div className='mb-4 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Play className='h-5 w-5 text-purple-400' />
                <h2 className='text-lg font-semibold text-white'>
                  Slides {songLyric.length > 0 && `(${songLyric.length})`}
                </h2>
              </div>
              {activeSlideIndex >= 0 && songLyric.length > 0 && (
                <div className='text-sm text-slate-400'>
                  Slide {activeSlideIndex + 1} de {songLyric.length}
                </div>
              )}
            </div>

            {songLyric.length === 0 ? (
              <div className='flex h-[calc(100%-4rem)] items-center justify-center rounded-2xl border border-white/10 bg-white/5'>
                <div className='text-center'>
                  <Play className='mx-auto h-16 w-16 text-slate-600' />
                  <p className='mt-4 text-slate-400'>Aguardando letras...</p>
                </div>
              </div>
            ) : (
              <div className='h-[calc(100%-4rem)] overflow-y-auto'>
                <div className='grid grid-cols-3 gap-4 pb-4'>
                  {songLyric?.map?.((lyr, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSlideClick(index)}
                      className={`group relative cursor-pointer overflow-hidden rounded-xl border p-4 transition-all ${
                        activeSlideIndex === index
                          ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-white/10'
                      }`}>
                      <div className='flex min-h-[140px] flex-col justify-between'>
                        <div className='mb-3 flex-1'>
                          <p className='line-clamp-5 text-sm leading-relaxed text-slate-300'>
                            {lyr}
                          </p>
                        </div>
                        <div className='flex items-center justify-between'>
                          <span
                            className={`text-xs font-semibold ${
                              activeSlideIndex === index ? 'text-purple-400' : 'text-slate-500'
                            }`}>
                            #{index + 1}
                          </span>
                          {activeSlideIndex === index && (
                            <ChevronRight className='h-4 w-4 text-purple-400' />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default LyricsDisplaySettingsPage;
