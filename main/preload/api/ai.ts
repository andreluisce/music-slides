import { ipcRenderer } from 'electron';
import { onIpc, debug } from './utils';

export const ai = {
  advancedLyricsSearch: (userQuery: string) => {
    debug('Sending', 'ai:advanced-lyrics-search', { userQuery });
    return ipcRenderer.invoke('ai:advanced-lyrics-search', { userQuery });
  },
  fastLyricsSearch: (userQuery: string) => {
    debug('Sending', 'ai:fast-lyrics-search', { userQuery });
    return ipcRenderer.invoke('ai:fast-lyrics-search', { userQuery });
  },
  fetchLyricsByUrl: (url: string, source: string) => {
    debug('Sending', 'ai:fetch-lyrics-by-url', { url, source });
    return ipcRenderer.invoke('ai:fetch-lyrics-by-url', { url, source });
  },
  suggestThemeColors: (lyrics: string) => {
    debug('Sending', 'ai:suggest-theme-colors', { lyrics });
    return ipcRenderer.invoke('ai:suggest-theme-colors', { lyrics });
  },
  suggestBibleVerses: (lyrics: string, theme?: string) => {
    debug('Sending', 'ai:suggest-bible-verses', { lyrics, theme });
    return ipcRenderer.invoke('ai:suggest-bible-verses', { lyrics, theme });
  },
  suggestTheme: () => {
    debug('Sending', 'ai:suggest-theme');
    return ipcRenderer.invoke('ai:suggest-theme');
  },
  suggestBackgroundMedia: (lyrics: string) => {
    debug('Sending', 'ai:suggest-background-media', { lyrics });
    return ipcRenderer.invoke('ai:suggest-background-media', { lyrics });
  },
  searchPexelsImages: (query: string) => {
    debug('Sending', 'ai:search-pexels-images', { query });
    return ipcRenderer.invoke('ai:search-pexels-images', { query });
  },
  searchPexelsVideos: (query: string) => {
    debug('Sending', 'ai:search-pexels-videos', { query });
    return ipcRenderer.invoke('ai:search-pexels-videos', { query });
  },
  suggestFontPairing: (genre: string, mood: string) => {
    debug('Sending', 'ai:suggest-font-pairing', { genre, mood });
    return ipcRenderer.invoke('ai:suggest-font-pairing', { genre, mood });
  },
  discoverSongs: (query: string) => {
    debug('Sending', 'ai:discover-songs', { query });
    return ipcRenderer.invoke('ai:discover-songs', { query });
  },
  generateChords: (lyrics: string) => {
    debug('Sending', 'ai:generate-chords', { lyrics });
    return ipcRenderer.invoke('ai:generate-chords', { lyrics });
  },

  onSearchProgress: (callback: (message: string) => void) => {
    debug('Setting up listener for', 'ai:on-search-progress');
    return onIpc<string>('ai:on-search-progress', callback);
  },
  onFormatLyricsProgress: (callback: (message: string) => void) => {
    debug('Setting up listener for', 'ai:on-format-lyrics-progress');
    return onIpc<string>('ai:on-format-lyrics-progress', callback);
  },
  onSuggestThemeColorsProgress: (callback: (message: string) => void) => {
    debug('Setting up listener for', 'ai:on-suggest-theme-colors-progress');
    return onIpc<string>('ai:on-suggest-theme-colors-progress', callback);
  },
  onSuggestBibleVersesProgress: (callback: (message: string) => void) => {
    debug('Setting up listener for', 'ai:on-suggest-bible-verses-progress');
    return onIpc<string>('ai:on-suggest-bible-verses-progress', callback);
  },
};
