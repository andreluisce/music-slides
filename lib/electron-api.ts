/**
 * Electron API wrapper with fallback for non-Electron environments
 *
 * This module provides a unified API that works both in Electron and standalone mode (Vite dev/browser).
 * When running in Electron, it uses window.api exposed by preload.
 * When running standalone, it provides mock implementations or throws helpful errors.
 */

import type { AppSettings } from '../contexts/SettingsContext';

// Type definition for window.api (matches preload.ts structure)
type ElectronAPI = {
  // Direct legacy methods (for backwards compatibility)
  getSetting?: (key: string) => Promise<any>;
  setSetting?: (key: string, value: any) => Promise<void>;
  updateSettings?: (settings: Partial<AppSettings>) => Promise<void>;
  selectDataPath?: () => Promise<{ canceled: boolean; filePath: string }>;

  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    getAll: () => Promise<AppSettings>;
    update: (key: string, value: any) => Promise<void>;
    updateAll: (settings: Partial<AppSettings>) => Promise<void>;
    selectDataPath: () => Promise<{ canceled: boolean; filePath: string }>;
    selectLyricsPath: () => Promise<{ canceled: boolean; filePath: string }>;
    selectImagesPath: () => Promise<{ canceled: boolean; filePath: string }>;
    selectVideosPath: () => Promise<{ canceled: boolean; filePath: string }>;
  };
  songs: {
    getUnifiedSongList: () => Promise<any[]>;
    // Add other song methods as needed
  };
  ai?: {
    fastLyricsSearch?: (query: string) => Promise<any[]>;
    fetchLyricsByUrl?: (url: string, source: string) => Promise<any>;
    onSearchProgress?: (callback: (data: any) => void) => () => void;
    // Add other AI methods as needed
  };
  presentation?: {
    open?: (artist: string, title: string, filePath?: string) => Promise<any>;
    close?: () => Promise<void>;
    // Add other presentation methods as needed
  };
  // Legacy methods at top level
  openPresentationWindow?: (artist: string, title: string, filePath?: string) => Promise<any>;
  closePresentationWindow?: () => Promise<void>;
  // Add other API sections as needed
};

// Helper to get typed window.api
const getWindowApi = (): ElectronAPI | undefined => {
  if (typeof window === 'undefined') return undefined;
  return (window as any).api as ElectronAPI | undefined;
};

// Check if running in Electron environment
export const isElectronEnvironment = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).api;
};

// Default settings for fallback mode
const defaultSettings: AppSettings = {
  language: 'pt-BR',
  use24Hour: false,
  dataPath: 'Documents/LyricsShow',
  lyricsPath: 'Documents/LyricsShow/songs',
  imagesPath: 'Documents/LyricsShow/images',
  videosPath: 'Documents/LyricsShow/videos',
  showPagination: false,
  showLogo: false,
  logoPath: undefined,
  transitionType: 'fade',
  transitionSpeed: 33,
};

// Settings API
export const settingsApi = {
  get: async (key: string): Promise<any> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.settings?.get) {
      return windowApi.settings.get(key);
    }
    console.warn('⚠️  Running in standalone mode, using default settings');
    return defaultSettings[key as keyof AppSettings];
  },

  set: async (key: string, value: any): Promise<void> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.settings?.set) {
      return windowApi.settings.set(key, value);
    }
    console.warn('⚠️  Running in standalone mode, setting not persisted:', { key, value });
  },

  getAll: async (): Promise<AppSettings> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.settings?.getAll) {
      return windowApi.settings.getAll();
    }
    console.warn('⚠️  Running in standalone mode, using default settings');
    return defaultSettings;
  },

  update: async (key: string, value: any): Promise<void> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.settings?.update) {
      return windowApi.settings.update(key, value);
    }
    console.warn('⚠️  Running in standalone mode, setting not persisted:', { key, value });
  },

  updateAll: async (settings: Partial<AppSettings>): Promise<void> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.settings?.updateAll) {
      return windowApi.settings.updateAll(settings);
    }
    console.warn('⚠️  Running in standalone mode, settings not persisted:', settings);
  },

  selectDataPath: async (): Promise<{ canceled: boolean; filePath: string }> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.settings?.selectDataPath) {
      return windowApi.settings.selectDataPath();
    }
    console.warn('⚠️  Running in standalone mode, file dialog not available');
    return { canceled: true, filePath: '' };
  },

  selectLyricsPath: async (): Promise<{ canceled: boolean; filePath: string }> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.settings?.selectLyricsPath) {
      return windowApi.settings.selectLyricsPath();
    }
    console.warn('⚠️  Running in standalone mode, file dialog not available');
    return { canceled: true, filePath: '' };
  },

  selectImagesPath: async (): Promise<{ canceled: boolean; filePath: string }> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.settings?.selectImagesPath) {
      return windowApi.settings.selectImagesPath();
    }
    console.warn('⚠️  Running in standalone mode, file dialog not available');
    return { canceled: true, filePath: '' };
  },

  selectVideosPath: async (): Promise<{ canceled: boolean; filePath: string }> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.settings?.selectVideosPath) {
      return windowApi.settings.selectVideosPath();
    }
    console.warn('⚠️  Running in standalone mode, file dialog not available');
    return { canceled: true, filePath: '' };
  },
};

