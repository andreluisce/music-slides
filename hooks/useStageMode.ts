
import { create } from 'zustand';

type StageMode = 'mostrar' | 'editar' | 'palco' | 'videos' | 'bible' | 'themes' | 'settings' | 'onboarding' | 'live';

export const useStageMode = create<{
  mode: StageMode;
  setMode: (mode: StageMode) => void;
}>((set) => ({ mode: 'mostrar', setMode: (mode) => set({ mode }) }));
