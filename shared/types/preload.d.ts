import type { IpcRendererEvent } from 'electron';

declare global {
  interface Window {
    api: {
      presentation: {
        openPresentationWindow: (artist: string, title: string, filePath?: string) => Promise<void>;
        closePresentationWindow: () => Promise<void>;
        sendPresentationSlideChange: (slideIndex: number) => void;
        sendPresentationThemeUpdate: (themeData: any) => void;
        setFullscreen: () => void;
        clearScreen: () => void;
        sendPresentation: (action: string, data?: any) => void;
        sendControl: (action: string, data?: any) => void;
        setCustomBackground: (background: { type: string; path: string }) => void;
        setActiveSlide: (windowId: number, index: number) => void;
        updateLyricsTheme: (windowId: number, themeData: any) => void;
        onSlideClicked: (callback: (idx: number) => void) => () => void;
        onControlReceived: (callback: (data: { action: string; data?: any }) => void) => () => void;
        onSlideChanged: (callback: (idx: number) => void) => () => void;
        onSlideClickedIndex: (callback: (idx: number) => void) => () => void;
        onSelectedVideoBackground: (callback: (videoPath: string) => void) => () => void;
        onLoadedLyrics: (callback: (lyrics: string[]) => void) => () => void;
        onSongInfo: (callback: (info: { artist: string; title: string }) => void) => () => void;
        onCustomBackground: (callback: (background: any) => void) => () => void;
        onThemeUpdate: (callback: (themeData: any) => void) => () => void;
        onTransitionUpdate: (callback: (data: any) => void) => () => void;
      };
      system: {
        getPath: (name: string) => Promise<string>;
      };
      songs: {
        getAllLocalSongs: () => Promise<any[]>;
        getDefaultSlides: () => Promise<any[]>;
        saveSong: (artist: string, title: string, lyrics: string, metadata?: any) => Promise<void>;
        updateSong: (artist: string, title: string, lyrics: string, metadata?: any) => Promise<void>;
        deleteSong: (artist: string, title: string) => Promise<void>;
        readSong: (artist: string, title: string) => Promise<any>;
        findLyrics: (searchType: string, artist: string, title: string) => Promise<any>;
        getLyricByUrlHandle: (url: string) => Promise<any>;
        getLyricByFilePath: (filePath: string, isDefault?: boolean) => Promise<any>;
        getAdvancedSongAnalysis: (artist: string, title: string, estimatedDuration?: number) => Promise<any>;
        updateSongAnalysis: (artist: string, title: string, analysis: any) => Promise<void>;
        generateAdvancedMetadata: (artist: string, title: string, lyrics: string, estimatedDuration?: number) => Promise<any>;
      };
      presentations: {
        getAllPresentations: () => Promise<any[]>;
        createPresentation: (presentation: any) => Promise<void>;
        getPresentationItems: (presentationId: string) => Promise<any[]>;
        updatePresentation: (id: string, updates: any) => Promise<void>;
        updatePresentationCurrentSlide: (presentationId: string, slideId: string) => Promise<void>;
      };
      video: {
        getBackgroundVideos: () => Promise<any[]>;
        getVideoBase64: (videoPath: string) => Promise<string>;
        openVideoPlayerWindow: () => void;
        playVideo: () => void;
        pauseVideo: () => void;
        stopVideo: () => void;
        seekVideo: ({ time }: { time: number }) => void;
        setVideoVolume: ({ volume }: { volume: number }) => void;
        loadVideoInPlayer: ({ url }: { url: string }) => void;
        sendVideoTimeUpdate: ({ currentTime, duration }: { currentTime: number; duration: number }) => void;
        onVideoPlay: (callback: () => void) => () => void;
        onVideoPause: (callback: () => void) => () => void;
        onVideoStop: (callback: () => void) => () => void;
        onVideoSeek: (callback: (event: IpcRendererEvent, data: { time: number }) => void) => () => void;
        onVideoVolume: (callback: (event: IpcRendererEvent, data: { volume: number }) => void) => () => void;
        onLoadVideo: (callback: (event: IpcRendererEvent, data: { url: string }) => void) => () => void;
        onVideoTimeUpdate: (callback: (event: IpcRendererEvent, data: { currentTime: number; duration: number }) => void) => () => void;
      };
      bible: {
        getBibleVerse: (book: string, chapter: number, verse: number, version: string) => Promise<any>;
      };
      ai: {
        advancedLyricsSearch: (userQuery: string) => Promise<any>;
        fastLyricsSearch: (userQuery: string) => Promise<any>;
        fetchLyricsByUrl: (url: string, source: string) => Promise<any>;
        suggestThemeColors: (lyrics: string) => Promise<any>;
        suggestBibleVerses: (lyrics: string, theme?: string) => Promise<any>;
        suggestTheme: () => Promise<any>;
        suggestBackgroundMedia: (lyrics: string) => Promise<any>;
        searchPexelsImages: (query: string) => Promise<any>;
        searchPexelsVideos: (query: string) => Promise<any>;
        suggestFontPairing: (genre: string, mood: string) => Promise<any>;
        discoverSongs: (query: string) => Promise<any>;
        generateChords: (lyrics: string) => Promise<any>;
        onSearchProgress: (callback: (message: string) => void) => () => void;
        onFormatLyricsProgress: (callback: (message: string) => void) => () => void;
        onSuggestThemeColorsProgress: (callback: (message: string) => void) => () => void;
        onSuggestBibleVersesProgress: (callback: (message: string) => void) => () => void;
      };
      settings: {
        getSetting: (key: string) => Promise<any>;
        setSetting: (key: string, value: any) => Promise<void>;
        getSettings: () => Promise<any>;
        updateSetting: (key: string, value: any) => Promise<void>;
        updateSettings: (settings: any) => Promise<void>;
        selectDataPath: () => Promise<string>;
        selectLyricsPath: () => Promise<string>;
        selectImagesPath: () => Promise<string>;
        selectVideosPath: () => Promise<string>;
      };
      dialogs: {
        openThemeDialog: () => Promise<void>;
        openBackgroundDialog: () => Promise<void>;
        openTransitionDialog: () => Promise<void>;
      };
      sync: {
        getUnifiedSongList: () => Promise<any[]>;
        performFullSync: (options?: any) => Promise<void>;
        syncSongToCloud: (artist: string, title: string) => Promise<void>;
        syncSongFromCloud: (artist: string, title: string) => Promise<void>;
      };
      error: {
        reportRendererError: (errorDetails: any) => void;
      };
      // Add a generic onIpc helper for consistency
      onIpc: <T>(channel: string, callback: (data: T) => void) => () => void;
    };
  }
}