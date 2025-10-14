import { ipcRenderer } from 'electron';
import { debug } from './utils';

export const error = {
  reportRenderer: (errorDetails: any) => {
    debug('Sending', 'error:report-renderer', errorDetails);
    ipcRenderer.send('error:report-renderer', errorDetails);
  },
};
