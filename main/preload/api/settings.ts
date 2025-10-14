import { ipcRenderer } from 'electron';
import { debug } from './utils';

export const settings = {
  get: (key: string) => {
    debug('Sending', 'settings:get', key);
    return ipcRenderer.invoke('settings:get', key);
  },
  set: (key: string, value: any) => {
    debug('Sending', 'settings:set', { key, value });
    return ipcRenderer.invoke('settings:set', { key, value });
  },
  getAll: () => {
    debug('Sending', 'settings:get-all');
    return ipcRenderer.invoke('settings:get-all');
  },
  update: (key: string, value: any) => {
    debug('Sending', 'settings:update', { key, value });
    return ipcRenderer.invoke('settings:update', { key, value });
  },
  updateAll: (settings: any) => {
    debug('Sending', 'settings:update-all', settings);
    return ipcRenderer.invoke('settings:update-all', settings);
  },
  selectDataPath: () => {
    debug('Sending', 'settings:select-data-path');
    return ipcRenderer.invoke('settings:select-data-path');
  },
  selectLyricsPath: () => {
    debug('Sending', 'settings:select-lyrics-path');
    return ipcRenderer.invoke('settings:select-lyrics-path');
  },
  selectImagesPath: () => {
    debug('Sending', 'settings:select-images-path');
    return ipcRenderer.invoke('settings:select-images-path');
  },
  selectVideosPath: () => {
    debug('Sending', 'settings:select-videos-path');
    return ipcRenderer.invoke('settings:select-videos-path');
  },
};
