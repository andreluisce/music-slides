import { Slide } from '../../../main/shared/types';

export {};

declare global {
  interface Window {
    api?: {
      openLyricsWindow: (url?: string, filePath?: string, isDefault?: boolean) => Promise<void> | void;
      getPath: (name: string) => Promise<string>;
      getAllLocalSongs: () => Promise<string[]>;
      getDefaultSlides: () => Promise<string[]>;
      getBackgroundVideos: () => Promise<string[]>;
      findLyrics: (searchType: string, artist: string, title: string) => Promise<any>;
      getLyricByFilePath: (filePath: string, isDefault?: boolean) => Promise<Slide[]>;
      getLyricByUrlHandle: (url: string) => Promise<Slide[]>;
      onSlideClicked: (cb: (idx: number) => void) => void;
      onSlideClickedIndex: (cb: (idx: number) => void) => void;
      onSelectedVideoBackground: (cb: (videoPath: string) => void) => void;
      onLoadedLyrics: (cb: (lyrics: Slide[]) => void) => void;
      selectVideoBackground: (windowId: number, videoPath: string) => void;
      setActiveSlide: (windowId: number, index: number) => void;
      focusTargetWindow: (windowId: number) => void;
      getSetting: (key: string) => Promise<any> | any;
      setSetting: (key: string, value: any) => Promise<void> | void;
      // CRUD operations
      saveSong: (artist: string, title: string, lyrics: string, metadata?: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      updateSong: (artist: string, title: string, lyrics: string, metadata?: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      deleteSong: (artist: string, title: string) => Promise<{ success: boolean; error?: string }>;
      readSong: (artist: string, title: string) => Promise<{ success: boolean; lyrics?: string; metadata?: any; error?: string }>;
      // AI features
      advancedLyricsSearch: (userQuery: string) => Promise<{
        title: string;
        artist: string;
        lyrics: string;
        source: string;
        metadata?: any;
      } | null>;
      suggestThemeColors: (lyrics: string) => Promise<any>;
      suggestBibleVerses: (lyrics: string, theme?: string) => Promise<any>;
      suggestBackgroundMedia: (lyrics: string) => Promise<string[]>;
      searchPexelsImages: (query: string) => Promise<any>;
      searchPexelsVideos: (query: string) => Promise<any>;
      suggestFontPairing: (genre: string, mood: string) => Promise<{ titleFont: string; bodyFont: string }>;
      discoverSongs: (query: string) => Promise<{ title: string; artist: string }[]>;
      generateChords: (lyrics: string) => Promise<string>;
      getBibleVerse: (book: string, chapter: number, verse: number, version: string) => Promise<any>;
      getVideoBase64: (videoPath: string) => Promise<string | null>;
      setCustomBackground: (windowId: number, background: any) => void;
      updateLyricsTheme: (windowId: number, themeData: any) => void;
      onCustomBackground: (cb: (background: any) => void) => void;
      onThemeUpdate: (cb: (themeData: any) => void) => void;
      reportRendererError: (errorDetails: any) => void;
      // Video Player
      openVideoPlayerWindow: () => void;
      playVideo: () => void;
      pauseVideo: () => void;
      stopVideo: () => void;
      seekVideo: (data: { time: number }) => void;
      setVideoVolume: (data: { volume: number }) => void;
      loadVideoInPlayer: (data: { url: string }) => void;
      sendVideoTimeUpdate: (data: { currentTime: number; duration: number }) => void;
      onVideoPlay: (cb: () => void) => void;
      onVideoPause: (cb: () => void) => void;
      onVideoStop: (cb: () => void) => void;
      onVideoSeek: (cb: (event: any, data: { time: number }) => void) => void;
      onVideoVolume: (cb: (event: any, data: { volume: number }) => void) => void;
      onLoadVideo: (cb: (event: any, data: { url: string }) => void) => void;
      onVideoTimeUpdate: (cb: (event: any, data: { currentTime: number; duration: number }) => void) => void;
    };
  }
}