// Songs API
export const songsApi = {
  getUnifiedSongList: async (): Promise<any[]> => {
    const windowApi = getWindowApi();
    // getUnifiedSongList is in the sync namespace, not songs
    if (isElectronEnvironment() && (windowApi as any)?.sync?.getUnifiedSongList) {
      return (windowApi as any).sync.getUnifiedSongList();
    }
    console.warn('⚠️  Running in standalone mode, returning empty song list');
    return [];
  },
};

// AI API
export const aiApi = {
  fastLyricsSearch: async (query: string): Promise<any[]> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.ai?.fastLyricsSearch) {
      return windowApi.ai.fastLyricsSearch(query);
    }
    console.warn('⚠️  Running in standalone mode, lyrics search not available');
    return [];
  },

  fetchLyricsByUrl: async (url: string, source: string): Promise<any> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.ai?.fetchLyricsByUrl) {
      return windowApi.ai.fetchLyricsByUrl(url, source);
    }
    console.warn('⚠️  Running in standalone mode, lyrics fetch not available');
    return null;
  },

  onSearchProgress: (callback: (data: any) => void): (() => void) => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.ai?.onSearchProgress) {
      return windowApi.ai.onSearchProgress(callback);
    }
    console.warn('⚠️  Running in standalone mode, search progress not available');
    return () => {}; // Return no-op cleanup function
  },
};

// Legacy direct API methods (for backwards compatibility)
export const legacyApi = {
  getSetting: async (key: string): Promise<any> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.getSetting) {
      return windowApi.getSetting(key);
    }
    if (isElectronEnvironment() && windowApi?.settings?.get) {
      return windowApi.settings.get(key);
    }
    console.warn('⚠️  Running in standalone mode, using default settings');
    return defaultSettings[key as keyof AppSettings];
  },

  setSetting: async (key: string, value: any): Promise<void> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.setSetting) {
      return windowApi.setSetting(key, value);
    }
    if (isElectronEnvironment() && windowApi?.settings?.set) {
      return windowApi.settings.set(key, value);
    }
    console.warn('⚠️  Running in standalone mode, setting not persisted:', { key, value });
  },

  updateSettings: async (settings: Partial<AppSettings>): Promise<void> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.updateSettings) {
      return windowApi.updateSettings(settings);
    }
    if (isElectronEnvironment() && windowApi?.settings?.updateAll) {
      return windowApi.settings.updateAll(settings);
    }
    console.warn('⚠️  Running in standalone mode, settings not persisted:', settings);
  },

  selectDataPath: async (): Promise<{ canceled: boolean; filePath: string }> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.selectDataPath) {
      return windowApi.selectDataPath();
    }
    if (isElectronEnvironment() && windowApi?.settings?.selectDataPath) {
      return windowApi.settings.selectDataPath();
    }
    console.warn('⚠️  Running in standalone mode, file dialog not available');
    return { canceled: true, filePath: '' };
  },
};

// Presentation API
export const presentationApi = {
  open: async (artist: string, title: string, filePath?: string): Promise<any> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.presentation?.open) {
      return windowApi.presentation.open(artist, title, filePath);
    }
    if (isElectronEnvironment() && windowApi?.openPresentationWindow) {
      return windowApi.openPresentationWindow(artist, title, filePath);
    }
    console.warn('⚠️  Running in standalone mode, presentation not available');
    return { success: false, error: 'Not in Electron environment' };
  },

  close: async (): Promise<void> => {
    const windowApi = getWindowApi();
    if (isElectronEnvironment() && windowApi?.presentation?.close) {
      return windowApi.presentation.close();
    }
    if (isElectronEnvironment() && windowApi?.closePresentationWindow) {
      return windowApi.closePresentationWindow();
    }
    console.warn('⚠️  Running in standalone mode, presentation not available');
  },
};

// Export unified API wrapper
const apiWrapper = {
  settings: settingsApi,
  songs: songsApi,
  ai: aiApi,
  presentation: presentationApi,
  isElectron: isElectronEnvironment,
  // Legacy methods for backwards compatibility
  getSetting: legacyApi.getSetting,
  setSetting: legacyApi.setSetting,
  updateSettings: legacyApi.updateSettings,
  selectDataPath: legacyApi.selectDataPath,
  openPresentationWindow: presentationApi.open,
  closePresentationWindow: presentationApi.close,
};

export { apiWrapper as api };
