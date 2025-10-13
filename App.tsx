'use client';
import { useEffect, useState } from 'react';
import { useStageMode } from './hooks/useStageMode';
import { motion, AnimatePresence } from 'framer-motion';
import DockTabs from './components/DockTabs';
import LibraryPanel from './components/LibraryPanel';
import PresentationsPanel from './components/PresentationsPanel';
import OnboardingPanel from './components/OnboardingPanel';
import SettingsPanel from './components/SettingsPanel';
import HelpPanel from './components/HelpPanel';
import TopBar from './components/TopBar';


export default function App() {
  const { mode, setMode } = useStageMode();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // Check if we're in Electron environment
        if (!(window as any).api?.getSetting) {
          console.warn('Not running in Electron environment');

          // In browser mode, check localStorage for testing
          const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';

          if (!hasCompletedOnboarding) {
            console.log('🎯 Showing onboarding in browser mode');
            setMode('onboarding');
          } else {
            setMode('mostrar');
          }

          setIsChecking(false);
          return;
        }

        const onboardingCompleted = await (window as any).api.getSetting('onboardingCompleted');

        if (!onboardingCompleted) {
          setMode('onboarding');
        } else if (mode === 'onboarding') {
          // If onboarding is complete but mode is still onboarding, switch to default
          setMode('mostrar');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, show main app
        setMode('mostrar');
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
    // Library sections
    library: () => <LibraryPanel />,
    songs: () => <LibraryPanel />,
    videos: () => <LibraryPanel />,
    images: () => <LibraryPanel />,
    bible: () => <LibraryPanel />,
    themes: () => <LibraryPanel />,

    // Presentations sections
    presentations: () => <PresentationsPanel />,
    editor: () => <PresentationsPanel />,
    stage: () => <PresentationsPanel />,
    live: () => <PresentationsPanel />,

    // System
    settings: SettingsPanel,
    help: () => <HelpPanel />,
    onboarding: () => <OnboardingPanel onComplete={handleOnboardingComplete} />,

    // Legacy fallbacks
    palco: () => <PresentationsPanel />,
    editar: () => <PresentationsPanel />,
    mostrar: () => <LibraryPanel />,
  }[mode] || (() => <LibraryPanel />);

  // Show loading state while checking onboarding
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

  // If in onboarding mode, show full-screen onboarding without TopBar and DockTabs
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