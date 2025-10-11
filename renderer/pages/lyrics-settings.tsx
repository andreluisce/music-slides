import React, { Fragment, useEffect, useState } from 'react';
import Head from 'next/head';
import queryString from 'query-string';
import { motion } from 'framer-motion';
import { Video, Play, Film, CheckCircle2, Palette, Type, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';
import { Label } from 'components/ui/label';
import { Input } from 'components/ui/input';
import { Button } from 'components/ui/button';
import { getAllThemes } from '../lib/supabase-service';
import type { Theme } from '../lib/supabase';

const api = typeof window !== 'undefined' ? window.api : undefined;

const fontFamilies = [
  'Montserrat',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Bebas Neue',
  'Roboto',
  'Open Sans',
];

const fontWeights = [
  { label: 'Thin', value: '100' },
  { label: 'Light', value: '300' },
  { label: 'Regular', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semi Bold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Black', value: '900' },
];

const animationTypes = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'none', label: 'Nenhuma' },
];

function LyricsDisplaySettingsPage() {
  const [songLyric, setSongLyric] = useState([]);
  const [backgroundVideos, setBackgroundVideos] = useState([]);
  const [documentsPath, setDocumentsPath] = useState('');
  const [windowId, setWindowId] = useState(2);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Theme controls
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [fontFamily, setFontFamily] = useState('Montserrat');
  const [fontSize, setFontSize] = useState(72);
  const [fontWeight, setFontWeight] = useState('700');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textShadow, setTextShadow] = useState('2px 2px 8px rgba(0,0,0,0.9)');
  const [animationType, setAnimationType] = useState('fade');

  const selectOnChange = (value: string) => {
    api?.selectVideoBackground(windowId, value);
  };

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

        // Set default theme
        const defaultTheme = themesData.find(t => t.is_default) || themesData[0];
        if (defaultTheme) {
          setSelectedThemeId(defaultTheme.id);
          applyTheme(defaultTheme);
        }
      } catch (error) {
        console.error('Error loading themes:', error);
      }
    };
    loadThemes();
  }, []);

  const applyTheme = (theme: Theme) => {
    setFontFamily(theme.font_family);
    setFontSize(theme.font_size);
    setFontWeight(theme.font_weight.toString());
    setTextColor(theme.text_color);
    setTextShadow(theme.text_shadow);
    setAnimationType(theme.animation_type);

    // Send to lyrics window
    sendThemeUpdate({
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

  const sendThemeUpdate = (themeData: any) => {
    api?.updateLyricsTheme?.(windowId, themeData);
  };

  const handleFontFamilyChange = (value: string) => {
    setFontFamily(value);
    sendThemeUpdate({ fontFamily: value, fontSize, fontWeight: Number(fontWeight), textColor, textShadow, animationType });
  };

  const handleFontSizeChange = (value: number) => {
    setFontSize(value);
    sendThemeUpdate({ fontFamily, fontSize: value, fontWeight: Number(fontWeight), textColor, textShadow, animationType });
  };

  const handleFontWeightChange = (value: string) => {
    setFontWeight(value);
    sendThemeUpdate({ fontFamily, fontSize, fontWeight: Number(value), textColor, textShadow, animationType });
  };

  const handleTextColorChange = (value: string) => {
    setTextColor(value);
    sendThemeUpdate({ fontFamily, fontSize, fontWeight: Number(fontWeight), textColor: value, textShadow, animationType });
  };

  const handleTextShadowChange = (value: string) => {
    setTextShadow(value);
    sendThemeUpdate({ fontFamily, fontSize, fontWeight: Number(fontWeight), textColor, textShadow: value, animationType });
  };

  const handleAnimationChange = (value: string) => {
    setAnimationType(value);
    sendThemeUpdate({ fontFamily, fontSize, fontWeight: Number(fontWeight), textColor, textShadow, animationType: value });
  };

  useEffect(() => {
    api?.onLoadedLyrics(loadedLyrics => {
      setSongLyric(loadedLyrics);
    });
    setTimeout(() => {
      const { windowid } = queryString.parse(location.search);
      setWindowId(Number(windowid));
    }, 2000);

    api?.getPath('documents').then(path => {
      const videosPath = `${path}/lyrics-slide-show/videos`;
      setDocumentsPath(videosPath);
    });

    api?.getBackgroundVideos().then(videos => setBackgroundVideos(videos));

    // Keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.keyCode === 37 || event.keyCode === 38) {
        // Left arrow or Up arrow
        const newIndex = activeSlideIndex === 0 ? 0 : activeSlideIndex - 1;
        handleSlideClick(newIndex);
      } else if (event.keyCode === 39 || event.keyCode === 40) {
        // Right arrow or Down arrow
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
        <title>Lyrics - Slideshow Settings</title>
      </Head>

      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
        <div className='p-6'>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='mb-6'>
            <h1 className='text-2xl font-bold text-white'>Controle de Apresentação</h1>
            <p className='mt-1 text-sm text-slate-400'>
              Gerencie os slides e configurações da apresentação
            </p>
          </motion.div>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* Left Column */}
            <div className='space-y-6'>
              {/* Theme Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
                <div className='mb-4 flex items-center gap-2'>
                  <Palette className='h-5 w-5 text-purple-400' />
                  <h2 className='text-lg font-semibold text-white'>Tema Visual</h2>
                </div>

                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='theme-select' className='text-slate-300'>
                      Escolha um tema
                    </Label>
                    <Select value={selectedThemeId} onValueChange={handleThemeChange}>
                      <SelectTrigger
                        id='theme-select'
                        className='mt-1 border-white/20 bg-white/10 text-white'>
                        <SelectValue placeholder='Selecione um tema' />
                      </SelectTrigger>
                      <SelectContent className='border-white/20 bg-slate-900'>
                        {themes.map(theme => (
                          <SelectItem
                            key={theme.id}
                            value={theme.id}
                            className='text-white hover:bg-white/10'>
                            <div className='flex items-center gap-2'>
                              <Sparkles className='h-4 w-4 text-purple-400' />
                              {theme.name}
                              {theme.is_default && (
                                <span className='ml-2 text-xs text-yellow-400'>(Padrão)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>

              {/* Typography Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
                <div className='mb-4 flex items-center gap-2'>
                  <Type className='h-5 w-5 text-pink-400' />
                  <h2 className='text-lg font-semibold text-white'>Tipografia</h2>
                </div>

                <div className='space-y-4'>
                  {/* Font Family */}
                  <div>
                    <Label htmlFor='font-family' className='text-slate-300'>
                      Fonte
                    </Label>
                    <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
                      <SelectTrigger
                        id='font-family'
                        className='mt-1 border-white/20 bg-white/10 text-white'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='border-white/20 bg-slate-900'>
                        {fontFamilies.map(font => (
                          <SelectItem
                            key={font}
                            value={font}
                            className='text-white hover:bg-white/10'>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <Label htmlFor='font-size' className='text-slate-300'>
                      Tamanho: {fontSize}px
                    </Label>
                    <input
                      type='range'
                      id='font-size'
                      min='24'
                      max='120'
                      value={fontSize}
                      onChange={e => handleFontSizeChange(Number(e.target.value))}
                      className='mt-2 w-full accent-purple-500'
                    />
                    <div className='mt-1 flex justify-between text-xs text-slate-500'>
                      <span>24px</span>
                      <span>120px</span>
                    </div>
                  </div>

                  {/* Font Weight */}
                  <div>
                    <Label htmlFor='font-weight' className='text-slate-300'>
                      Peso da Fonte
                    </Label>
                    <Select value={fontWeight} onValueChange={handleFontWeightChange}>
                      <SelectTrigger
                        id='font-weight'
                        className='mt-1 border-white/20 bg-white/10 text-white'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='border-white/20 bg-slate-900'>
                        {fontWeights.map(weight => (
                          <SelectItem
                            key={weight.value}
                            value={weight.value}
                            className='text-white hover:bg-white/10'>
                            {weight.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Text Color */}
                  <div>
                    <Label htmlFor='text-color' className='text-slate-300'>
                      Cor do Texto
                    </Label>
                    <div className='mt-2 flex gap-2'>
                      <input
                        type='color'
                        id='text-color'
                        value={textColor}
                        onChange={e => handleTextColorChange(e.target.value)}
                        className='h-10 w-20 cursor-pointer rounded border border-white/20'
                      />
                      <Input
                        value={textColor}
                        onChange={e => handleTextColorChange(e.target.value)}
                        className='flex-1 border-white/20 bg-white/10 text-white'
                      />
                    </div>
                  </div>

                  {/* Text Shadow */}
                  <div>
                    <Label htmlFor='text-shadow' className='text-slate-300'>
                      Sombra do Texto
                    </Label>
                    <Input
                      id='text-shadow'
                      value={textShadow}
                      onChange={e => handleTextShadowChange(e.target.value)}
                      placeholder='Ex: 2px 2px 8px rgba(0,0,0,0.9)'
                      className='mt-1 border-white/20 bg-white/10 text-white placeholder:text-slate-400'
                    />
                  </div>

                  {/* Animation Type */}
                  <div>
                    <Label htmlFor='animation' className='text-slate-300'>
                      Animação
                    </Label>
                    <Select value={animationType} onValueChange={handleAnimationChange}>
                      <SelectTrigger
                        id='animation'
                        className='mt-1 border-white/20 bg-white/10 text-white'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='border-white/20 bg-slate-900'>
                        {animationTypes.map(anim => (
                          <SelectItem
                            key={anim.value}
                            value={anim.value}
                            className='text-white hover:bg-white/10'>
                            {anim.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>

              {/* Background Video Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
                <div className='mb-4 flex items-center gap-2'>
                  <Video className='h-5 w-5 text-purple-400' />
                  <h2 className='text-lg font-semibold text-white'>Vídeo de Fundo</h2>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='video-select' className='text-slate-300'>
                    Escolha um vídeo de fundo
                  </Label>
                  <Select onValueChange={selectOnChange}>
                    <SelectTrigger
                      id='video-select'
                      className='border-white/20 bg-white/10 text-white'>
                      <SelectValue placeholder='Selecione um vídeo de fundo' />
                    </SelectTrigger>
                    <SelectContent className='border-white/20 bg-slate-900'>
                      {backgroundVideos.length === 0 ? (
                        <SelectItem value='none' disabled className='text-slate-500'>
                          Nenhum vídeo disponível
                        </SelectItem>
                      ) : (
                        backgroundVideos.map(background => (
                          <SelectItem
                            key={background}
                            value={`${documentsPath}/${background}`}
                            className='text-white hover:bg-white/10'>
                            <div className='flex items-center gap-2'>
                              <Film className='h-4 w-4 text-purple-400' />
                              {background}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Slides Grid */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
                <div className='mb-4 flex items-center gap-2'>
                  <Play className='h-5 w-5 text-pink-400' />
                  <h2 className='text-lg font-semibold text-white'>
                    Slides ({songLyric.length})
                  </h2>
                </div>

                {songLyric.length === 0 ? (
                  <div className='flex h-[600px] flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5'>
                    <Play className='h-16 w-16 text-slate-600' />
                    <p className='mt-4 text-slate-400'>Aguardando letras...</p>
                  </div>
                ) : (
                  <div className='grid max-h-[600px] grid-cols-2 gap-3 overflow-y-auto pr-2'>
                    {songLyric?.map?.((lyr, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSlideClick(index)}
                        className={`group relative cursor-pointer overflow-hidden rounded-xl border transition-all ${
                          activeSlideIndex === index
                            ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/20'
                            : 'border-white/10 bg-gradient-to-br from-white/5 to-white/10 hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10'
                        }`}>
                        <div className='flex min-h-[120px] flex-col items-center justify-between p-3'>
                          <div className='flex-1 flex items-center justify-center text-center'>
                            <p className={`line-clamp-4 text-xs leading-relaxed transition-colors ${
                              activeSlideIndex === index ? 'text-white' : 'text-slate-300'
                            }`}>
                              {lyr}
                            </p>
                          </div>

                          <div className='mt-2 flex w-full items-center justify-between'>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              activeSlideIndex === index
                                ? 'bg-purple-500/30 text-purple-300'
                                : 'bg-white/10 text-slate-400'
                            }`}>
                              #{index + 1}
                            </span>

                            {activeSlideIndex === index && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300 }}>
                                <CheckCircle2 className='h-4 w-4 text-purple-400' />
                              </motion.div>
                            )}
                          </div>
                        </div>

                        <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Keyboard Shortcuts Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className='mt-6 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
            <p className='text-xs text-slate-400'>
              <span className='font-semibold text-white'>Atalhos:</span> Use as setas ← → para navegar entre slides na janela de apresentação
            </p>
          </motion.div>
        </div>
      </div>
    </Fragment>
  );
}

export default LyricsDisplaySettingsPage;
