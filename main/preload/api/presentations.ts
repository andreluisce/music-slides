import { ipcRenderer } from 'electron';
import { debug } from './utils';

export const presentations = {
  getAll: () => {
    debug('Sending', 'presentations:get-all');
    return ipcRenderer.invoke('presentations:get-all');
  },
  create: (presentation: any) => {
    debug('Sending', 'presentations:create', presentation);
    return ipcRenderer.invoke('presentations:create', presentation);
  },
  getItems: (presentationId: string) => {
    debug('Sending', 'presentations:get-items', presentationId);
    return ipcRenderer.invoke('presentations:get-items', presentationId);
  },
  update: (id: string, updates: any) => {
    debug('Sending', 'presentations:update', { id, updates });
    return ipcRenderer.invoke('presentations:update', id, updates);
  },
  updateCurrentSlide: (presentationId: string, slideId: string) => {
    debug('Sending', 'presentations:update-current-slide', { presentationId, slideId });
    return ipcRenderer.invoke('presentations:update-current-slide', presentationId, slideId);
  },
};
