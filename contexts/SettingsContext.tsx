import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/electron-api';

export interface AppSettings {
  language: string;
  use24Hour: boolean;
  dataPath: string;
  lyricsPath: string;
  imagesPath: string;
  videosPath: string;
  // Presentation settings
  showPagination: boolean;
  showLogo: boolean;
  logoPath?: string;
  // Animation settings
  transitionType: 'fade' | 'slide' | 'zoom';
  transitionSpeed: number; // 0-100
  // Theme settings
  darkMode: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  selectDataPath: () => Promise<void>;
  selectLyricsPath: () => Promise<void>;
  selectImagesPath: () => Promise<void>;
  selectVideosPath: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  language: 'pt-BR',
  use24Hour: false,
  dataPath: 'Documents/LyricsShow',
  lyricsPath: 'Documents/LyricsShow/songs',
  imagesPath: 'Documents/LyricsShow/images',
  videosPath: 'Documents/LyricsShow/videos',
  // Presentation defaults
  showPagination: false,
  showLogo: false,
  logoPath: undefined,
  // Animation defaults
  transitionType: 'fade',
  transitionSpeed: 33,
  // Theme defaults
  darkMode: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await api.settings.getAll();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Apply dark mode class to HTML element
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    try {
      await api.settings.update(key as string, value);
      setSettings(prev => ({ ...prev, [key]: value }));
      console.log(`✅ Setting '${key}' updated`);
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      throw error;
    }
  };

  const selectDataPath = async () => {
    try {
      const result = await api.settings.selectDataPath();
      if (result && !result.canceled) {
        await updateSetting('dataPath', result.filePath);
      }
    } catch (error) {
      console.error('Error selecting data path:', error);
      throw error;
    }
  };

  const selectLyricsPath = async () => {
    try {
      const result = await api.settings.selectLyricsPath();
      if (result && !result.canceled) {
        await updateSetting('lyricsPath', result.filePath);
      }
    } catch (error) {
      console.error('Error selecting lyrics path:', error);
      throw error;
    }
  };

  const selectImagesPath = async () => {
    try {
      const result = await api.settings.selectImagesPath();
      if (result && !result.canceled) {
        await updateSetting('imagesPath', result.filePath);
      }
    } catch (error) {
      console.error('Error selecting images path:', error);
      throw error;
    }
  };

  const selectVideosPath = async () => {
    try {
      const result = await api.settings.selectVideosPath();
      if (result && !result.canceled) {
        await updateSetting('videosPath', result.filePath);
      }
    } catch (error) {
      console.error('Error selecting videos path:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        selectDataPath,
        selectLyricsPath,
        selectImagesPath,
        selectVideosPath
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
