
import { create } from 'zustand';
import { Presentation } from '../lib/presentation-types';

type StageMode = 'library' | 'editor' | 'stage' | 'videos' | 'bible' | 'themes' | 'settings' | 'onboarding' | 'live' | 'help';

interface CurrentSong {
  title: string;
  artist: string;
  filePath?: string;
  lyrics?: string;
}

export const useStageMode = create<{
  mode: StageMode;
  setMode: (mode: StageMode) => void;
  currentSong: CurrentSong | null;
  setCurrentSong: (song: CurrentSong | null) => void;
  selectedPresentation: Presentation | null;
  setSelectedPresentation: (presentation: Presentation | null) => void;
}>((set) => ({
  mode: 'library',
  setMode: (mode) => set({ mode }),
  currentSong: null,
  setCurrentSong: (song) => set({ currentSong: song }),
  selectedPresentation: null,
  setSelectedPresentation: (presentation) => set({ selectedPresentation: presentation }),
}));
