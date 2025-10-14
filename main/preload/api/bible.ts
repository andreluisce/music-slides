import { ipcRenderer } from 'electron';
import { debug } from './utils';

export const bible = {
  getVerse: (book: string, chapter: number, verse: number, version: string) => {
    debug('Sending', 'bible:get-verse', { book, chapter, verse, version });
    return ipcRenderer.invoke('bible:get-verse', { book, chapter, verse, version });
  },
};
