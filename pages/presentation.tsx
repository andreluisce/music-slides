import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Presentation, Slide } from '../lib/supabase';

// --- New Imports for Kinetic Lyrics ---
import KineticSlide from '../components/kinetic-lyrics/KineticSlide';
import type { KineticConfig } from '../components/kinetic-lyrics/KineticSlide';
import type { ThemeProperties } from '../components/dialogs/ThemeEditorModal';

// --- Default States and Types ---
const DEFAULT_THEME: ThemeProperties = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 80,
  fontWeight: 700,
  textColor: '#ffffff',
  backgroundColor: '#000000',
  textAlign: 'center',
  textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
  transition: {
    type: 'fade',
    duration: 500,
  },
};

interface Background {
  type: 'image' | 'video';
  path: string;
}

export default function PresentationPage() {
  const getPresentationIdFromUrl = () => new URLSearchParams(window.location.search).get('presentationId');

  const presentationId = getPresentationIdFromUrl();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [songInfo, setSongInfo] = useState({ title: '', artist: '' });
  const [background, setBackground] = useState<Background | null>(null);
  const [theme, setTheme] = useState<ThemeProperties>(DEFAULT_THEME);

  // --- Data Fetching and IPC Listeners ---
  useEffect(() => {
    const api = (window as any).api;
    if (!api) return;

    const cleanups: Array<(() => void) | undefined> = [];

    cleanups.push(api.presentation.onLoadedLyrics?.((data: any) => data?.slides && setSlides(data.slides)));
    cleanups.push(api.presentation.onThemeUpdate?.((themeData: any) => setTheme(themeData || DEFAULT_THEME)));
    cleanups.push(api.presentation.onCustomBackground?.((bg: Background) => setBackground(bg)));
    cleanups.push(api.presentation.onSongInfo?.((info: { artist: string; title: string }) => setSongInfo(info)));
    cleanups.push(api.presentation.onControlReceived?.((data: { action: string; data?: any }) => {
      if (data.action === 'slide' && data.data?.index !== undefined && slides) {
        const slide = slides[data.data.index];
        if (slide) setPresentation(prev => ({ ...(prev as Presentation), current_slide_id: slide.id }));
      }
      if (data.action === 'clear') setSlides([]);
      if (data.action === 'restart' && data.data?.slides) setSlides(data.data.slides);
    }));

    return () => {
      cleanups.forEach(cleanup => cleanup?.());
    };
  }, [slides]);

  // --- Logic to determine current slide and styles ---
  const currentSlideIndex = presentation?.current_slide_id && slides ? slides.findIndex(slide => slide.id === presentation.current_slide_id) : 0;
  const currentSlide = slides?.[currentSlideIndex ?? -1];

  const themeKineticConfig = (theme as any)?.kinetic as KineticConfig | undefined;
  const slideKineticConfig = (currentSlide as any)?.settings?.kinetic as KineticConfig | undefined;
  const finalKineticConfig: KineticConfig | null = slideKineticConfig || themeKineticConfig || null;

  const transition = theme?.transition || DEFAULT_THEME.transition;
  const transitionDuration = (transition.duration || 500) / 1000;

  const getAnimationVariants = () => {
    const { type, direction } = transition;
    switch (type) {
      case 'slide':
        const x = direction === 'right' ? -100 : direction === 'left' ? 100 : 0;
        const y = direction === 'up' ? 100 : direction === 'down' ? -100 : 0;
        const exitX = direction === 'right' ? 100 : direction === 'left' ? -100 : 0;
        const exitY = direction === 'up' ? -100 : direction === 'down' ? 100 : 0;
        return { initial: { opacity: 0, x, y }, animate: { opacity: 1, x: 0, y: 0 }, exit: { opacity: 0, x: exitX, y: exitY } };
      case 'zoom':
        return { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.2 } };
      case 'scale':
        return { initial: { opacity: 0, scale: 0 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0 } };
      case 'fade':
      default:
        return { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } };
    }
  };
  const animationVariants = getAnimationVariants();

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: finalKineticConfig ? '#000' : theme.backgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
      {!finalKineticConfig && background && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {background.type === 'video' ? <video src={`file://${background.path}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay loop muted playsInline /> : <img src={`file://${background.path}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Background" />}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode='wait'>
          {currentSlide && (
            finalKineticConfig ? (
              <KineticSlide key={currentSlide.id} text={currentSlide.content || ''} config={finalKineticConfig} />
            ) : (
              <motion.div
                key={currentSlide.id}
                initial={animationVariants.initial}
                animate={animationVariants.animate}
                exit={animationVariants.exit}
                transition={{ duration: transitionDuration }}
                style={{ fontSize: `${theme.fontSize}px`, fontFamily: theme.fontFamily, color: theme.textColor, textShadow: theme.textShadow, textAlign: theme.textAlign as any, lineHeight: '1.5', maxWidth: '90%', whiteSpace: 'pre-wrap', fontWeight: theme.fontWeight }}
              >
                {currentSlide.content}
              </motion.div>
            )
          )}
        </AnimatePresence>

        {(!slides || slides.length === 0) && (
          <div style={{ color: theme.textColor, fontSize: '2rem', opacity: 0.5, textAlign: 'center' }}>
            <p>Aguardando letra...</p>
          </div>
        )}
      </div>
    </div>
  );
}