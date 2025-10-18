
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '../ui/input';
import { X } from '@phosphor-icons/react';
import PresentationControlPanel from './panels/PresentationPanel';
import { useStageMode } from '../../hooks/useStageMode';
import { api } from '../../lib/electron-api';
import type { DisplaySong, Song } from '../../types/song';
import { normalizeText } from '../../lib/normalize';

interface SongListTableProps {
  songs: DisplaySong[];
  onSongSelect: (song: DisplaySong) => void;
}

export default function SongListTable({ songs, onSongSelect }: SongListTableProps) {
  const { setMode, setCurrentSong } = useStageMode();
  const [groupedSongs, setGroupedSongs] = useState<{ [key: string]: DisplaySong[] }>({});
  const [expandedArtists, setExpandedArtists] = useState<Set<string>>(new Set());
  const [quickSearch, setQuickSearch] = useState('');
  const [presenterSong, setPresenterSong] = useState<DisplaySong | null>(null);
  const [isPresenterOpen, setIsPresenterOpen] = useState(false);

  useEffect(() => {
    // Group songs by artist
    const grouped = songs.reduce((acc, song) => {
      const artist = song.artist || 'Desconhecido';
      if (!acc[artist]) acc[artist] = [];
      acc[artist].push(song);
      return acc;
    }, {} as { [key: string]: DisplaySong[] });

    // Sort each group's songs by title
    Object.keys(grouped).forEach(artist => {
      grouped[artist].sort((a, b) => a.title.localeCompare(b.title));
    });

    setGroupedSongs(grouped);
  }, [songs]);

  const toggleArtist = (artist: string) => {
    const newExpanded = new Set(expandedArtists);
    if (newExpanded.has(artist)) {
      newExpanded.delete(artist);
    } else {
      newExpanded.add(artist);
    }
    setExpandedArtists(newExpanded);
  };

  // Filter artists and songs based on quick search
  const filteredGroupedSongs = Object.entries(groupedSongs).reduce((acc, [artist, songs]) => {
    if (!quickSearch) {
      acc[artist] = songs;
      return acc;
    }

    const searchTerm = normalizeText(quickSearch);
    const artistMatches = normalizeText(artist).includes(searchTerm);

    if (artistMatches) {
      // If artist matches, show all their songs
      acc[artist] = songs;
    } else {
      // Otherwise, filter songs by title
      const matchingSongs = songs.filter(song =>
        normalizeText(song.title).includes(searchTerm)
      );
      if (matchingSongs.length > 0) {
        acc[artist] = matchingSongs;
      }
    }

    return acc;
  }, {} as { [key: string]: DisplaySong[] });

  const handleSongClick = async (song: DisplaySong) => {
    console.log('🎵 Song clicked:', song.title, 'by', song.artist);
    console.log('🎵 Song object:', JSON.stringify(song, null, 2));
    console.log('🎵 filePath:', song.filePath);

    const artist = song.artist || 'Desconhecido';

    try {
      // Open presentation window on secondary display
      const result = await api.openPresentationWindow(artist, song.title, song.filePath);

      if (result?.success) {
        console.log('✅ Presentation window opened successfully');

        // Save current song to store
        setCurrentSong({
          title: song.title,
          artist: artist || 'Unknown Artist', // Provide a default value for artist
          filePath: song.filePath,
          lyrics: (song as Song).lyrics, // May need adjustment
        });
        onSongSelect(song);

        // Navigate to Presentations → Live Control
        setMode('live');
      } else {
        console.error('❌ Failed to open presentation window:', result?.error);
      }
    } catch (error) {
      console.error('❌ Error opening presentation:', error);
    }
  };

  const closePresenter = async () => {
    setIsPresenterOpen(false);
    setPresenterSong(null);

    // Also close presentation window
    try {
      await api.closePresentationWindow();
    } catch (error) {
      console.error('Error closing presentation window:', error);
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return '●';
      case 'local-only': return '○';
      case 'cloud-only': return '◐';
      case 'conflict': return '⚠️';
      default: return '○';
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-green-400';
      case 'local-only': return 'text-blue-400';
      case 'cloud-only': return 'text-purple-400';
      case 'conflict': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  // Auto-expand artists when search is active
  useEffect(() => {
    if (quickSearch) {
      // Expand all matching artists
      const matchingArtists = Object.keys(filteredGroupedSongs);
      setExpandedArtists(new Set(matchingArtists));
    }
  }, [quickSearch, filteredGroupedSongs]);

  const totalSongs = Object.values(filteredGroupedSongs).reduce((sum, songs) => sum + songs.length, 0);
  const totalArtists = Object.keys(filteredGroupedSongs).length;

  return (
    <>
      <PresentationControlPanel
        isOpen={isPresenterOpen}
        onClose={closePresenter}
        song={presenterSong}
      />

      <div className='space-y-4'>
        {songs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
          {/* Header with Quick Search */}
          <div className='mb-6 space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-bold text-white'>Biblioteca de Músicas</h2>
              <div className='flex items-center gap-4 text-xs text-slate-400'>
                <div className='flex items-center gap-1.5'>
                  <span className='text-green-400'>●</span> Sincronizada
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='text-blue-400'>○</span> Local
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='text-purple-400'>◐</span> Nuvem
                </div>
              </div>
            </div>

            {/* Quick Search Input */}
            <div className='flex items-center gap-2'>
              <Input
                type='text'
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder='Busca rápida por artista ou música...'
                className='h-9 border-white/20 bg-white/10 text-sm text-white placeholder:text-slate-400 focus:border-magenta/50 focus:ring-2 focus:ring-magenta/20'
              />
              {quickSearch && (
                <button
                  onClick={() => setQuickSearch('')}
                  className='flex-shrink-0 text-slate-400 hover:text-white transition-colors'
                >
                  <X size={16} weight='bold' />
                </button>
              )}
            </div>

            {/* Stats Bar */}
            <div className='flex items-center gap-4 text-xs text-slate-500'>
              <span>{totalArtists} {totalArtists === 1 ? 'artista' : 'artistas'}</span>
              <span>•</span>
              <span>{totalSongs} {totalSongs === 1 ? 'música' : 'músicas'}</span>
              {quickSearch && (
                <>
                  <span>•</span>
                  <span className='text-magenta font-medium'>Filtrando resultados</span>
                </>
              )}
            </div>
          </div>

          {/* Artist Folders */}
          <div className='space-y-2'>
            {Object.entries(filteredGroupedSongs).map(([artist, songs]) => {
              const isExpanded = expandedArtists.has(artist);

              return (
                <motion.div
                  key={artist}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='rounded-lg border border-white/5 bg-white/5 overflow-hidden'
                >
                  {/* Artist Header (Folder) */}
                  <button
                    onClick={() => toggleArtist(artist)}
                    className='group w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all'
                  >
                    {/* Expand/Collapse Icon */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className='flex-shrink-0 text-slate-400 group-hover:text-white'
                    >
                      ▶
                    </motion.div>

                    {/* Artist Name */}
                    <div className='flex-1 min-w-0 text-left'>
                      <h3 className='text-sm font-semibold text-white truncate group-hover:text-magenta transition-colors'>
                        {artist}
                      </h3>
                    </div>

                    {/* Song Count Badge */}
                    <div className='flex-shrink-0 px-2 py-1 rounded-md bg-white/10 border border-white/10 text-xs font-medium text-slate-300'>
                      {songs.length} {songs.length === 1 ? 'música' : 'músicas'}
                    </div>
                  </button>

                  {/* Songs List (Collapsible) */}
                  <motion.div
                    initial={false}
                    animate={{
                      height: isExpanded ? 'auto' : 0,
                      opacity: isExpanded ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className='overflow-hidden'
                  >
                    <div className='px-4 py-2 space-y-1 border-t border-white/5'>
                      {songs.map((song, index) => (
                        <motion.button
                          key={(song as any).supabaseId || (song as any).url || song.filePath}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15, delay: index * 0.02 }}
                          onClick={() => handleSongClick(song)}
                          className='group relative w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition-all'
                        >
                          {/* Status Indicator */}
                          <div className={`flex-shrink-0 text-xs ${getSyncStatusColor(song.syncStatus || '')}`}>
                            {getSyncStatusIcon(song.syncStatus || '')}
                          </div>

                          {/* Song Title */}
                          <div className='flex-1 min-w-0 text-left'>
                            <h4 className='text-sm font-medium text-white truncate group-hover:text-magenta transition-colors'>
                              {song.title}
                            </h4>
                          </div>

                          {/* Hover Actions */}
                          <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                            <span className='text-[10px] font-medium text-slate-500 uppercase tracking-wider'>
                              Ver letra
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Empty State */}
          {totalSongs === 0 && quickSearch && (
            <div className='text-center py-12'>
              <p className='text-sm text-slate-400'>
                Nenhuma música ou artista encontrado para "{quickSearch}"
              </p>
              <button
                onClick={() => setQuickSearch('')}
                className='mt-2 text-xs text-magenta hover:text-magenta-400 transition-colors'
              >
                Limpar busca
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Library Empty State */}
      {songs.length === 0 && (
        <div className='text-center py-12 text-slate-400'>
          <p className='text-sm'>Sua biblioteca está vazia</p>
          <p className='text-xs mt-1'>Use a busca acima para adicionar músicas</p>
        </div>
      )}
      </div>
    </>
  );
}
