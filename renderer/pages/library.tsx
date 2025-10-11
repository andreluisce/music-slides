import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Search, Music2, Plus, Filter, Edit, Trash2, Heart, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getAllSongs, deleteSong } from '../lib/supabase-service';
import { toggleFavorite, isFavorite } from '../lib/presentations-service';
import type { Song } from '../lib/supabase';
import SongModal from '../components/SongModal';

export default function Library() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSongs();
    loadFavorites();
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

  const loadFavorites = async () => {
    // Load favorite status for all songs
    // For now, we'll check as needed
  };

  const handleToggleFavorite = async (songId: string) => {
    try {
      await toggleFavorite('song', songId);
      const isFav = await isFavorite('song', songId);
      setFavorites((prev) => {
        const newFavs = new Set(prev);
        if (isFav) {
          newFavs.add(songId);
        } else {
          newFavs.delete(songId);
        }
        return newFavs;
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    if (!confirm('Deseja realmente deletar esta música?')) return;

    try {
      await deleteSong(songId);
      loadSongs();
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };

  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setIsModalOpen(true);
  };

  const handleNewSong = () => {
    setEditingSong(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSong(null);
  };

  const handleModalSave = () => {
    loadSongs();
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
          <Button
            onClick={handleNewSong}
            className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
            <Plus className='mr-2 h-4 w-4' />
            Nova Música
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
                className='group rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-4 transition-all hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10 hover:shadow-lg hover:shadow-purple-500/20'>
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
                <div className='mt-3 flex gap-2'>
                  <Button
                    onClick={() => handleToggleFavorite(song.id)}
                    size='sm'
                    variant='outline'
                    className={`flex-1 border-white/20 ${
                      favorites.has(song.id)
                        ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}>
                    <Heart className={`h-4 w-4 ${favorites.has(song.id) ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    onClick={() => handleEditSong(song)}
                    size='sm'
                    variant='outline'
                    className='flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10'>
                    <Edit className='h-4 w-4' />
                  </Button>
                  <Button
                    onClick={() => handleDeleteSong(song.id)}
                    size='sm'
                    variant='outline'
                    className='border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10'>
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <SongModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          song={editingSong}
        />
      </div>
    </div>
  );
}
