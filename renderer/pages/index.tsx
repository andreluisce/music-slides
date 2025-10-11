import React, { Fragment, useEffect, useState } from 'react';
import Head from 'next/head';
import { SearchType } from '../shared/types';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getAllSongs, createSong } from '../lib/supabase-service';

const api = typeof window !== 'undefined' ? window.api : undefined;

function kebabToCapitalizeText(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

function SearchForm({ isSearching, setFoundRemoteSongs, setIsSearching }) {
  const [searchTerm, setSearchTerm] = useState('');

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFoundRemoteSongs([]);
    setIsSearching(true);
    try {
      const result = await api?.smartLyricsSearch(searchTerm.trim());

      setIsSearching(false);

      if (result && Array.isArray(result)) {
        setFoundRemoteSongs(songs => [...songs, ...result]);
      }
    } catch (error) {
      console.error('Error searching lyrics:', error);
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={submitForm} className='grid grid-cols-1 gap-4 md:grid-cols-3'>
      <div className='flex flex-col gap-2 col-span-2'>
        <Label htmlFor='search' className='text-slate-300'>
          Buscar Músicas
        </Label>
        <Input
          name='search'
          id='search'
          value={searchTerm}
          placeholder='Ex: Diante do trono Clame ao Senhor ou aquela música sobre esperança'
          className='border-white/20 bg-white/10 text-white placeholder:text-slate-400'
          onChange={event => {
            const text = event.target.value;
            setSearchTerm(text);
          }}
        />
      </div>

      <div className='flex items-end'>
        <Button
          disabled={!searchTerm || isSearching}
          type='submit'
          className='w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'>
          {isSearching ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>
    </form>
  );
}

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

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
    <div className='space-y-4'>
      {filteredLocalSongs.length || foundRemoteSongs.length ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Music className='h-6 w-6 text-blue-400' />
              <h2 className='text-xl font-semibold text-white'>Músicas ({allSongs.length})</h2>
            </div>
            <div className='flex gap-2 text-sm text-slate-400'>
              <button
                onClick={() => sortTableData('band')}
                className='rounded-lg bg-white/5 px-3 py-1 transition-colors hover:bg-white/10'>
                Ordenar por Artista
              </button>
              <button
                onClick={() => sortTableData('title')}
                className='rounded-lg bg-white/5 px-3 py-1 transition-colors hover:bg-white/10'>
                Ordenar por Título
              </button>
            </div>
          </div>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
            {allSongs.map((song, index) => (
              <motion.div
                key={song.url || song.filePath}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openLyricsWindow(song.url, song?.filePath)}
                className='group cursor-pointer rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-4 transition-all hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10 hover:shadow-lg hover:shadow-purple-500/20'>
                <div className='flex items-start gap-3'>
                  <div className='mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30'>
                    <Music2 className='h-5 w-5 text-purple-300' />
                  </div>
                  <div className='flex flex-1 flex-col'>
                    <h3
                      className={`text-lg font-semibold ${song?.isLocal ? 'text-purple-300' : 'text-white'}`}>
                      {song.title}
                    </h3>
                    <p className='mt-1 text-sm text-slate-400'>{song.band}</p>
                  </div>
                  <div className='flex flex-col gap-1'>
                    {song?.isLocal && (
                      <span className='rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-300'>
                        Local
                      </span>
                    )}
                    {song?.isSupabase && (
                      <span className='rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-300'>
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
          className='flex items-center justify-center py-12'>
          <Loader2 className='h-12 w-12 animate-spin text-purple-500' />
        </motion.div>
      ) : null}
    </div>
  );
}

import { Loader2, Music, Search, RefreshCw, Play, Music2 } from 'lucide-react';

function Home() {
  const [foundRemoteSongs, setFoundRemoteSongs] = useState([]);
  const [supabaseSongs, setSupabaseSongs] = useState([]);

  const [defaultSlides, setDefaultSlides] = useState([]);
  const [filteredLocalSongs, setFilteredLocalSongs] = useState([]);

  const [isSearching, setIsSearching] = useState(false);

  const getAllLocalSongs = () =>
    api?.getAllLocalSongs()?.then(songs => {
      setFoundRemoteSongs([]);
      setFilteredLocalSongs(
        songs.map(song => {
          const songArray = song?.replaceAll('.txt', '')?.split?.(' - ');
          return {
            filePath: song,
            title: songArray[1],
            band: songArray[0],
            isLocal: true,
          };
        })
      );
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

      <div className='p-8'>
        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
          <div className='mb-4 flex items-center gap-2'>
            <Search className='h-6 w-6 text-purple-400' />
            <h2 className='text-xl font-semibold text-white'>Buscar Músicas</h2>
          </div>
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
            className='mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
            <div className='mb-4 flex items-center gap-2'>
              <Play className='h-6 w-6 text-pink-400' />
              <h2 className='text-xl font-semibold text-white'>Slides Padrão</h2>
            </div>
            <div className='grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6'>
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
                      className='h-auto w-full flex-col gap-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 hover:from-purple-500/30 hover:to-pink-500/30'>
                      {fileName}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='mb-6 flex gap-3'>
          <Button
            onClick={getAllLocalSongs}
            className='flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
            <RefreshCw className='h-4 w-4' />
            Atualizar Músicas Locais
          </Button>
        </motion.div>

        {/* Songs List */}
        <SongListTable {...{ filteredLocalSongs, foundRemoteSongs, supabaseSongs, isSearching }} />
      </div>
    </div>
  );
}

export default Home;
