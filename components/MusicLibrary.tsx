
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MusicNotesPlusIcon, XCircle, CheckCircle, X, CloudCheck, Globe } from '@phosphor-icons/react';
import SongModal from './SongModal';
import PresentationControlPanel from './PresentationControlPanel';
import { useStageMode } from '../hooks/useStageMode';

interface SearchResult {
  title: string;
  artist: string;
  url: string;
  source: 'letrasmusic' | 'cifraclub' | 'database-cache';
}

interface Song {
  title: string;
  band?: string;
  artist?: string;
  url?: string;
  filePath?: string;
  supabaseId?: string;
  lyrics?: string;
  isLocal?: boolean;
  source?: string;
  metadata?: any;
}

const api = typeof window !== 'undefined' ? window.api : undefined;

// Helper function to get source badge info
function getSourceBadge(source: string) {
  switch (source) {
    case 'letrasmusic':
      return {
        label: 'Letras.mus.br',
        icon: Globe,
        className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      };
    case 'cifraclub':
      return {
        label: 'CifraClub',
        icon: Globe,
        className: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      };
    case 'database-cache':
      return {
        label: 'Cache',
        icon: CloudCheck,
        className: 'bg-green-500/20 text-green-300 border-green-500/30',
      };
    default:
      return {
        label: source,
        icon: Globe,
        className: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      };
  }
}

interface SearchFormProps {
  isSearching: boolean;
  setFoundRemoteSongs: (songs: Song[]) => void;
  setIsSearching: (value: boolean) => void;
}

