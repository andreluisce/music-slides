import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretLeft,
  CaretRight,
  Broom,
  ArrowsOut,
  Image as ImageIcon,
  TextT,
  Clock,
  Circle,
  ArrowCounterClockwise,
  PlayCircle,
  PauseCircle,
} from '@phosphor-icons/react';
import { Button } from './ui/button';
import { useStageMode } from '../hooks/useStageMode';
import ThemeDialog from './dialogs/ThemeDialog';
import BackgroundDialog from './dialogs/BackgroundDialog';

// --- Types ---
interface LiveControlSlide {
  id: string;
  content: string;
  type?: 'verse' | 'chorus' | 'bridge';
}

interface Background {
  type: 'image' | 'video';
  path: string;
}

interface BackgroundPreview extends Background {
  previewSrc: string;
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

  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showBackgroundDialog, setShowBackgroundDialog] = useState(false);
  const [currentBackground, setCurrentBackground] = useState<BackgroundPreview | null>(null);

  // ... (useEffect hooks and other functions) ...

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0E0D12] via-[#161622] to-[#0D0C11]">
      {/* ... (Top Bar) ... */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-6">
             {/* ... (Preview Cards) ... */}
          </div>
          {/* ... (Slides Grid) ... */}
        </div>
      </div>
      <div className="flex-shrink-0 h-20 border-t border-purple-500/20 bg-black/60 backdrop-blur-md">
        <div className="h-full flex items-center justify-center gap-3 px-6">
          {/* ... (Live/Nav Controls) ... */}
          <div className="w-px h-10 bg-purple-500/20 mx-2" />
          <Button size="lg" onClick={() => setShowBackgroundDialog(true)} variant="outline" className="bg-slate-800/50 border-slate-600 hover:bg-slate-700 text-white h-14 px-6"><ImageIcon size={20} /><span className="ml-2 text-sm">Fundo</span></Button>
          <Button size="lg" onClick={() => setShowThemeDialog(true)} variant="outline" className="bg-slate-800/50 border-slate-600 hover:bg-slate-700 text-white h-14 px-6"><TextT size={20} /><span className="ml-2 text-sm">Tema</span></Button>
          <div className="w-px h-10 bg-purple-500/20 mx-2" />
          {/* ... (Fullscreen Button) ... */}
        </div>
      </div>
      <AnimatePresence>
        {actionFeedback && <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-50"><div className="bg-magenta text-white px-6 py-3 rounded-full shadow-2xl shadow-magenta/50 flex items-center gap-2 font-semibold">{actionFeedback}</div></motion.div>}
      </AnimatePresence>
      <ThemeDialog isOpen={showThemeDialog} onClose={() => setShowThemeDialog(false)} />
      <BackgroundDialog isOpen={showBackgroundDialog} onClose={() => setShowBackgroundDialog(false)} onSelect={async (background) => { if ((window as any).api) { (window.api as any).presentation.setCustomBackground(background); showFeedback('✓ Fundo atualizado'); } let previewSrc = `file://${background.path}`; if (background.type === 'video' && (window as any).api?.video?.getVideoBase64) { const dataUrl = await (window.api as any).video.getVideoBase64({ videoPath: background.path }); if (dataUrl) { previewSrc = dataUrl; } } setCurrentBackground({ ...background, previewSrc }); setShowBackgroundDialog(false); }} />
    </div>
  );
}
