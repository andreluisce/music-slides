'use client';
import { useEffect, useState } from 'react';
import { useStageMode } from './hooks/useStageMode';
import { motion, AnimatePresence } from 'framer-motion';
import DockTabs from './components/DockTabs';
import LibraryPanel from './components/LibraryPanel';
import PresentationsPanel from './components/music-library/panels/PresentationPanel';
import OnboardingPanel from './components/OnboardingPanel';
import SettingsPanel from './components/SettingsPanel';
import HelpPanel from './components/HelpPanel';
import TopBar from './components/TopBar';
import { api } from './lib/electron-api';


export default function App() {
  const { mode, setMode } = useStageMode();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        if (!(window as any).api?.isElectron()) {
          console.warn('⚠️  Not running in Electron environment');
          const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';
          if (!hasCompletedOnboarding) {
            setMode('onboarding');
          } else {
            setMode('library');
          }
          setIsChecking(false);
          return;
        }

        const onboardingCompleted = await (window.api as any).getSetting('onboardingCompleted');

        if (!onboardingCompleted) {
          setMode('onboarding');
        } else if (mode === 'onboarding') {
          setMode('library');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setMode('library');
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, []);

  const handleOnboardingComplete = () => {
    setMode('library');
  };

  const Panel = {
    library: () => <LibraryPanel />,
    songs: () => <LibraryPanel />,
    videos: () => <LibraryPanel />,
    images: () => <LibraryPanel />,
    bible: () => <LibraryPanel />,
    themes: () => <LibraryPanel />,
    presentations: () => <PresentationsPanel />,
    editor: () => <PresentationsPanel />,
    stage: () => <PresentationsPanel />,
    live: () => <PresentationsPanel />,
    settings: SettingsPanel,
    help: () => <HelpPanel />,
    onboarding: () => <OnboardingPanel onComplete={handleOnboardingComplete} />,
    palco: () => <PresentationsPanel />,
    editar: () => <PresentationsPanel />,
    mostrar: () => <LibraryPanel />,
  }[mode] || (() => <LibraryPanel />);

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-bg text-white">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-magenta border-t-transparent mx-auto"></div>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (mode === 'onboarding') {
    return (
      <div className="flex h-screen w-full flex-col bg-dark-bg text-white overflow-hidden">
        <OnboardingPanel onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-dark-bg text-white overflow-hidden">
      <TopBar />
      <AnimatePresence mode="wait">
        <motion.main
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
          }}
          className="flex-1 overflow-auto bg-dark-elevated"
        >
          <Panel />
        </motion.main>
      </AnimatePresence>
      <DockTabs />
    </div>
  );
}