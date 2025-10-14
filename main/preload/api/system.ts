import { ipcRenderer } from 'electron';
import { debug } from './utils';

export const system = {
  getPath: (name: string) => {
    debug('Sending', 'system:get-path', { name });
    return ipcRenderer.invoke('system:get-path', { name });
  },
};
