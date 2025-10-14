import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Presentation, Slide } from '../lib/supabase';

interface PresentationSettings {
  showPagination: boolean;
  showLogo: boolean;
  logoPath?: string;
  transitionType: 'fade' | 'slide' | 'zoom';
  transitionSpeed: number;
}

interface Background {
  type: 'image' | 'video';
  path: string;
}

export default function PresentationPage() {
  const getPresentationIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('presentationId');
  };

  const presentationId = getPresentationIdFromUrl();
  console.log('DEBUG: PresentationPage rendered. presentationId:', presentationId);

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [songInfo, setSongInfo] = useState({ title: '', artist: '' });
  const [presentationSettings, setPresentationSettings] = useState<PresentationSettings>({
    showPagination: false,
    showLogo: false,
    transitionType: 'fade',
    transitionSpeed: 33,
  });
  const [background, setBackground] = useState<Background | null>(null);
  // Theme state and debug logging
  console.log('Setting up theme state...');
  const [theme, setTheme] = useState({
    fontSize: 80,
    fontFamily: 'Arial, sans-serif',
    textColor: '#ffffff',
    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
    backgroundColor: '#000000',
    textAlign: 'center' as const,
    fontWeight: 700,
  });

  // Subscribe to presentation changes
  useEffect(() => {
    if (!presentationId) return;

    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from('presentations')
        .select('*, presentation_items(*)')
        .eq('id', presentationId)
        .single();

      if (error) {
        console.error('Error fetching initial presentation:', error);
      } else {
        setPresentation(data);
      }

      const { data: slidesData, error: slidesError } = await supabase
        .from('slides')
        .select('*')
        .eq('presentation_id', presentationId);

      if (slidesError) {
        console.error('Error fetching initial slides:', slidesError);
      } else {
        setSlides(slidesData);
      }
    };

    fetchInitialData();

    const presentationChannel = supabase
      .channel(`public:presentations:id=eq.${presentationId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'presentations', filter: `id=eq.${presentationId}` },
        (payload) => {
          setPresentation(payload.new as Presentation);
        }
      )
      .subscribe();

    const slidesChannel = supabase
      .channel(`public:slides:presentation_id=eq.${presentationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'slides', filter: `presentation_id=eq.${presentationId}` },
        async () => {
          // Refetch all slides for simplicity on any slide change
          const { data: slidesData, error: slidesError } = await supabase
            .from('slides')
            .select('*')
            .eq('presentation_id', presentationId);

          if (slidesError) {
            console.error('Error refetching slides:', slidesError);
          } else {
            setSlides(slidesData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presentationChannel);
      supabase.removeChannel(slidesChannel);
    };
  }, [presentationId]);

  // Listen for slide change events
  useEffect(() => {
    const api = window.api;
    if (!api) return;

    // Recebe o evento de mudança de slide e atualiza o slide atual
    const onSlideChange = (slideIndex: number) => {
      console.log('DEBUG: onSlideChange called with index:', slideIndex);
      
      if (slides?.[slideIndex]) {
        const slide = slides[slideIndex];
        console.log('DEBUG: Updating current slide to:', {
          id: slide.id,
          content: slide.content,
          slideIndex
        });

        setPresentation(prev => ({
          ...prev,
          current_slide_id: slide.id
        }));
      } else {
        console.log('DEBUG: Invalid slide index or no slides available:', {
          slideIndex,
          slidesLength: slides?.length
        });
      }
    };

    // Subscribe to slide change events
    const cleanup = api.presentation.onSlideChanged?.(onSlideChange);

    return () => cleanup?.();
  }, [presentationId, slides]);

  // Listen for IPC events
  useEffect(() => {
    const api = window.api;
    if (!api) return;

    const cleanups: Array<(() => void) | undefined> = [];

    // Background listener
    console.log('Setting up background listener...');
    cleanups.push(
      api.presentation.onCustomBackground?.((newBackground: Background) => {
        console.log('DEBUG: Background update received:', newBackground);
        console.log('Will set background to:', {
          type: newBackground.type,
          path: `file://${newBackground.path}`
        });
        setBackground(newBackground);
      })
    );

    // Theme listener
    console.log('Setting up theme update listener...');
    cleanups.push(
      api.presentation.onThemeUpdate?.((themeData: any) => {
        console.log('DEBUG: Theme update received:', themeData);
        setTheme(themeData);
      })
    );

    // Control action listener
    cleanups.push(
      api.presentation.onControlReceived?.((data: { action: string; data?: any }) => {
        console.log('Control action received:', data.action, data.data);
        if (data.action === 'theme' && data.data) {
          setTheme(prevTheme => ({ ...prevTheme, ...data.data }));
        }
      })
    );

    // Song info listener
    cleanups.push(
      api.presentation.onSongInfo?.((info: { artist: string; title: string }) => {
        console.log('DEBUG: onSongInfo received. info:', info);
        setSongInfo(info);
      })
    );

    // Lyrics listener
    cleanups.push(
      api.presentation.onLoadedLyrics?.((lyricsData: any) => {
        if (typeof lyricsData === 'string') {
          // Split each line into a separate slide
          const lines = lyricsData
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(content => ({
              id: `slide-${Math.random()}`,
              content,
              type: content.toLowerCase().includes('refrão') || content.toLowerCase().includes('chorus')
                ? 'chorus'
                : 'verse'
            }));

          if (presentationId) {
            // In Supabase mode, update slides while preserving IDs
            const currentSlideId = presentation?.current_slide_id;
            if (currentSlideId && slides) {
              const updatedSlides = slides.map((slide, index) => ({
                ...slide,
                content: lines[index]?.content || slide.content
              }));
              setSlides(updatedSlides);
            } else {
              setSlides(lines);
            }
          } else {
            // In local mode, use the parsed slides directly
            setSlides(lines);
          }
        } else if (Array.isArray(lyricsData)) {
          setSlides(lyricsData);
        }
      })
    );

    // Cleanup all listeners
    return () => {
      cleanups.forEach(cleanup => cleanup?.());
    };
  }, [presentationId, presentation?.current_slide_id, slides]);

  // In local mode (no presentationId), use the slides array directly
  const currentSlideIndex = presentation?.current_slide_id
    ? slides?.findIndex(slide => slide.id === presentation?.current_slide_id)
    : 0;
  
  const currentSlide = slides?.[currentSlideIndex];

  console.log('DEBUG: Rendering.', {
    slides: slides?.length ? `${slides.length} slides` : 'no slides',
    currentSlide: currentSlide?.content || 'no current slide',
    currentSlideIndex,
    mode: presentationId ? 'supabase' : 'local'
  });

  // Calculate transition duration based on speed (0-100 -> 0.8s-0.2s)
  const transitionDuration = 0.8 - (presentationSettings.transitionSpeed / 100) * 0.6;

  // Get animation variants based on transition type
  const getAnimationVariants = () => {
    switch (presentationSettings.transitionType) {
      case 'slide':
        return {
          initial: { opacity: 0, x: 100 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -100 },
        };
      case 'zoom':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.2 },
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
        };
    }
  };

  const animationVariants = getAnimationVariants();

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: theme.backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Background */}
      {background && (
        <>
        {console.log('Rendering background:', background)}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          {background.type === 'video' ? (
            <video
              src={`file://${background.path}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={`file://${background.path}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              alt="Background"
            />
          )}
        </div>
        {console.log('Background element rendered')}
        </>
      )}
      {/* Content wrapper with z-index */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Logo (top left) */}
      {presentationSettings.showLogo && presentationSettings.logoPath && (
        <div
          style={{
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            opacity: 0.7,
          }}
        >
          <img
            src={presentationSettings.logoPath}
            alt="Logo"
            style={{
              maxWidth: '150px',
              maxHeight: '80px',
              objectFit: 'contain',
            }}
          />
        </div>
      )}

      {/* Song Info (small, at top) */}
      {songInfo.title && !presentationSettings.showLogo && (
        <div
          style={{
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            color: theme.textColor,
            opacity: 0.5,
            fontSize: '1rem',
            textShadow: theme.textShadow,
          }}
        >
          <div>{songInfo.title}</div>
          <div style={{ fontSize: '0.8rem' }}>{songInfo.artist}</div>
        </div>
      )}

      {/* Main Lyrics Display */}
      <AnimatePresence mode='wait'>
        {currentSlide && (
          <motion.div
            key={currentSlide?.id || currentSlideIndex} // Use slide.id as key for better animation
            initial={animationVariants.initial}
            animate={animationVariants.animate}
            exit={animationVariants.exit}
            transition={{ duration: transitionDuration }}
            style={{
              fontSize: `${theme.fontSize}px`,
                  fontFamily: theme.fontFamily,
                  color: theme.textColor,
                  textShadow: theme.textShadow,
                  textAlign: theme.textAlign as any,
                  lineHeight: '1.5',
                  maxWidth: '90%',
                  whiteSpace: 'pre-wrap',
                  fontWeight: theme.fontWeight || (currentSlide.type === 'chorus' ? 'bold' : 'normal'),
            }}
          >
            {currentSlide.content}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide indicator (small, at bottom) */}
      {presentationSettings.showPagination && slides && slides.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              style={{
                width: slide.id === presentation?.current_slide_id ? '2rem' : '0.5rem',
                height: '0.5rem',
                borderRadius: '0.25rem',
                backgroundColor: theme.textColor,
                opacity: slide.id === presentation?.current_slide_id ? 1 : 0.3,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* No content message */}
      </div>
      {(!slides || slides.length === 0) && (
        <div
          style={{
            color: theme.textColor,
            fontSize: '2rem',
            opacity: 0.5,
            textAlign: 'center',
          }}
        >
          <p>Aguardando letra...</p>
          <p style={{ fontSize: '1rem', marginTop: '1rem' }}>
            Selecione uma música na janela principal
          </p>
        </div>
      )}
    </div>
  );
}
