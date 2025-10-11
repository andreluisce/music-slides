import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Search, Music2, Plus, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getAllSongs } from '../lib/supabase-service';

export default function Library() {
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    setIsLoading(true);
    try {
      const data = await getAllSongs();
      setSongs(data);
    } catch (error) {
      console.error('Error loading songs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='h-full'>
      <Head>
        <title>Biblioteca - Lyrics Slideshow</title>
      </Head>

      <div className='p-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-white'>Biblioteca de Músicas</h1>
          <p className='mt-2 text-slate-400'>Gerencie todas as suas músicas em um só lugar</p>
        </div>

        {/* Actions Bar */}
        <div className='mb-6 flex items-center gap-4'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
            <Input
              type='text'
              placeholder='Buscar músicas...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='border-white/20 bg-white/10 pl-10 text-white placeholder:text-slate-400'
            />
          </div>
          <Button className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
            <Plus className='mr-2 h-4 w-4' />
            Nova Música
          </Button>
          <Button variant='outline' className='border-white/20 bg-white/5 text-white hover:bg-white/10'>
            <Filter className='mr-2 h-4 w-4' />
            Filtros
          </Button>
        </div>

        {/* Songs Grid */}
        {isLoading ? (
          <div className='flex h-64 items-center justify-center'>
            <div className='text-slate-400'>Carregando...</div>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className='flex h-64 flex-col items-center justify-center'>
            <Music2 className='h-16 w-16 text-slate-600' />
            <p className='mt-4 text-slate-400'>
              {searchQuery ? 'Nenhuma música encontrada' : 'Nenhuma música na biblioteca'}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {filteredSongs.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className='group cursor-pointer rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-4 transition-all hover:scale-105 hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10 hover:shadow-lg hover:shadow-purple-500/20'>
                <div className='flex items-start gap-3'>
                  <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30'>
                    <Music2 className='h-6 w-6 text-purple-300' />
                  </div>
                  <div className='flex-1 overflow-hidden'>
                    <h3 className='truncate text-lg font-semibold text-white'>{song.title}</h3>
                    <p className='truncate text-sm text-slate-400'>{song.artist}</p>
                    <p className='mt-2 text-xs text-slate-500'>{song.lyrics?.length || 0} linhas</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
