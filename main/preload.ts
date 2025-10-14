import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Presentation Window
  openPresentationWindow: (artist: string, title: string, filePath?: string) =>
    ipcRenderer.invoke('open-presentation-window', { artist, title, filePath }),
  closePresentationWindow: () => ipcRenderer.invoke('close-presentation-window'),
  sendPresentationSlideChange: (slideIndex: number) =>
    ipcRenderer.send('presentation-slide-change', slideIndex),
  sendPresentationThemeUpdate: (themeData: any) =>
    ipcRenderer.send('presentation-theme-update', themeData),

  setFullscreen: () => ipcRenderer.send('set-fullscreen'),

  clearScreen: () => ipcRenderer.send('clear-screen'),

  // System paths
  getPath: (name: string) => ipcRenderer.invoke('get-path', { name }),

  // Songs
  getAllLocalSongs: () => ipcRenderer.invoke('get-all-local-songs'),
  getDefaultSlides: () => ipcRenderer.invoke('get-default-slides'),

  // Presentations
  getAllPresentations: () => ipcRenderer.invoke('get-all-presentations'),
  createPresentation: (presentation: any) => ipcRenderer.invoke('create-presentation', presentation),
  getPresentationItems: (presentationId: string) => ipcRenderer.invoke('get-presentation-items', presentationId),
  updatePresentation: (id: string, updates: any) => ipcRenderer.invoke('update-presentation', id, updates),
  updatePresentationCurrentSlide: (presentationId: string, slideId: string) =>
    ipcRenderer.invoke('update-presentation-current-slide', presentationId, slideId),

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

  // Presentation Controls
  sendPresentation: (action: string, data?: any) => {
    ipcRenderer.send('presentation-action', { action, data });
  },

  // Dialogs
  openThemeDialog: () => ipcRenderer.invoke('dialog-theme'),
  openBackgroundDialog: () => ipcRenderer.invoke('dialog-background'),
  openTransitionDialog: () => ipcRenderer.invoke('dialog-transition'),

  // Control interface
  sendControl: (action: string, data?: any) => {
    ipcRenderer.send('presentation-control', { action, data });
  },

  // Window interactions
  focusTargetWindow: (windowId: number) => {
    ipcRenderer.send('focus-target-window', { windowId });
  },
  selectVideoBackground: (windowId: number, video: string) => {
    ipcRenderer.send('select-video-background', { windowId, video });
  },
  setCustomBackground: (background: { type: string; path: string }) => {
    ipcRenderer.send('presentation-control', { action: 'background', data: background });
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

  onControlReceived: (callback: (data: { action: string; data?: any }) => void) => {
    const listener = (_: IpcRendererEvent, data: { action: string; data?: any }) => callback(data);
    ipcRenderer.on('presentation-control', listener);
    return () => ipcRenderer.removeListener('presentation-control', listener);
  },
  
  // Add handler for slide changes
  onSlideChanged: (callback: (idx: number) => void) => {
    const listener = (_: IpcRendererEvent, idx: number) => callback(idx);
    ipcRenderer.on('presentation-slide-change', listener);
    return () => ipcRenderer.removeListener('presentation-slide-change', listener);
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
  onSongInfo: (callback: (info: { artist: string; title: string }) => void) => {
    const listener = (_: IpcRendererEvent, info: { artist: string; title: string }) => callback(info);
    ipcRenderer.on('song-info', listener);
    return () => ipcRenderer.removeListener('song-info', listener);
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
  onFormatLyricsProgress: (callback: (message: string) => void) => {
    const listener = (_: IpcRendererEvent, message: string) => callback(message);
    ipcRenderer.on('format-lyrics-progress', listener);
    return () => ipcRenderer.removeListener('format-lyrics-progress', listener);
  },
  onSuggestThemeColorsProgress: (callback: (message: string) => void) => {
    const listener = (_: IpcRendererEvent, message: string) => callback(message);
    ipcRenderer.on('suggest-theme-colors-progress', listener);
    return () => ipcRenderer.removeListener('suggest-theme-colors-progress', listener);
  },
  onSuggestBibleVersesProgress: (callback: (message: string) => void) => {
    const listener = (_: IpcRendererEvent, message: string) => callback(message);
    ipcRenderer.on('suggest-bible-verses-progress', listener);
    return () => ipcRenderer.removeListener('suggest-bible-verses-progress', listener);
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