function SearchForm({ isSearching, setFoundRemoteSongs, setIsSearching }: SearchFormProps) {
  const [searchTerm, setSearchTerm] = useState("Diante do Trono Me Ama");

  // Helpers for smart matching
  const normalizeText = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  const tokenize = (s: string) => normalizeText(s).split(/\s+/).filter(Boolean);

  const findExistingSong = (query: string, songs: any[]) => {
    const qNorm = normalizeText(query);
    const qTokens = tokenize(query).filter(t => t.length > 2); // ignore very short tokens

    // Try direct combined match first
    for (const song of songs) {
      const combined = normalizeText(`${song.artist} ${song.title}`);
      if (combined.includes(qNorm)) return song;
    }

    // Token-based fuzzy match (at least 2 tokens match across artist/title)
    for (const song of songs) {
      const combined = `${song.artist} ${song.title}`;
      const sTokens = new Set(tokenize(combined));
      const matches = qTokens.filter(t => sTokens.has(t));
      if (matches.length >= Math.min(2, qTokens.length)) {
        return song;
      }
    }

    return null;
  };
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [fetchingLyrics, setFetchingLyrics] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchSuccess, setSearchSuccess] = useState(false);
  const [searchProgressMessage, setSearchProgressMessage] = useState('');

  useEffect(() => {
    if (api) {
      const cleanup = api.onSearchProgress((message) => {
        setSearchProgressMessage(message);
      });
      return cleanup;
    }
  }, []);
  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFoundRemoteSongs([]);
    setSearchResults([]);
    setShowResults(false);
    setSearchError('');
    setSearchSuccess(false);

    try {
      // 1) Smart pre-check: see if it already exists locally or in cloud
      const unifiedSongs = await api?.getUnifiedSongList();
      if (unifiedSongs && Array.isArray(unifiedSongs)) {
        const existing = findExistingSong(searchTerm, unifiedSongs);
        if (existing) {
          setSearchError(
            `💡 Esta música já existe na sua biblioteca ${existing.syncStatus === 'local-only' ? 'localmente' : existing.syncStatus === 'cloud-only' ? 'na nuvem' : 'e está sincronizada'}.`
          );
          return; // do NOT search online
        }
      }

      // 2) Not found: perform online search
      setIsSearching(true);
      const results = await api?.fastLyricsSearch(searchTerm.trim());
      setIsSearching(false);

      if (results && results.length > 0) {
        setSearchResults(results);
        setShowResults(true);
      } else {
        setSearchError('Nenhuma música encontrada. Tente buscar com termos diferentes.');
      }
    } catch (error) {
      console.error('❌ Error searching lyrics:', error);
      setSearchError('Erro ao buscar músicas. Tente novamente.');
      setIsSearching(false);
    }
  };

  const selectSong = async (result: SearchResult) => {
    setFetchingLyrics(true);
    setShowResults(false);
    setSearchError('');
    setSearchSuccess(false);

    try {
      const fullResult = await api?.fetchLyricsByUrl(result.url, result.source);
      if (fullResult) {
        const songEntry: Song = {
          title: fullResult.title,
          band: fullResult.artist,
          url: result.url,
          lyrics: fullResult.lyrics,
          source: fullResult.source,
          metadata: fullResult.metadata,
        };
        setFoundRemoteSongs([songEntry]);
        setSearchSuccess(true);
        // Hide success message after 3 seconds
        setTimeout(() => setSearchSuccess(false), 3000);
      } else {
        setSearchError('Não foi possível carregar a letra desta música.');
      }
    } catch (error) {
      console.error('❌ Error fetching lyrics:', error);
      setSearchError('Erro ao carregar a letra. Tente novamente.');
    } finally {
      setFetchingLyrics(false);
    }
  };

  return (
    <form onSubmit={submitForm} className='flex flex-col gap-2'>
      <div className='flex gap-2'>
        <Input
          name='search'
          id='search'
          value={searchTerm}
          placeholder='Ex: Diante do Trono - Me Ama'
          className='h-10 border-white/20 bg-white/10 text-base text-white placeholder:text-slate-400 focus:border-magenta/50 focus:ring-2 focus:ring-magenta/20'
          onChange={event => {
            const text = event.target.value;
            setSearchTerm(text);
          }}
          autoComplete='off'
        />
        <Button
          disabled={!searchTerm || isSearching || fetchingLyrics}
          type='submit'
          size='lg'
          className={`h-10 px-6 text-base transition-all ${!searchTerm
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
            : 'bg-magenta hover:bg-magenta-600 text-white'
            }`}>
          {isSearching ? 'Buscando...' : fetchingLyrics ? 'Carregando...' : 'Buscar'}
        </Button>
      </div>
      {!searchTerm && (
        <p className='text-xs text-slate-500 mt-1'>
          💡 Digite o nome da música ou artista para buscar online
        </p>
      )}

      {isSearching && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='mt-3 space-y-2'>
          <div className='rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 mb-3'>
            <div className='flex items-center gap-3'>
              <div className='h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent' />
              <div className='flex-1'>
                <p className='text-sm font-semibold text-blue-300'>
                  {searchProgressMessage || 'Buscando músicas...'}
                </p>
                <p className='text-xs text-blue-400/70'>
                  Procurando nos nossos servidores e na internet
                </p>
              </div>
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className='overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20' />
                <div className='flex-1 space-y-2'>
                  <div className='h-3 w-3/4 animate-pulse rounded bg-white/10' />
                  <div className='h-2 w-1/2 animate-pulse rounded bg-white/5' />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {fetchingLyrics && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='mt-3'>
          <div className='rounded-lg border border-purple-500/30 bg-purple-500/10 p-4'>
            <div className='flex items-center gap-3'>
              <div className='h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent' />
              <div className='flex-1'>
                <p className='text-sm font-semibold text-purple-300'>
                  {searchProgressMessage || 'Carregando letra da música...'}
                </p>
                <p className='text-xs text-purple-400/70'>
                  Buscando em cache ou na internet
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search Info/Error */}
      {searchError && !isSearching && !fetchingLyrics && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='mt-3'>
          <div className={`rounded-lg border p-4 ${
            searchError.startsWith('💡') 
              ? 'border-blue-500/30 bg-blue-500/10'
              : 'border-red-500/30 bg-red-500/10'
          }`}>
            <div className='flex items-center gap-3'>
              {searchError.startsWith('💡') ? (
                <div className='flex-shrink-0 text-blue-400'>
                  <span className='text-lg'>💡</span>
                </div>
              ) : (
                <XCircle size={20} weight='fill' className='flex-shrink-0 text-red-400' />
              )}
              <div className='flex-1'>
                <p className={`text-sm font-semibold ${
                  searchError.startsWith('💡') ? 'text-blue-300' : 'text-red-300'
                }`}>
                  {searchError}
                </p>
              </div>
              <button
                onClick={() => setSearchError('')}
                className={`${
                  searchError.startsWith('💡') 
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-red-400 hover:text-red-300'
                } transition-colors`}
              >
                <X size={16} weight='bold' />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search Success */}
      {searchSuccess && !fetchingLyrics && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='mt-3'>
          <div className='rounded-lg border border-green-500/30 bg-green-500/10 p-4'>
            <div className='flex items-center gap-3'>
              <CheckCircle size={20} weight='fill' className='text-green-400' />
              <div className='flex-1'>
                <p className='text-sm font-semibold text-green-300'>
                  Letra carregada com sucesso!
                </p>
                <p className='text-xs text-green-400/70'>
                  A música está pronta para uso
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {showResults && searchResults.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='mt-3'>
          <div className='rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-3'>
            <h3 className='mb-3 text-xs font-semibold text-white'>
              Selecione a música ({searchResults.length} resultados)
            </h3>
            <div className='max-h-64 space-y-2 overflow-y-auto'>
              {searchResults.map((result, index) => {
                const badge = getSourceBadge(result.source);
                const BadgeIcon = badge.icon;

                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => selectSong(result)}
                    className='group relative w-full overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-3 text-left transition-all hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10 hover:shadow-lg hover:shadow-purple-500/20'>
                    <div className='relative flex items-start gap-3'>
                      <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white shadow-lg'>
                        {index + 1}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <p className='truncate text-sm font-semibold text-white transition-colors group-hover:text-purple-300'>
                            {result.title}
                          </p>
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium flex-shrink-0 ${badge.className}`}>
                            <BadgeIcon size={12} weight='bold' />
                            {badge.label}
                          </span>
                        </div>
                        <p className='truncate text-xs text-slate-400 transition-colors group-hover:text-slate-300'>
                          {result.artist}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </form>
  );
}

interface SongListTableProps {
  filteredLocalSongs: Song[];
  foundRemoteSongs: Song[];
}

function SongListTable({ filteredLocalSongs, foundRemoteSongs }: SongListTableProps) {
  const { setMode, setCurrentSong } = useStageMode();
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [groupedSongs, setGroupedSongs] = useState<{ [key: string]: Song[] }>({});
  const [expandedArtists, setExpandedArtists] = useState<Set<string>>(new Set());
  const [quickSearch, setQuickSearch] = useState('');
  const [presenterSong, setPresenterSong] = useState<Song | null>(null);
  const [isPresenterOpen, setIsPresenterOpen] = useState(false);

  useEffect(() => {
    const songs = [...filteredLocalSongs, ...foundRemoteSongs];
    setAllSongs(songs);

    // Group songs by artist
    const grouped = songs.reduce((acc, song) => {
      const artist = song.band || song.artist || 'Desconhecido';
      if (!acc[artist]) acc[artist] = [];
      acc[artist].push(song);
      return acc;
    }, {} as { [key: string]: Song[] });

    // Sort each group's songs by title
    Object.keys(grouped).forEach(artist => {
      grouped[artist].sort((a, b) => a.title.localeCompare(b.title));
    });

    setGroupedSongs(grouped);
  }, [filteredLocalSongs, foundRemoteSongs]);

  const toggleArtist = (artist: string) => {
    const newExpanded = new Set(expandedArtists);
    if (newExpanded.has(artist)) {
      newExpanded.delete(artist);
    } else {
      newExpanded.add(artist);
    }
    setExpandedArtists(newExpanded);
  };

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim();

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
  }, {} as { [key: string]: Song[] });

  const handleSongClick = async (song: Song) => {
    console.log('🎵 Song clicked:', song.title, 'by', song.band || song.artist);

    const artist = song.band || song.artist || 'Desconhecido';

    try {
      // Open presentation window on secondary display
      const result = await api?.openPresentationWindow(artist, song.title, song.filePath);

      if (result?.success) {
        console.log('✅ Presentation window opened successfully');

        // Save current song to store
        setCurrentSong({
          title: song.title,
          artist: artist,
          filePath: song.filePath,
          lyrics: song.lyrics,
        });

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
      await api?.closePresentationWindow();
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
        {allSongs.length > 0 && (
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
                          key={song.supabaseId || song.url || song.filePath}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15, delay: index * 0.02 }}
                          onClick={() => handleSongClick(song)}
                          className='group relative w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition-all'
                        >
                          {/* Status Indicator */}
                          <div className={`flex-shrink-0 text-xs ${getSyncStatusColor(song.syncStatus)}`}>
                            {getSyncStatusIcon(song.syncStatus)}
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
      {allSongs.length === 0 && (
        <div className='text-center py-12 text-slate-400'>
          <p className='text-sm'>Sua biblioteca está vazia</p>
          <p className='text-xs mt-1'>Use a busca acima para adicionar músicas</p>
        </div>
      )}
      </div>
    </>
  );
}

export default function MusicLibrary() {
  const [foundRemoteSongs, setFoundRemoteSongs] = useState<Song[]>([]);
  const [filteredLocalSongs, setFilteredLocalSongs] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewSongDialog, setShowNewSongDialog] = useState(false);

  const getAllSongs = () => 
    api?.getUnifiedSongList().then((unifiedSongs: any) => {
      setFoundRemoteSongs([]);

      // Guard against undefined or empty songs list
      if (!unifiedSongs || !Array.isArray(unifiedSongs)) {
        setFilteredLocalSongs([]);
        return;
      }

      const allSongs: Song[] = unifiedSongs.map((song: any) => ({
        title: song.title,
        band: song.artist,
        filePath: song.localPath,
        supabaseId: song.cloudId,
        isLocal: !!song.localPath,
        syncStatus: song.syncStatus,
        metadata: song.metadata,
      }));

      setFilteredLocalSongs(allSongs);
    }).catch((error: any) => {
      console.error('Error loading songs:', error);
      setFilteredLocalSongs([]);
    });

  useEffect(() => {
    getAllSongs();
  }, []);

  return (
    <div className='p-6'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Biblioteca</h1>
        <div className="flex gap-2">
          <Button size='lg' variant='outline'
            onClick={() => setShowNewSongDialog(true)}
            className="bg-transparent text-white hover:bg-white/10">
            <MusicNotesPlusIcon size={32} />
            Nova Música
          </Button>
        </div>
      </div>
      <SearchForm
        {...{
          isSearching,
          setFoundRemoteSongs,
          setIsSearching,
        }}
      />
      <div className="mt-6">
        <SongListTable {...{ filteredLocalSongs, foundRemoteSongs }} />
      </div>

      <SongModal
        isOpen={showNewSongDialog}
        onClose={() => setShowNewSongDialog(false)}
        onSave={() => {
          getAllSongs();
          setShowNewSongDialog(false);
        }}
        song={null}
      />
    </div>
  );
}
