import { ipcRenderer } from 'electron';

export const supabaseLyricsApi = {
  // Get songs without lyrics
  getSongsWithoutLyrics: (limit?: number) => 
    ipcRenderer.invoke('supabase-lyrics:get-songs-without-lyrics', limit),
  
  // Search songs
  searchSongs: (query: string, limit?: number) => 
    ipcRenderer.invoke('supabase-lyrics:search-songs', { query, limit }),
  
  // Full-text search
  fullTextSearch: (query: string, limit?: number) => 
    ipcRenderer.invoke('supabase-lyrics:fulltext-search', { query, limit }),
  
  // Get song by ID
  getSong: (songId: string) => 
    ipcRenderer.invoke('supabase-lyrics:get-song', songId),
  
  // Update song lyrics
  updateLyrics: (songId: string, lyrics: string, source: string, metadata?: any) => 
    ipcRenderer.invoke('supabase-lyrics:update-lyrics', { songId, lyrics, source, metadata }),
  
  // Create new song with lyrics
  createSong: (artist: string, title: string, lyrics: string, source: string, metadata?: any) => 
    ipcRenderer.invoke('supabase-lyrics:create-song', { artist, title, lyrics, source, metadata }),
  
  // Delete song lyrics
  deleteLyrics: (songId: string) => 
    ipcRenderer.invoke('supabase-lyrics:delete-lyrics', songId),
  
  // Get library statistics
  getStats: () => 
    ipcRenderer.invoke('supabase-lyrics:get-stats'),
};

export const progressApi = {
  // Get all active progress
  getAll: () => 
    ipcRenderer.invoke('progress:get-all'),
  
  // Get specific progress
  get: (progressId: string) => 
    ipcRenderer.invoke('progress:get', progressId),
  
  // Cancel progress
  cancel: (progressId: string) => 
    ipcRenderer.invoke('progress:cancel', progressId),
  
  // Clear completed progress
  clearCompleted: () => 
    ipcRenderer.invoke('progress:clear-completed'),
  
  // Update notification options
  updateOptions: (options: any) => 
    ipcRenderer.invoke('progress:update-options', options),
  
  // Listen to progress events
  onProgressStarted: (callback: (progress: any) => void) => 
    ipcRenderer.on('progress-notification:progress-started', (event, progress) => callback(progress)),
  
  onProgressUpdated: (callback: (progress: any) => void) => 
    ipcRenderer.on('progress-notification:progress-updated', (event, progress) => callback(progress)),
  
  onProgressCompleted: (callback: (progress: any) => void) => 
    ipcRenderer.on('progress-notification:progress-completed', (event, progress) => callback(progress)),
  
  onProgressFailed: (callback: (progress: any) => void) => 
    ipcRenderer.on('progress-notification:progress-failed', (event, progress) => callback(progress)),
  
  onProgressCancelled: (callback: (progress: any) => void) => 
    ipcRenderer.on('progress-notification:progress-cancelled', (event, progress) => callback(progress)),
  
  onProgressRemoved: (callback: (data: any) => void) => 
    ipcRenderer.on('progress-notification:progress-removed', (event, data) => callback(data)),
  
  // Remove event listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('progress-notification:progress-started');
    ipcRenderer.removeAllListeners('progress-notification:progress-updated');
    ipcRenderer.removeAllListeners('progress-notification:progress-completed');
    ipcRenderer.removeAllListeners('progress-notification:progress-failed');
    ipcRenderer.removeAllListeners('progress-notification:progress-cancelled');
    ipcRenderer.removeAllListeners('progress-notification:progress-removed');
  }
};