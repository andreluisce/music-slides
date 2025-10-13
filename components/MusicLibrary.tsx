
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MusicNotesPlusIcon, XCircle, CheckCircle, X, CloudCheck, Globe } from '@phosphor-icons/react';
import SongModal from './SongModal';

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
  const [searchTerm, setSearchTerm] = useState('');
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
    event.preventDefault();
    setFoundRemoteSongs([]);
    setSearchResults([]);
    setShowResults(false);
    setIsSearching(true);
    setSearchError('');
    setSearchSuccess(false);

    try {
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
                  Carregando letra da música...
                </p>
                <p className='text-xs text-purple-400/70'>
                  Buscando em cache ou na internet
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search Error */}
      {searchError && !isSearching && !fetchingLyrics && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='mt-3'>
          <div className='rounded-lg border border-red-500/30 bg-red-500/10 p-4'>
            <div className='flex items-center gap-3'>
              <XCircle size={20} weight='fill' className='flex-shrink-0 text-red-400' />
              <div className='flex-1'>
                <p className='text-sm font-semibold text-red-300'>
                  {searchError}
                </p>
              </div>
              <button
                onClick={() => setSearchError('')}
                className='text-red-400 hover:text-red-300 transition-colors'
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
  const [allSongs, setAllSongs] = useState<Song[]>([]);

  useEffect(() => {
    setAllSongs([...filteredLocalSongs, ...foundRemoteSongs]);
  }, [filteredLocalSongs, foundRemoteSongs]);

  return (
    <div className='space-y-2'>
      {allSongs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm'>
          <div className='mb-2 flex items-center justify-between'>
            <h2 className='text-sm font-semibold text-white'>Músicas ({allSongs.length})</h2>
          </div>
          <div className='grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3'>
            {allSongs.map((song, index) => (
              <motion.div
                key={song.supabaseId || song.url || song.filePath}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className='group cursor-pointer rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-2.5 transition-all hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10 hover:shadow-lg hover:shadow-purple-500/20'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex flex-1 flex-col min-w-0'>
                    <h3 className={`truncate text-sm font-semibold text-white`}>
                      {song.title}
                    </h3>
                    <p className='truncate text-xs text-slate-400'>{song.band || song.artist}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function MusicLibrary() {
  const [foundRemoteSongs, setFoundRemoteSongs] = useState<Song[]>([]);
  const [filteredLocalSongs, setFilteredLocalSongs] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewSongDialog, setShowNewSongDialog] = useState(false);

  const getAllLocalSongs = () =>
    api?.getAllLocalSongs()?.then((artistGroups: any) => {
      setFoundRemoteSongs([]);

      // Guard against undefined or empty artistGroups
      if (!artistGroups || !Array.isArray(artistGroups)) {
        setFilteredLocalSongs([]);
        return;
      }

      const localSongs: Song[] = artistGroups.flatMap((group: any) => {
        // Guard against undefined songs array
        if (!group?.songs || !Array.isArray(group.songs)) {
          return [];
        }

        return group.songs.map((song: any) => ({
          filePath: `${group.normalizedArtist}/${song.normalizedTitle}.txt`,
          title: song.title,
          band: group.artist,
          isLocal: true,
        }));
      });

      setFilteredLocalSongs(localSongs);
    }).catch((error: any) => {
      console.error('Error loading local songs:', error);
      setFilteredLocalSongs([]);
    });

  useEffect(() => {
    getAllLocalSongs();
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
          getAllLocalSongs();
          setShowNewSongDialog(false);
        }}
        song={null}
      />
    </div>
  );
}
