import { ipcRenderer } from 'electron';

import { supabaseLyricsApi, progressApi } from './supabase-lyrics';
import { advancedFeaturesApi } from './advanced-features';

export const lyricsIntegrationApi = {
  // Cache management
  cache: {
    getStats: () => ipcRenderer.invoke('lyrics-cache:get-stats'),
    clear: () => ipcRenderer.invoke('lyrics-cache:clear'),
  },

  // Analytics
  analytics: {
    getStats: () => ipcRenderer.invoke('lyrics-analytics:get-stats'),
    export: () => ipcRenderer.invoke('lyrics-analytics:export'),
    clear: () => ipcRenderer.invoke('lyrics-analytics:clear'),
    getEvents: (startTime: number, endTime: number) => 
      ipcRenderer.invoke('lyrics-analytics:get-events', { startTime, endTime }),
  },

  // Music library integration
  musicLibrary: {
    getLyrics: (song: any) => ipcRenderer.invoke('music-library:get-lyrics', song),
    batchGetLyrics: (songs: any[]) => ipcRenderer.invoke('music-library:batch-get-lyrics', songs),
    autoFillLyrics: (songs?: any[]) => ipcRenderer.invoke('music-library:auto-fill-lyrics', songs),
    searchAndReplaceLyrics: (song: any) => ipcRenderer.invoke('music-library:search-and-replace-lyrics', song),
    getStats: () => ipcRenderer.invoke('music-library:get-lyrics-stats'),
    startAutoProcessing: () => ipcRenderer.invoke('music-library:start-auto-processing'),
    stopAutoProcessing: () => ipcRenderer.invoke('music-library:stop-auto-processing'),
    addToQueue: (songs: any[]) => ipcRenderer.invoke('music-library:add-to-queue', songs),
  },

  // Supabase integration
  supabase: supabaseLyricsApi,

  // Progress notifications
  progress: progressApi,

  // Advanced features
  advanced: advancedFeaturesApi
};