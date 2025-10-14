import { ipcRenderer } from 'electron';
import { onIpc, debug } from './utils';

export const presentation = {
  open: (artist: string, title: string, filePath?: string) => {
    debug('Sending', 'presentation:open', { artist, title, filePath });
    return ipcRenderer.invoke('presentation:open', { artist, title, filePath });
  },
  close: () => {
    debug('Sending', 'presentation:close');
    return ipcRenderer.invoke('presentation:close');
  },
  sendSlideChange: (slideIndex: number) => {
    debug('Sending', 'presentation:send-slide-change', slideIndex);
    ipcRenderer.send('presentation:send-slide-change', slideIndex);
  },
  sendThemeUpdate: (themeData: any) => {
    debug('Sending', 'presentation:send-theme-update', themeData);
    ipcRenderer.send('presentation:send-theme-update', themeData);
  },
  setFullscreen: () => {
    debug('Sending', 'presentation:set-fullscreen');
    ipcRenderer.send('presentation:set-fullscreen');
  },
  clearScreen: () => {
    debug('Sending', 'presentation:clear-screen');
    ipcRenderer.send('presentation:clear-screen');
  },
  sendAction: (action: string, data?: any) => {
    debug('Sending', 'presentation:send-action', { action, data });
    ipcRenderer.send('presentation:send-action', { action, data });
  },
  sendControl: (action: string, data?: any) => {
    debug('Sending', 'presentation:send-control', { action, data });
    ipcRenderer.send('presentation:send-control', { action, data });
  },
  setCustomBackground: (background: { type: string; path: string }) => {
    debug('Sending', 'presentation:set-custom-background', background);
    ipcRenderer.send('presentation:set-custom-background', background);
  },
  setActiveSlide: (windowId: number, index: number) => {
    debug('Sending', 'presentation:set-active-slide', { windowId, index });
    ipcRenderer.send('presentation:set-active-slide', { windowId, index });
  },
  updateLyricsTheme: (windowId: number, themeData: any) => {
    debug('Sending', 'presentation:update-lyrics-theme', { windowId, themeData });
    ipcRenderer.send('presentation:update-lyrics-theme', { windowId, themeData });
  },

  onSlideClicked: (callback: (idx: number) => void) => {
    debug('Setting up listener for', 'presentation:on-slide-clicked');
    return onIpc<number>('presentation:on-slide-clicked', callback);
  },
  onControlReceived: (callback: (data: { action: string; data?: any }) => void) => {
    debug('Setting up listener for', 'presentation:on-control-received');
    return onIpc<{ action: string; data?: any }>('presentation:on-control-received', callback);
  },
  onSlideChanged: (callback: (idx: number) => void) => {
    debug('Setting up listener for', 'presentation:on-slide-changed');
    return onIpc<number>('presentation:on-slide-changed', callback);
  },
  onSlideClickedIndex: (callback: (idx: number) => void) => {
    debug('Setting up listener for', 'presentation:on-slide-clicked-index');
    return onIpc<number>('presentation:on-slide-clicked-index', callback);
  },
  onSelectedVideoBackground: (callback: (videoPath: string) => void) => {
    debug('Setting up listener for', 'presentation:on-selected-video-background');
    return onIpc<string>('presentation:on-selected-video-background', callback);
  },
  onLoadedLyrics: (callback: (lyrics: string[]) => void) => {
    debug('Setting up listener for', 'presentation:on-loaded-lyrics');
    return onIpc<string[]>('presentation:on-loaded-lyrics', callback);
  },
  onSongInfo: (callback: (info: { artist: string; title: string }) => void) => {
    debug('Setting up listener for', 'presentation:on-song-info');
    return onIpc<{ artist: string; title: string }>('presentation:on-song-info', callback);
  },
  onCustomBackground: (callback: (background: any) => void) => {
    debug('Setting up listener for', 'presentation:on-custom-background');
    return onIpc<any>('presentation:on-custom-background', callback);
  },
  onThemeUpdate: (callback: (themeData: any) => void) => {
    debug('Setting up listener for', 'presentation:on-theme-update');
    return onIpc<any>('presentation:on-theme-update', callback);
  },
  onTransitionUpdate: (callback: (data: any) => void) => {
    debug('Setting up listener for', 'presentation:on-transition-update');
    return onIpc<any>('presentation:on-transition-update', callback);
  },
};
