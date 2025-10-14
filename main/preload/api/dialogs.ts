import { ipcRenderer } from 'electron';
import { debug } from './utils';

export const dialogs = {
  openTheme: () => {
    debug('Sending', 'dialogs:open-theme');
    return ipcRenderer.invoke('dialogs:open-theme');
  },
  openBackground: () => {
    debug('Sending', 'dialogs:open-background');
    return ipcRenderer.invoke('dialogs:open-background');
  },
  openTransition: () => {
    debug('Sending', 'dialogs:open-transition');
    return ipcRenderer.invoke('dialogs:open-transition');
  },
};
