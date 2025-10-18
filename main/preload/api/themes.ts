import { ipcRenderer } from 'electron';
import { debug } from './utils';
import type { Theme, ThemeInsert, ThemeUpdate } from '../../../lib/themes-service';

export const themes = {
  getAll: (): Promise<Theme[]> => {
    debug('Sending', 'themes:get-all');
    return ipcRenderer.invoke('themes:get-all');
  },
  create: (themeData: ThemeInsert): Promise<Theme> => {
    debug('Sending', 'themes:create', themeData);
    return ipcRenderer.invoke('themes:create', themeData);
  },
  update: (id: string, themeData: ThemeUpdate): Promise<Theme> => {
    debug('Sending', 'themes:update', { id, themeData });
    return ipcRenderer.invoke('themes:update', { id, themeData });
  },
  delete: (id: string): Promise<{ success: boolean }> => {
    debug('Sending', 'themes:delete', id);
    return ipcRenderer.invoke('themes:delete', id);
  },
};
