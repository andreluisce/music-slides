import { ipcRenderer } from 'electron';
import { debug } from './utils';

export const songs = {
  getAllLocal: () => {
    debug('Sending', 'songs:get-all-local');
    return ipcRenderer.invoke('songs:get-all-local');
  },
  getDefaultSlides: () => {
    debug('Sending', 'songs:get-default-slides');
    return ipcRenderer.invoke('songs:get-default-slides');
  },
  save: (artist: string, title: string, lyrics: string, metadata?: any) => {
    debug('Sending', 'songs:save', { artist, title, lyrics, metadata });
    return ipcRenderer.invoke('songs:save', { artist, title, lyrics, metadata });
  },
  update: (artist: string, title: string, lyrics: string, metadata?: any) => {
    debug('Sending', 'songs:update', { artist, title, lyrics, metadata });
    return ipcRenderer.invoke('songs:update', { artist, title, lyrics, metadata });
  },
  delete: (artist: string, title: string) => {
    debug('Sending', 'songs:delete', { artist, title });
    return ipcRenderer.invoke('songs:delete', { artist, title });
  },
  read: (artist: string, title: string) => {
    debug('Sending', 'songs:read', { artist, title });
    return ipcRenderer.invoke('songs:read', { artist, title });
  },
  findLyrics: (searchType: string, artist: string, title: string) => {
    debug('Sending', 'songs:find-lyrics', { searchType, artist, title });
    return ipcRenderer.invoke('songs:find-lyrics', { searchType, artist, title });
  },
  getLyricByUrlHandle: (url: string) => {
    debug('Sending', 'songs:get-lyric-by-url-handle', { url });
    return ipcRenderer.invoke('songs:get-lyric-by-url-handle', { url });
  },
  getLyricByFilePath: (filePath: string, isDefault = false) => {
    debug('Sending', 'songs:get-lyric-by-file-path', { filePath, isDefault });
    return ipcRenderer.invoke('songs:get-lyric-by-file-path', { filePath, isDefault });
  },
  getAdvancedAnalysis: (artist: string, title: string, estimatedDuration?: number) => {
    debug('Sending', 'songs:get-advanced-analysis', { artist, title, estimatedDuration });
    return ipcRenderer.invoke('songs:get-advanced-analysis', { artist, title, estimatedDuration });
  },
  updateAnalysis: (artist: string, title: string, analysis: any) => {
    debug('Sending', 'songs:update-analysis', { artist, title, analysis });
    return ipcRenderer.invoke('songs:update-analysis', { artist, title, analysis });
  },
  generateAdvancedMetadata: (artist: string, title: string, lyrics: string, estimatedDuration?: number) => {
    debug('Sending', 'songs:generate-advanced-metadata', { artist, title, lyrics, estimatedDuration });
    return ipcRenderer.invoke('songs:generate-advanced-metadata', { artist, title, lyrics, estimatedDuration });
  },
};
