import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlass, Plus, X } from '@phosphor-icons/react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import ArtistSidebar from './ArtistSidebar';
import SongsTable from './SongsTable';
import ContextMenu from './ContextMenu';
import SongModal from '../music-library/modals/SongModal';
import { useSongs } from '../../hooks/useSongs';
import { api } from '../../lib/electron-api';
import { normalizeText } from '../../lib/normalize';
import { useStageMode } from '../../hooks/useStageMode';
import type { SongItem, ArtistGroup } from './types';
import type { DisplaySong } from '../../types/song';

interface MusicLibraryV2Props {
  onSongSelect?: (song: DisplaySong) => void;
}

export default function MusicLibraryV2({ onSongSelect }: MusicLibraryV2Props) {
  const { songs: rawSongs, loading, refreshSongs } = useSongs();
  const { setMode, setCurrentSong } = useStageMode();

  // Debug logging
  React.useEffect(() => {
    console.log('🎵 MusicLibraryV2 received songs:', rawSongs);
    console.log('🎵 Loading state:', loading);
  }, [rawSongs, loading]);

  // UI State
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [showNewSongDialog, setShowNewSongDialog] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    songs: SongItem[];
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    songs: [],
  });

  // Convert raw songs to SongItem format
  const songs: SongItem[] = useMemo(() => {
    return rawSongs.map((song) => ({
      id: song.filePath || song.supabaseId || `${song.artist}-${song.title}`,
      title: song.title,
      artist: song.artist || 'Desconhecido',
      slideCount: (song as any).slideCount || 0, // Use slideCount from backend
      syncStatus: song.syncStatus || 'local-only',
      filePath: song.filePath,
      cloudId: song.supabaseId,
      lastModified: song.metadata?.updatedAt,
      metadata: song.metadata,
    }));
  }, [rawSongs]);

  // Group songs by artist
  const artistGroups: ArtistGroup[] = useMemo(() => {
    const grouped = songs.reduce((acc, song) => {
      const artist = song.artist;
      if (!acc[artist]) {
        acc[artist] = [];
      }
      acc[artist].push(song);
      return acc;
    }, {} as Record<string, SongItem[]>);

    return Object.entries(grouped).map(([name, songs]) => {
      const syncStatuses = songs.map(s => s.syncStatus);
      const allSynced = syncStatuses.every(s => s === 'synced');
      const allLocal = syncStatuses.every(s => s === 'local-only');
      const allCloud = syncStatuses.every(s => s === 'cloud-only');

      let groupSyncStatus: ArtistGroup['syncStatus'] = 'partial';
      if (allSynced) groupSyncStatus = 'all-synced';
      else if (allLocal) groupSyncStatus = 'local';
      else if (allCloud) groupSyncStatus = 'cloud';

      return {
        name,
        songCount: songs.length,
        songs,
        syncStatus: groupSyncStatus,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [songs]);

  // Filter songs based on selected artist and search query
  const filteredSongs = useMemo(() => {
    let filtered = songs;

    console.log('🔍 Filtering - Total songs:', songs.length);
    console.log('🔍 Selected artist:', selectedArtist);
    console.log('🔍 Search query:', searchQuery);

    // Filter by artist
    if (selectedArtist) {
      filtered = filtered.filter(song => song.artist === selectedArtist);
    }

    // Filter by search query
    if (searchQuery) {
      const normalized = normalizeText(searchQuery);
      filtered = filtered.filter(song =>
        normalizeText(song.title).includes(normalized) ||
        normalizeText(song.artist).includes(normalized)
      );
    }

    console.log('🔍 Filtered songs:', filtered.length, filtered);

    return filtered;
  }, [songs, selectedArtist, searchQuery]);

  // Handle song selection
  const handleSelectSong = useCallback((songId: string, multi: boolean) => {
    if (!multi) {
      setSelectedSongIds(new Set([songId]));
    } else {
      setSelectedSongIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(songId)) {
          newSet.delete(songId);
        } else {
          newSet.add(songId);
        }
        return newSet;
      });
    }
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    setSelectedSongIds(new Set(filteredSongs.map(s => s.id)));
  }, [filteredSongs]);

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedSongIds(new Set());
  }, []);

  // Handle song actions
  const handleSongAction = useCallback(async (song: SongItem, action: 'present' | 'edit') => {
    if (action === 'present') {
      try {
        const result = await api.openPresentationWindow(
          song.artist,
          song.title,
          song.filePath
        );

        if (result?.success) {
          setCurrentSong({
            title: song.title,
            artist: song.artist,
            filePath: song.filePath,
            lyrics: '', // Will be loaded by presentation window
          });

          if (onSongSelect) {
            onSongSelect({
              title: song.title,
              artist: song.artist,
              band: song.artist,
              filePath: song.filePath,
              supabaseId: song.cloudId,
              syncStatus: song.syncStatus,
              metadata: song.metadata,
            } as DisplaySong);
          }

          setMode('live');
        }
      } catch (error) {
        console.error('Error presenting song:', error);
      }
    } else if (action === 'edit') {
      // TODO: Open edit dialog
      console.log('Edit song:', song.title);
    }
  }, [setMode, setCurrentSong, onSongSelect]);

  // Handle context menu
  const handleContextMenu = useCallback((song: SongItem, event: React.MouseEvent) => {
    // If song is not selected, select only this song
    if (!selectedSongIds.has(song.id)) {
      setSelectedSongIds(new Set([song.id]));
    }

    // Get all selected songs
    const selectedSongs = songs.filter(s =>
      selectedSongIds.has(s.id) || s.id === song.id
    );

    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      songs: selectedSongs,
    });
  }, [selectedSongIds, songs]);

  // Handle context menu actions
  const handleContextMenuAction = useCallback(async (action: string, songs: SongItem[]) => {
    switch (action) {
      case 'present':
        if (songs.length === 1) {
          await handleSongAction(songs[0], 'present');
        }
        break;
      case 'edit':
        if (songs.length === 1) {
          await handleSongAction(songs[0], 'edit');
        }
        break;
      case 'view':
        console.log('View lyrics for:', songs[0].title);
        break;
      case 'add-to-presentation':
        console.log('Add to presentation:', songs.length, 'songs');
        break;
      case 'sync':
        console.log('Sync songs:', songs.length);
        // TODO: Implement sync
        break;
      case 'duplicate':
        console.log('Duplicate song:', songs[0].title);
        break;
      case 'delete':
        console.log('Delete songs:', songs.length);
        // TODO: Implement delete with confirmation
        break;
    }
  }, [handleSongAction]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 to-purple-900/20">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Biblioteca de Letras</h1>
            <p className="text-sm text-slate-400 mt-1">
              {songs.length} {songs.length === 1 ? 'música' : 'músicas'} • {artistGroups.length} {artistGroups.length === 1 ? 'artista' : 'artistas'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar músicas..."
                className="w-80 h-10 pl-10 pr-10 border-white/20 bg-white/10 text-white placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} weight="bold" />
                </button>
              )}
            </div>

            {/* Add Song Button */}
            <Button
              onClick={() => setShowNewSongDialog(true)}
              className="bg-magenta hover:bg-magenta/80 text-white"
            >
              <Plus size={20} weight="bold" />
              Nova Música
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Artist Sidebar */}
        <ArtistSidebar
          artists={artistGroups}
          selectedArtist={selectedArtist}
          onSelectArtist={setSelectedArtist}
        />

        {/* Songs Table */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-magenta border-t-transparent rounded-full"
              />
            </div>
          ) : (
            <SongsTable
              songs={filteredSongs}
              selectedSongs={selectedSongIds}
              onSelectSong={handleSelectSong}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onSongAction={handleSongAction}
              onContextMenu={handleContextMenu}
            />
          )}
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        songs={contextMenu.songs}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onAction={handleContextMenuAction}
      />

      {/* New Song Dialog */}
      <SongModal
        isOpen={showNewSongDialog}
        onClose={() => setShowNewSongDialog(false)}
        onSave={() => {
          refreshSongs();
          setShowNewSongDialog(false);
        }}
        song={null}
      />
    </div>
  );
}
