import React, { Fragment, useEffect, useState } from 'react';
import Head from 'next/head';
import queryString from 'query-string';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Music2 } from 'lucide-react';
import { getAllThemes } from '../lib/supabase-service';
import type { Theme } from '../lib/supabase';

import { LogoSvg } from '../shared/Icons/Logo';
import { Slide } from '../../../main/shared/types';

const api = typeof window !== 'undefined' ? window.api : undefined;

function LyricsDisplayPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [songLyric, setSongLyric] = useState<Slide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoBackgroundPath, setVideoBackgroundPath] = useState('');
  const [videoSrcBlog, setVideoSrcBlog] = useState('');
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [showPagination, setShowPagination] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [customBackground, setCustomBackground] = useState<string>('');
  const [logoPath, setLogoPath] = useState<string>('/images/logo.svg');
  const [backgroundType, setBackgroundType] = useState<string>('gradient');
  const [transitionType, setTransitionType] = useState('fade');
  const [transitionSpeed, setTransitionSpeed] = useState(0.5);

  // Load settings, theme, and lyrics
  useEffect(() => {
    const loadInitialData = async () => {
      const showPaginationSetting = await api?.getSetting('showPagination');
      const showLogoSetting = await api?.getSetting('showLogo');
      const logoPathSetting = await api?.getSetting('logoPath');
      const videoBackgroundPathSetting = await api?.getSetting('videoBackgroundPath');
      const savedSelectedThemeId = await api?.getSetting('selectedThemeId');
      const savedFontSize = await api?.getSetting('fontSize');
      const savedBackgroundType = await api?.getSetting('backgroundType');
      const savedSolidColor = await api?.getSetting('solidColor');
      const savedGradientStart = await api?.getSetting('gradientStart');
      const savedGradientEnd = await api?.getSetting('gradientEnd');
      const savedBackgroundImage = await api?.getSetting('backgroundImage');
      const transitionTypeSetting = await api?.getSetting('transitionType');
      const transitionSpeedSetting = await api?.getSetting('transitionSpeed');

      console.log('⚙️ Lyrics: Loaded settings:', {
        showPaginationSetting,
        showLogoSetting,
        logoPathSetting,
        videoBackgroundPathSetting,
        savedSelectedThemeId,
        savedFontSize,
        savedBackgroundType,
        savedSolidColor,
        savedGradientStart,
        savedGradientEnd,
        savedBackgroundImage,
        transitionTypeSetting,
        transitionSpeedSetting,
      });

      if (showPaginationSetting !== undefined) setShowPagination(showPaginationSetting);
      if (showLogoSetting !== undefined) setShowLogo(showLogoSetting);
      if (transitionTypeSetting) setTransitionType(transitionTypeSetting);
      if (transitionSpeedSetting) setTransitionSpeed(transitionSpeedSetting);
      if (logoPathSetting) {
        if (logoPathSetting === 'logo.svg') {
          setLogoPath('/images/logo.svg');
        } else {
          setLogoPath(logoPathSetting);
        }
      }

      // Load background settings based on type
      if (savedBackgroundType) {
        setBackgroundType(savedBackgroundType);

        switch (savedBackgroundType) {
          case 'video':
            if (videoBackgroundPathSetting) {
              setVideoBackgroundPath(videoBackgroundPathSetting);
              setCustomBackground('');
            }
            break;
          case 'color':
            if (savedSolidColor) {
              setCustomBackground(savedSolidColor);
              setVideoBackgroundPath('');
            }
            break;
          case 'gradient':
            if (savedGradientStart && savedGradientEnd) {
              setCustomBackground(`linear-gradient(135deg, ${savedGradientStart}, ${savedGradientEnd})`);
              setVideoBackgroundPath('');
            }
            break;
          case 'image':
            if (savedBackgroundImage) {
              setCustomBackground(`url(${savedBackgroundImage}) center/cover no-repeat`);
              setVideoBackgroundPath('');
            }
            break;
          case 'none':
          default:
            setCustomBackground('');
            setVideoBackgroundPath('');
            break;
        }
      }

      try {
        const themes = await getAllThemes();
        let initialTheme = themes.find(t => t.is_default) || themes[0];

        if (savedSelectedThemeId) {
          const foundTheme = themes.find(t => t.id === savedSelectedThemeId);
          if (foundTheme) {
            initialTheme = foundTheme;
          }
        }

        if (initialTheme) {
          if (savedFontSize !== undefined) {
            initialTheme = { ...initialTheme, font_size: savedFontSize };
          }
          setCurrentTheme(initialTheme);
        }
      } catch (error) {
        console.error('Error loading themes:', error);
      }

      // Load lyrics
      if (!songLyric.length) {
        setIsLoading(true);

        const { url, filePath, isDefault } = queryString.parse(location.search);

        const isDefaultBoolean = isDefault === 'true';

        if (filePath) {
          api?.getLyricByFilePath(filePath as string, isDefaultBoolean).then(res => {
            setSongLyric(res);
            setIsLoading(false);
          });
        } else {
          api?.getLyricByUrlHandle(url as string).then(res => {
            setSongLyric(res);
            setIsLoading(false);
          });
        }
      }
    };
    loadInitialData();
  }, []);

  // Set up IPC listeners - using useCallback to ensure stable function references
  useEffect(() => {
    if (!api) {
      console.log('❌ Lyrics: API not available');
      return;
    }

    console.log('🎧 Lyrics: Setting up IPC listeners. API object: ✅');

    const handleSlideClicked = (slideIndex: number) => {
      console.log('👆 Lyrics: Received slide clicked:', slideIndex);
      setActiveIndex(slideIndex);
    };

    const handleSlideClickedIndex = (slideIndex: number) => {
      console.log('👆 Lyrics: Received slide clicked index:', slideIndex);
      setActiveIndex(slideIndex);
    };

    const handleSelectedVideoBackground = (video: string) => {
      console.log('🎥 Lyrics: Received video background update:', video);
      setVideoBackgroundPath(video);
      if (video) {
        console.log('✅ Lyrics: Clearing custom background because video was selected');
        setCustomBackground(''); // Clear custom background when video is selected
      }
    };

    const handleThemeUpdate = (themeData: any) => {
      console.log('🎨 Lyrics: Received theme update:', themeData);

      setCurrentTheme(prev => {
        console.log('🎨 Lyrics: Current theme before update:', prev);

        const newTheme = {
          // Keep the existing ID and other properties from prev
          id: prev?.id || 'custom',
          name: prev?.name || 'Custom',
          is_default: prev?.is_default || false,
          created_at: prev?.created_at || new Date().toISOString(),
          // Map the new properties - use incoming data first
          font_family: themeData.fontFamily || prev?.body_font_family || 'Montserrat',
          font_size: themeData.fontSize || prev?.font_size || 48,
          font_weight: themeData.fontWeight || prev?.font_weight || 600,
          text_color: themeData.textColor || prev?.text_color || '#FFFFFF',
          text_shadow: themeData.textShadow || prev?.text_shadow || '2px 2px 4px rgba(0,0,0,0.5)',
          text_outline: prev?.text_outline || 'none',
          background_position: prev?.background_position || 'center',
          animation_type: themeData.animationType || prev?.animation_type || 'fade',
        } as Theme;

        console.log('🎨 Lyrics: New theme after merge:', newTheme);
        return newTheme;
      });
    };

    const handleCustomBackground = (background: any) => {
      console.log('🌈 Lyrics: Received custom background update:', background);
      if (background) {
        console.log('✅ Lyrics: Setting custom background to:', background);
        setCustomBackground(background);
        setVideoBackgroundPath(''); // Clear video when custom background is set
      } else {
        console.log('⚠️ Lyrics: Clearing custom background');
        setCustomBackground('');
      }
    };

    // Store cleanup functions returned by listeners
    console.log('📡 Lyrics: Registering IPC event listeners...');
    const cleanupSlideClicked = api.onSlideClicked?.(handleSlideClicked);
    const cleanupSlideClickedIndex = api.onSlideClickedIndex?.(handleSlideClickedIndex);
    const cleanupSelectedVideoBackground = api.onSelectedVideoBackground?.(handleSelectedVideoBackground);
    const cleanupThemeUpdate = api.onThemeUpdate?.(handleThemeUpdate);
    const cleanupCustomBackground = api.onCustomBackground?.(handleCustomBackground);

    console.log('✅ Lyrics: All IPC listeners registered successfully');

    return () => {
      console.log('🧹 Lyrics: Cleaning up IPC listeners');
      // Call cleanup functions
      if (typeof cleanupSlideClicked === 'function') cleanupSlideClicked();
      if (typeof cleanupSlideClickedIndex === 'function') cleanupSlideClickedIndex();
      if (typeof cleanupSelectedVideoBackground === 'function') cleanupSelectedVideoBackground();
      if (typeof cleanupThemeUpdate === 'function') cleanupThemeUpdate();
      if (typeof cleanupCustomBackground === 'function') cleanupCustomBackground();
    };
  }, [api]); // Only re-run if api changes

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.keyCode === 37) {
        // Left arrow
        setActiveIndex(prevIndex => (prevIndex === 0 ? 0 : prevIndex - 1));
      } else if (event.keyCode === 39) {
        // Right arrow
        setActiveIndex(prevIndex =>
          prevIndex === songLyric.length - 1 ? prevIndex : prevIndex + 1
        );
      } else if (event.keyCode === 27) {
        // ESC key - could close window or go to first slide
        setActiveIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, songLyric.length]);

  useEffect(() => {
    const loadVideo = async () => {
      if (videoBackgroundPath) {
        console.log('🎥 Lyrics: Loading video from path:', videoBackgroundPath);
        const base64Video = await api?.getVideoBase64(videoBackgroundPath);
        setVideoSrcBlog(base64Video);
      } else {
        console.log('🎥 Lyrics: Clearing video background.');
        setVideoSrcBlog('');
      }
    };
    loadVideo();
  }, [videoBackgroundPath]);

  // Debug: Log when theme changes
  useEffect(() => {
    console.log('🔄 Lyrics: Theme state changed:', currentTheme);
  }, [currentTheme]);

  // Debug: Log when activeIndex changes
  useEffect(() => {
    console.log('🔄 Lyrics: Active index changed:', activeIndex);
  }, [activeIndex]);

  // Get animation variant based on theme
  const getAnimationVariant = (animationType: string) => {
    switch (animationType) {
      case 'slide':
        return {
          initial: { opacity: 0, x: 100 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -100 },
        };
      case 'zoom':
        return {
          initial: { opacity: 0, scale: 0.5 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.5 },
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  const textStyle: React.CSSProperties = currentTheme
    ? {
        fontFamily: currentTheme.body_font_family,
        fontSize: `${currentTheme.font_size}px`,
        fontWeight: currentTheme.font_weight,
        color: currentTheme.text_color,
        textShadow: currentTheme.text_shadow,
        WebkitTextStroke:
          currentTheme.text_outline !== 'none' ? currentTheme.text_outline : undefined,
      }
    : {
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '72px',
        fontWeight: 700,
        color: '#FFFFFF',
        textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)',
      };

  const animation = getAnimationVariant(transitionType);

  // Debug: Log text style on render
  console.log('🎨 Lyrics: Rendering with textStyle:', textStyle);
  console.log('🎨 Lyrics: Current activeIndex:', activeIndex);

  return (
    <Fragment>
      <Head>
        <title>Lyrics Slideshow - Lyrics</title>
      </Head>

      <div className='relative h-screen w-screen overflow-hidden bg-black'>
        {/* Background Video */}
        {videoSrcBlog && !customBackground && (
          <video
            src={videoSrcBlog}
            autoPlay
            loop
            muted
            className='absolute left-0 top-0 h-full w-full object-cover'
          />
        )}

        {/* Custom Background (color/gradient) */}
        {customBackground && (
          <div
            className='absolute left-0 top-0 h-full w-full'
            style={{ background: customBackground }}
          />
        )}

        {/* Default Gradient (when no background) */}
        {!videoSrcBlog && !customBackground && (
          <div className='absolute left-0 top-0 h-full w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' />
        )}

        {/* Content */}
        <div className='relative z-10 flex h-full w-full items-center justify-center px-16'>
          <div className='w-full text-center'>
            <AnimatePresence mode='wait'>
              {songLyric.length > 0 && (
                <motion.div
                  key={activeIndex}
                  {...animation}
                  transition={{ duration: transitionSpeed, ease: 'easeInOut' }}
                  style={textStyle}
                  className='mx-auto max-w-6xl leading-tight'>
                  {songLyric[activeIndex]?.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Bar - Progress Indicator & Next Line Preview */}
        {songLyric.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='absolute bottom-0 left-0 right-0 z-20 bg-black/30 backdrop-blur-sm'>
            {/* Next Line Preview */}
            {activeIndex < songLyric.length - 1 && (
              <div className='px-8 py-6'>
                <AnimatePresence mode='wait'>
                  <motion.p
                    key={`preview-${activeIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className='text-center text-3xl text-white/60'
                    style={{ fontFamily: textStyle.fontFamily }}>
                    {songLyric[activeIndex + 1]?.text}
                  </motion.p>
                </AnimatePresence>
              </div>
            )}

            {/* Progress Dots */}
            {showPagination && (
              <div className='flex items-center justify-center gap-2 px-8 py-4'>
                {songLyric.map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`h-2 rounded-full transition-all ${
                      index === activeIndex
                        ? 'w-12 bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'w-2 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute left-0 top-0 z-20 flex h-full w-full items-center justify-center bg-black/80 backdrop-blur-sm'>
            <div className='text-center'>
              <Loader2 className='mx-auto h-20 w-20 animate-spin text-purple-500' />
              <p className='mt-4 text-xl text-white'>Carregando letras...</p>
            </div>
          </motion.div>
        )}

        {/* Logo */}
        {showLogo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className='absolute bottom-8 right-8 z-20'>
            <div className='rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm'>
              {logoPath ? (
                <img src={logoPath} alt='Logo' className='h-16 w-16 object-contain' />
              ) : (
                <Music2 className='h-12 w-12 text-white/70' />
              )}
            </div>
          </motion.div>
        )}

        {/* Keyboard Shortcuts Hint (fades out after 5 seconds) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className='absolute bottom-8 right-8 z-20'>
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 5, duration: 1 }}
            className='rounded-xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-sm'>
            <p className='text-sm text-white/70'>
              Use <span className='font-semibold text-white'>← →</span> para navegar
              {' • '}
              <span className='font-semibold text-white'>ESC</span> para voltar ao início
            </p>
          </motion.div>
        </motion.div>
      </div>
    </Fragment>
  );
}

export default LyricsDisplayPage;
