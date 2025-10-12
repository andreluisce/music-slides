import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { getAllSongs } from '../lib/supabase-service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loader2, Music, Play, Music2, CheckCircle2, Globe, FileText } from 'lucide-react';

const api = typeof window !== 'undefined' ? window.api : undefined;

function kebabToCapitalizeText(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Progress steps for visual feedback
const PROGRESS_STEPS = [
  {
    id: 'fetching',
    label: 'Acessando página da música',
    description: 'Navegando até a página, fechando modais e aguardando carregamento',
    icon: Globe,
    iconClass: 'text-blue-400',
    borderClass: 'border-blue-500',
    bgClass: 'bg-blue-500/20',
    activeBgClass: 'bg-blue-500/30',
    shadowClass: 'shadow-blue-500/50',
    dotClass: 'bg-blue-400'
  },
  {
    id: 'extracting',
    label: 'Extraindo letra da página',
    description: 'Localizando e copiando o conteúdo da letra',
    icon: FileText,
    iconClass: 'text-purple-400',
    borderClass: 'border-purple-500',
    bgClass: 'bg-purple-500/20',
    activeBgClass: 'bg-purple-500/30',
    shadowClass: 'shadow-purple-500/50',
    dotClass: 'bg-purple-400'
  },
  {
    id: 'complete',
    label: 'Concluído',
    description: 'Letra carregada e pronta para usar!',
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    borderClass: 'border-emerald-500',
    bgClass: 'bg-emerald-500/20',
    activeBgClass: 'bg-emerald-500/30',
    shadowClass: 'shadow-emerald-500/50',
    dotClass: 'bg-emerald-400'
  },
];

function SearchForm({ isSearching, setFoundRemoteSongs, setIsSearching }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [fetchingLyrics, setFetchingLyrics] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFoundRemoteSongs([]);
    setSearchResults([]);
    setShowResults(false);
    setIsSearching(true);
    setCurrentStep(-1); // Reset progress

    try {
      console.log('⚡ Starting fast lyrics search...');
      const results = await api?.fastLyricsSearch(searchTerm.trim());

      console.log('📦 Search results:', results);
      setIsSearching(false);

      if (results && results.length > 0) {
        setSearchResults(results);
        setShowResults(true);
        console.log(`✅ Found ${results.length} songs`);
      } else {
        console.log('❌ No results found');
      }
    } catch (error) {
      console.error('❌ Error searching lyrics:', error);
      setIsSearching(false);
    }
  };

  const selectSong = async (result) => {
    console.log({ result })
    setFetchingLyrics(true);
    setShowResults(false);
    setCurrentStep(0); // Start at step 0: "Acessando página"

    try {
      console.log('📥 Fetching lyrics for:', result.title, 'by', result.artist);

      // Progress updates - most time is spent accessing the page
      setTimeout(() => setCurrentStep(1), 2000);  // After 2s, show "Extraindo letra"

      const fullResult = await api?.fetchLyricsByUrl(result.url, result.source);
      console.log({ fullResult })
      if (fullResult) {
        setCurrentStep(2); // Complete
        const songEntry = {
          title: fullResult.title,
          band: fullResult.artist,
          url: result.url,
          lyrics: fullResult.lyrics,
          source: fullResult.source,
          metadata: fullResult.metadata,
        };
        setFoundRemoteSongs([songEntry]);
        console.log('✅ Lyrics fetched successfully');
        setTimeout(() => setCurrentStep(-1), 2000);
      } else {
        setCurrentStep(-1);
        console.log('❌ Failed to fetch lyrics');
      }
    } catch (error) {
      console.error('❌ Error fetching lyrics:', error);
      setCurrentStep(-1);
    } finally {
      setTimeout(() => setFetchingLyrics(false), 500);
    }
  };

  return (
    <form onSubmit={submitForm} className='flex flex-col gap-2'>
      <div className='flex gap-2'>
        <Input
          name='search'
          id='search'
          value={searchTerm}
          placeholder='Ex: Diante do trono Aclame ao Senhor'
          className='h-8 border-white/20 bg-white/10 text-sm text-white placeholder:text-slate-400'
          onChange={event => {
            const text = event.target.value;
            setSearchTerm(text);
          }}
        />
        <Button
          disabled={!searchTerm || isSearching || fetchingLyrics}
          type='submit'
          size='sm'
          className='h-8 bg-gradient-to-r from-blue-600 to-purple-600 px-4 text-xs hover:from-blue-700 hover:to-purple-700'>
          {isSearching ? 'Buscando...' : fetchingLyrics ? 'Carregando...' : 'Buscar'}
        </Button>
      </div>

      {/* Progress Indicator */}
      {currentStep >= 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className='mt-3 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md'>
          <div className='p-4'>
            {/* Current Step Display */}
            <div className='mb-4 flex items-center gap-3'>
              {React.createElement(PROGRESS_STEPS[currentStep].icon, {
                className: `h-5 w-5 ${PROGRESS_STEPS[currentStep].iconClass}`,
                strokeWidth: 2.5
              })}
              <div className='flex-1'>
                <p className='text-sm font-medium text-white'>
                  {PROGRESS_STEPS[currentStep].label}
                </p>
                <p className='mt-0.5 text-xs text-slate-400'>
                  {PROGRESS_STEPS[currentStep].description}
                </p>
              </div>
              {currentStep < 4 && (
                <Loader2 className='h-4 w-4 animate-spin text-purple-400' />
              )}
              {currentStep === 4 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}>
                  <CheckCircle2 className='h-5 w-5 text-emerald-400' />
                </motion.div>
              )}
            </div>

            {/* Progress Steps */}
            <div className='flex items-center justify-between gap-2'>
              {PROGRESS_STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{
                      scale: index <= currentStep ? 1 : 0.8,
                      opacity: index <= currentStep ? 1 : 0.3,
                    }}
                    transition={{ duration: 0.3 }}
                    className='relative flex flex-col items-center'>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${index < currentStep
                        ? `${step.borderClass} ${step.bgClass}`
                        : index === currentStep
                          ? `${step.borderClass} ${step.activeBgClass} shadow-lg ${step.shadowClass}`
                          : 'border-white/10 bg-white/5'
                        }`}>
                      {index < currentStep ? (
                        <CheckCircle2 className={`h-4 w-4 ${step.iconClass}`} strokeWidth={2.5} />
                      ) : (
                        <div
                          className={`h-2 w-2 rounded-full ${index === currentStep ? step.dotClass : 'bg-white/20'
                            }`}
                        />
                      )}
                    </div>
                  </motion.div>
                  {index < PROGRESS_STEPS.length - 1 && (
                    <div className='relative h-0.5 flex-1 overflow-hidden rounded-full bg-white/10'>
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{
                          width: index < currentStep ? '100%' : '0%',
                        }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        className='h-full bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-emerald-500'
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading Skeleton */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='mt-3 space-y-2'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm'>
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

      {/* Search Results List */}
      {showResults && searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='mt-3'>
          <div className='rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-3'>
            <h3 className='mb-3 text-xs font-semibold text-white'>
              Selecione a música ({searchResults.length} resultados)
            </h3>
            <div className='max-h-64 space-y-2 overflow-y-auto'>
              {searchResults.map((result, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => selectSong(result)}
                  className='group relative w-full overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-3 text-left transition-all hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10 hover:shadow-lg hover:shadow-purple-500/20'>
                  {/* Hover gradient effect */}
                  <div className='absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-pink-500/0 opacity-0 transition-opacity group-hover:opacity-100' />

                  <div className='relative flex items-start gap-3'>
                    <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white shadow-lg'>
                      {index + 1}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-semibold text-white transition-colors group-hover:text-purple-300'>
                        {result.title}
                      </p>
                      <p className='mt-0.5 truncate text-xs text-slate-400 transition-colors group-hover:text-slate-300'>
                        {result.artist}
                      </p>
                      <div className='mt-1.5 flex items-center gap-1.5'>
                        <span className='inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400'>
                          {result.source === 'letrasmusic' ? (
                            <>
                              <Music2 className='h-3 w-3' />
                              Letras.mus.br
                            </>
                          ) : (
                            <>
                              <Music className='h-3 w-3' />
                              CifraClub
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className='flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100'>
                      <Play className='h-5 w-5 text-purple-400' />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </form>
  );
}

function SongListTable({ filteredLocalSongs, foundRemoteSongs, supabaseSongs, isSearching }) {
  const [allSongs, setAllSongs] = useState([]);
  const [order, setOrder] = useState('asc');

  const openLyricsWindow = (url, filePath) => {
    api?.openLyricsWindow(url, filePath);
  };

  useEffect(() => {
    // Combinar músicas locais, remotas e do Supabase
    const supabaseMapped = supabaseSongs.map(song => ({
      title: song.title,
      band: song.artist,
      url: null,
      filePath: null,
      isLocal: false,
      isSupabase: true,
      supabaseId: song.id,
    }));

    setAllSongs([...filteredLocalSongs, ...foundRemoteSongs, ...supabaseMapped]);
  }, [filteredLocalSongs, foundRemoteSongs, supabaseSongs]);

  const sortTableData = criteria => {
    setOrder(order => (order === 'asc' ? 'desc' : 'asc'));
    const orderValue = order === 'asc' ? -1 : 1;
    const sortedData = [...allSongs].sort((a, b) => {
      if (a[criteria].toLowerCase() < b[criteria].toLowerCase()) return -1 * orderValue;
      if (a[criteria].toLowerCase() > b[criteria].toLowerCase()) return 1 * orderValue;
      return 0;
    });

    setAllSongs(sortedData);
  };

  return (
    <div className='space-y-2'>
      {filteredLocalSongs.length || foundRemoteSongs.length ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm'>
          <div className='mb-2 flex items-center justify-between'>
            <h2 className='text-sm font-semibold text-white'>Músicas ({allSongs.length})</h2>
            <div className='flex gap-1.5 text-xs text-slate-400'>
              <button
                onClick={() => sortTableData('band')}
                className='rounded-md bg-white/5 px-2 py-1 transition-colors hover:bg-white/10'>
                Por Artista
              </button>
              <button
                onClick={() => sortTableData('title')}
                className='rounded-md bg-white/5 px-2 py-1 transition-colors hover:bg-white/10'>
                Por Título
              </button>
            </div>
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
                onClick={() => openLyricsWindow(song.url, song?.filePath)}
                className='group cursor-pointer rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-2.5 transition-all hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10 hover:shadow-lg hover:shadow-purple-500/20'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex flex-1 flex-col min-w-0'>
                    <h3
                      className={`truncate text-sm font-semibold ${song?.isLocal ? 'text-purple-300' : 'text-white'}`}>
                      {song.title}
                    </h3>
                    <p className='truncate text-xs text-slate-400'>{song.band}</p>
                  </div>
                  <div className='flex flex-col gap-0.5'>
                    {song?.isLocal && (
                      <span className='rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300'>
                        Local
                      </span>
                    )}
                    {song?.isSupabase && (
                      <span className='rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300'>
                        Cloud
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : null}
      {isSearching ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='flex items-center justify-center py-8'>
          <Loader2 className='h-8 w-8 animate-spin text-purple-500' />
        </motion.div>
      ) : null}
    </div>
  );
}

function Home() {
  const [foundRemoteSongs, setFoundRemoteSongs] = useState([]);
  const [supabaseSongs, setSupabaseSongs] = useState([]);
  const [defaultSlides, setDefaultSlides] = useState([]);
  const [filteredLocalSongs, setFilteredLocalSongs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const getAllLocalSongs = () =>
    api?.getAllLocalSongs()?.then(artistGroups => {
      setFoundRemoteSongs([]);
      const localSongs = artistGroups.flatMap(group =>
        group.songs.map(song => ({
          filePath: `${group.normalizedArtist}/${song.normalizedTitle}.txt`,
          title: song.title,
          band: group.artist,
          isLocal: true,
        }))
      );
      setFilteredLocalSongs(localSongs);
    });

  const getDefaultSlides = () =>
    api?.getDefaultSlides()?.then(songs => {
      setDefaultSlides(songs || []);
    });

  const loadSupabaseSongs = async () => {
    try {
      const songs = await getAllSongs();
      setSupabaseSongs(songs);
      console.log('✅ Supabase songs loaded:', songs.length);
    } catch (error) {
      console.error('❌ Error loading Supabase songs:', error);
    }
  };

  useEffect(() => {
    getAllLocalSongs();
    getDefaultSlides();
    loadSupabaseSongs();
  }, []);

  const openDefaultSlides = (url: string, filePath: string) => {
    api?.openLyricsWindow(url, filePath, true);
  };

  return (
    <div className='h-full'>
      <Head>
        <title>Início - Lyrics Slideshow</title>
      </Head>

      <div className='p-4'>
        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='mb-4 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm'>
          <h2 className='mb-2 text-sm font-semibold text-white'>Buscar Músicas</h2>
          <SearchForm
            {...{
              isSearching,
              setFoundRemoteSongs,
              setIsSearching,
            }}
          />
        </motion.div>

        {/* Default Slides Section */}
        {defaultSlides.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='mb-4 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm'>
            <h2 className='mb-2 text-sm font-semibold text-white'>Slides Padrão</h2>
            <div className='grid grid-cols-3 gap-2 md:grid-cols-6 lg:grid-cols-8'>
              {defaultSlides.map((item, index) => {
                const fileName = kebabToCapitalizeText(item.split(' - ')[0]);
                return (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => openDefaultSlides('', item)}
                      variant='secondary'
                      className='h-auto w-full flex-col gap-1 bg-gradient-to-br from-purple-500/20 to-pink-500/20 px-2 py-2 text-xs hover:from-purple-500/30 hover:to-pink-500/30'>
                      {fileName}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}



        {/* Songs List */}
        <SongListTable {...{ filteredLocalSongs, foundRemoteSongs, supabaseSongs, isSearching }} />
      </div>
    </div>
  );
}

export default Home;
