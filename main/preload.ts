import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Lyrics Window
  openLyricsWindow: (url?: string, filePath?: string, isDefault = false) => {
    ipcRenderer.send('open-lyrics-window', { url, filePath, isDefault });
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
  suggestBibleVerses: (lyrics: string) =>
    ipcRenderer.invoke('suggest-bible-verses', { lyrics }),
  suggestTheme: () => ipcRenderer.invoke('suggest-theme'),

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

  // Error reporting
  reportRendererError: (errorDetails: any) => {
    ipcRenderer.send('renderer-error', errorDetails);
  },
});
