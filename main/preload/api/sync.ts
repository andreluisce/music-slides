import { ipcRenderer } from 'electron';
import { debug } from './utils';

export const sync = {
  getUnifiedSongList: () => {
    debug('Sending', 'sync:get-unified-song-list');
    return ipcRenderer.invoke('sync:get-unified-song-list');
  },
  performFull: (options?: any) => {
    debug('Sending', 'sync:perform-full', options);
    return ipcRenderer.invoke('sync:perform-full', options);
  },
  songToCloud: (artist: string, title: string) => {
    debug('Sending', 'sync:song-to-cloud', { artist, title });
    return ipcRenderer.invoke('sync:song-to-cloud', { artist, title });
  },
  songFromCloud: (artist: string, title: string) => {
    debug('Sending', 'sync:song-from-cloud', { artist, title });
    return ipcRenderer.invoke('sync:song-from-cloud', { artist, title });
  },
};
