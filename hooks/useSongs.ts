import { useState, useEffect } from 'react';
import { api } from '../lib/electron-api';
import type { DisplaySong } from '../types/song';

export function useSongs() {
  const [songs, setSongs] = useState<DisplaySong[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSongs = async () => {
    try {
      const unified = await api.songs.getUnifiedSongList();
      console.log('📚 Unified songs loaded:', unified);

      const list = (unified || []).map((s: any) => ({
        title: s.title,
        artist: s.artist,
        band: s.artist, // Alias for artist
        filePath: s.localPath,
        supabaseId: s.cloudId,
        isLocal: !!s.localPath,
        syncStatus: s.syncStatus || 'local-only',
        metadata: s.metadata || {},
        lyrics: '', // Will be loaded when needed
        slideCount: s.slideCount || 0, // Include slide count from backend
      }));

      console.log('📚 Mapped songs:', list);
      setSongs(list);
    } catch (e) {
      console.error('Error loading songs:', e);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshSongs(); }, []);

  return { songs, loading, refreshSongs };
}
