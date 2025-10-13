import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Lyrics Window
  openLyricsWindow: (url?: string, filePath?: string, isDefault = false) => {
    ipcRenderer.send('open-lyrics-window', { url, filePath, isDefault });
  },
  closeLyricsWindow: () => {
    ipcRenderer.send('close-lyrics-window');
  },

  // System paths
  getPath: (name: string) => ipcRenderer.invoke('get-path', { name }),

  // Songs
  getAllLocalSongs: () => ipcRenderer.invoke('get-all-local-songs'),
  getDefaultSlides: () => ipcRenderer.invoke('get-default-slides'),

  // CRUD operations
  saveSong: (artist: string, title: string, lyrics: string, metadata?: any) =>
    ipcRenderer.invoke('save-song', { artist, title, lyrics, metadata }),
  updateSong: (artist: string, title: string, lyrics: string, metadata?: any) =>
    ipcRenderer.invoke('update-song', { artist, title, lyrics, metadata }),
  deleteSong: (artist: string, title: string) =>
    ipcRenderer.invoke('delete-song', { artist, title }),
  readSong: (artist: string, title: string) =>
    ipcRenderer.invoke('read-song', { artist, title }),

  // Lyrics search
  findLyrics: (searchType: string, artist: string, title: string) =>
    ipcRenderer.invoke('find-lyrics', { searchType, artist, title }),
  getLyricByUrlHandle: (url: string) => ipcRenderer.invoke('get-lyric-by-url-handle', { url }),
  getLyricByFilePath: (filePath: string, isDefault = false) =>
    ipcRenderer.invoke('get-lyric-by-file-path', { filePath, isDefault }),

  // Background videos
  getBackgroundVideos: () => ipcRenderer.invoke('get-background-videos'),
  getVideoBase64: (videoPath: string) => ipcRenderer.invoke('get-video-base64', { videoPath }),

  // Bible
  getBibleVerse: (book: string, chapter: number, verse: number, version: string) =>
    ipcRenderer.invoke('get-bible-verse', { book, chapter, verse, version }),

  // AI features
  advancedLyricsSearch: (userQuery: string) =>
    ipcRenderer.invoke('advanced-lyrics-search', { userQuery }),
  fastLyricsSearch: (userQuery: string) =>
    ipcRenderer.invoke('fast-lyrics-search', { userQuery }),
  fetchLyricsByUrl: (url: string, source: string) =>
    ipcRenderer.invoke('fetch-lyrics-by-url', { url, source }),
  suggestThemeColors: (lyrics: string) =>
    ipcRenderer.invoke('suggest-theme-colors', { lyrics }),
  suggestBibleVerses: (lyrics: string, theme?: string) =>
    ipcRenderer.invoke('suggest-bible-verses', { lyrics, theme }),
  suggestTheme: () => ipcRenderer.invoke('suggest-theme'),
  suggestBackgroundMedia: (lyrics: string) => ipcRenderer.invoke('suggest-background-media', { lyrics }),
  searchPexelsImages: (query: string) => ipcRenderer.invoke('search-pexels-images', { query }),
  searchPexelsVideos: (query: string) => ipcRenderer.invoke('search-pexels-videos', { query }),
  suggestFontPairing: (genre: string, mood: string) => ipcRenderer.invoke('suggest-font-pairing', { genre, mood }),
  discoverSongs: (query: string) => ipcRenderer.invoke('discover-songs', { query }),
  generateChords: (lyrics: string) => ipcRenderer.invoke('generate-chords', { lyrics }),

  // Advanced Metadata
  getAdvancedSongAnalysis: (artist: string, title: string, estimatedDuration?: number) =>
    ipcRenderer.invoke('get-advanced-song-analysis', { artist, title, estimatedDuration }),
  updateSongAnalysis: (artist: string, title: string, analysis: any) =>
    ipcRenderer.invoke('update-song-analysis', { artist, title, analysis }),
  generateAdvancedMetadata: (artist: string, title: string, lyrics: string, estimatedDuration?: number) =>
    ipcRenderer.invoke('generate-advanced-metadata', { artist, title, lyrics, estimatedDuration }),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('set-setting', { key, value }),

  // Window interactions
  focusTargetWindow: (windowId: number) => {
    ipcRenderer.send('focus-target-window', { windowId });
  },
  selectVideoBackground: (windowId: number, video: string) => {
    ipcRenderer.send('select-video-background', { windowId, video });
  },
  setCustomBackground: (windowId: number, background: any) => {
    ipcRenderer.send('set-custom-background', { windowId, background });
  },
  setActiveSlide: (windowId: number, index: number) => {
    ipcRenderer.send('set-active-slide', { windowId, index });
  },
  updateLyricsTheme: (windowId: number, themeData: any) => {
    ipcRenderer.send('update-lyrics-theme', { windowId, themeData });
  },

  // Event listeners
  onSlideClicked: (callback: (idx: number) => void) => {
    const listener = (_: IpcRendererEvent, idx: number) => callback(idx);
    ipcRenderer.on('slide-clicked', listener);
    return () => ipcRenderer.removeListener('slide-clicked', listener);
  },
  onSlideClickedIndex: (callback: (idx: number) => void) => {
    const listener = (_: IpcRendererEvent, idx: number) => callback(idx);
    ipcRenderer.on('slide-clicked-index', listener);
    return () => ipcRenderer.removeListener('slide-clicked-index', listener);
  },
  onSelectedVideoBackground: (callback: (videoPath: string) => void) => {
    const listener = (_: IpcRendererEvent, videoPath: string) => callback(videoPath);
    ipcRenderer.on('selected-video-background', listener);
    return () => ipcRenderer.removeListener('selected-video-background', listener);
  },
  onLoadedLyrics: (callback: (lyrics: string[]) => void) => {
    const listener = (_: IpcRendererEvent, lyrics: string[]) => callback(lyrics);
    ipcRenderer.on('loaded-lyrics', listener);
    return () => ipcRenderer.removeListener('loaded-lyrics', listener);
  },
  onCustomBackground: (callback: (background: any) => void) => {
    const listener = (_: IpcRendererEvent, background: any) => callback(background);
    ipcRenderer.on('custom-background', listener);
    return () => ipcRenderer.removeListener('custom-background', listener);
  },
  onThemeUpdate: (callback: (themeData: any) => void) => {
    const listener = (_: IpcRendererEvent, themeData: any) => callback(themeData);
    ipcRenderer.on('theme-update', listener);
    return () => ipcRenderer.removeListener('theme-update', listener);
  },
  onSearchProgress: (callback: (message: string) => void) => {
    const listener = (_: IpcRendererEvent, message: string) => callback(message);
    ipcRenderer.on('search-progress', listener);
    return () => ipcRenderer.removeListener('search-progress', listener);
  },

  // Error reporting
  reportRendererError: (errorDetails: any) => {
    ipcRenderer.send('renderer-error', errorDetails);
  },

  // Video Player
  openVideoPlayerWindow: () => {
    ipcRenderer.send('open-video-player-window');
  },
  playVideo: () => {
    ipcRenderer.send('video-play');
  },
  pauseVideo: () => {
    ipcRenderer.send('video-pause');
  },
  stopVideo: () => {
    ipcRenderer.send('video-stop');
  },
  seekVideo: ({ time }: { time: number }) => {
    ipcRenderer.send('video-seek', { time });
  },
  setVideoVolume: ({ volume }: { volume: number }) => {
    ipcRenderer.send('video-volume', { volume });
  },
  loadVideoInPlayer: ({ url }: { url: string }) => {
    ipcRenderer.send('load-video', { url });
  },
  sendVideoTimeUpdate: ({ currentTime, duration }: { currentTime: number; duration: number }) => {
    ipcRenderer.send('video-time-update', { currentTime, duration });
  },

  // Sync Service
  getUnifiedSongList: () => ipcRenderer.invoke('get-unified-song-list'),
  performFullSync: (options?: any) => ipcRenderer.invoke('perform-full-sync', options),
  syncSongToCloud: (artist: string, title: string) =>
    ipcRenderer.invoke('sync-song-to-cloud', { artist, title }),
  syncSongFromCloud: (artist: string, title: string) =>
    ipcRenderer.invoke('sync-song-from-cloud', { artist, title }),

  // Settings & Path Selection
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSetting: (key: string, value: any) => ipcRenderer.invoke('update-setting', { key, value }),
  updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', settings),
  selectDataPath: () => ipcRenderer.invoke('select-data-path'),
  selectLyricsPath: () => ipcRenderer.invoke('select-lyrics-path'),
  selectImagesPath: () => ipcRenderer.invoke('select-images-path'),
  selectVideosPath: () => ipcRenderer.invoke('select-videos-path'),

  // Video Player Event Listeners
  onVideoPlay: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('video-play', listener);
    return () => ipcRenderer.removeListener('video-play', listener);
  },
  onVideoPause: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('video-pause', listener);
    return () => ipcRenderer.removeListener('video-pause', listener);
  },
  onVideoStop: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('video-stop', listener);
    return () => ipcRenderer.removeListener('video-stop', listener);
  },
  onVideoSeek: (callback: (event: any, data: { time: number }) => void) => {
    const listener = (_: IpcRendererEvent, data: { time: number }) => callback(_, data);
    ipcRenderer.on('video-seek', listener);
    return () => ipcRenderer.removeListener('video-seek', listener);
  },
  onVideoVolume: (callback: (event: any, data: { volume: number }) => void) => {
    const listener = (_: IpcRendererEvent, data: { volume: number }) => callback(_, data);
    ipcRenderer.on('video-volume', listener);
    return () => ipcRenderer.removeListener('video-volume', listener);
  },
  onLoadVideo: (callback: (event: any, data: { url: string }) => void) => {
    const listener = (_: IpcRendererEvent, data: { url: string }) => callback(_, data);
    ipcRenderer.on('load-video', listener);
    return () => ipcRenderer.removeListener('load-video', listener);
  },
  onVideoTimeUpdate: (callback: (event: any, data: { currentTime: number; duration: number }) => void) => {
    const listener = (_: IpcRendererEvent, data: { currentTime: number; duration: number }) => callback(_, data);
    ipcRenderer.on('video-time-update', listener);
    return () => ipcRenderer.removeListener('video-time-update', listener);
  },
});
