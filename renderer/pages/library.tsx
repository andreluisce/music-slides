import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Music, RefreshCw, Plus, Edit, Trash2, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';

const api = typeof window !== 'undefined' ? window.api : undefined;

function ArtistFolder({ artist, songs, isExpanded, onToggle, onRefresh }) {
  const router = useRouter();

  const openLyricsWindow = (url, filePath) => {
    console.log('🎵 Library: Opening lyrics window - url:', url, 'filePath:', filePath);
    
    // Validate inputs before calling API
    const validUrl = url && typeof url === 'string' && url.trim().length > 0;
    const validFilePath = filePath && typeof filePath === 'string' && filePath.trim().length > 0;
    
    if (!validUrl && !validFilePath) {
      console.warn('⚠️ Library: Cannot open lyrics - no valid URL or filePath provided');
      alert('Erro: Não foi possível abrir a música. Caminho do arquivo inválido.');
      return;
    }
    
    api?.openLyricsWindow(url, filePath);
  };

  const handleEdit = (song) => {
    // Navigate to edit page with query params
    router.push(`/create-song?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(song.title)}&edit=true`);
  };

  const handleEditMetadata = (song) => {
    // Navigate to metadata editor
    router.push(`/edit-metadata?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(song.title)}`);
  };

  const handleDelete = async (song) => {
    if (!api?.deleteSong) {
      alert('API de deleção não disponível');
      return;
    }

    const confirmed = confirm(`Deseja realmente deletar "${song.title}" de ${artist}?`);
    if (!confirmed) return;

    try {
      const result = await api.deleteSong(artist, song.title);

      if (result.success) {
        console.log('✅ Música deletada:', artist, '-', song.title);
        alert('Música deletada com sucesso!');
        // Refresh the list
        if (onRefresh) onRefresh();
      } else {
        console.error('❌ Erro ao deletar:', result.error);
        alert(`Erro ao deletar música: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar música:', error);
      alert('Erro ao deletar música. Verifique o console para mais detalhes.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className='rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden'>
      {/* Artist Header */}
      <button
        onClick={onToggle}
        className='w-full flex items-center gap-2 p-2.5 hover:bg-white/5 transition-colors'>
        {isExpanded ? (
          <ChevronDown className='h-4 w-4 text-purple-400' />
        ) : (
          <ChevronRight className='h-4 w-4 text-purple-400' />
        )}
        <div className='flex-1 text-left'>
          <h3 className='text-sm font-semibold text-white'>{artist}</h3>
          <p className='text-xs text-slate-400'>{songs.length} música{songs.length !== 1 ? 's' : ''}</p>
        </div>
      </button>

      {/* Songs List */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className='border-t border-white/10'>
          <div className='p-2 space-y-1'>
            {songs.map((song, index) => (
              <motion.div
                key={song.filePath}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className='group relative cursor-pointer rounded-md border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-2 transition-all hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10 hover:shadow-lg hover:shadow-purple-500/20'>
                <div className='flex items-center gap-2' onClick={() => openLyricsWindow(null, song.filePath)}>
                  <div className='flex-1'>
                    <h4 className='text-sm font-medium text-purple-300'>{song.title}</h4>
                  </div>
                  <span className='rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300'>
                    Local
                  </span>
                </div>
                {/* CRUD Buttons */}
                <div className='mt-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(song);
                    }}
                    className='flex flex-1 items-center justify-center gap-1 rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300 transition-colors hover:bg-blue-500/30'>
                    <Edit className='h-3 w-3' />
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditMetadata(song);
                    }}
                    className='flex flex-1 items-center justify-center gap-1 rounded-md bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300 transition-colors hover:bg-purple-500/30'>
                    <Settings className='h-3 w-3' />
                    Metadados
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(song);
                    }}
                    className='flex flex-1 items-center justify-center gap-1 rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-300 transition-colors hover:bg-red-500/30'>
                    <Trash2 className='h-3 w-3' />
                    Deletar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function Library() {
  const router = useRouter();
  const [artistGroups, setArtistGroups] = useState([]);
  const [expandedArtists, setExpandedArtists] = useState({});

  const getAllLocalSongs = () =>
    api?.getAllLocalSongs()?.then(groups => {
      setArtistGroups(groups || []);
      // Expand all artists by default
      const expanded = {};
      groups?.forEach(group => {
        expanded[group.artist] = true;
      });
      setExpandedArtists(expanded);
    });


  const toggleArtist = (artist) => {
    setExpandedArtists(prev => ({
      ...prev,
      [artist]: !prev[artist]
    }));
  };

  const totalSongs = artistGroups.reduce((acc, group) => acc + group.songs.length, 0);

  useEffect(() => {
    getAllLocalSongs();
  }, []);

  return (
    <div className='h-full'>
      <Head>
        <title>Biblioteca - Lyrics Slideshow</title>
      </Head>

      <div className='p-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='mb-4 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm'>
          <div className='mb-2 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <h2 className='text-sm font-semibold text-white'>Minha Biblioteca</h2>
              <span className='rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300'>
                {artistGroups.length} artista{artistGroups.length !== 1 ? 's' : ''} • {totalSongs} música{totalSongs !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className='mb-3 flex gap-2'>
            <Button
              onClick={() => router.push('/create-song')}
              size='sm'
              className='flex items-center gap-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-xs hover:from-green-700 hover:to-emerald-700'>
              <Plus className='h-3.5 w-3.5' />
              Nova Música
            </Button>
            <Button
              onClick={getAllLocalSongs}
              size='sm'
              className='flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-xs hover:from-purple-700 hover:to-pink-700'>
              <RefreshCw className='h-3.5 w-3.5' />
              Atualizar
            </Button>
          </div>

          {/* Artist Folders */}
          <div className='grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3'>
            {artistGroups.length > 0 ? (
              artistGroups.map((group) => (
                <ArtistFolder
                  key={group.artist}
                  artist={group.artist}
                  songs={group.songs}
                  isExpanded={expandedArtists[group.artist]}
                  onToggle={() => toggleArtist(group.artist)}
                  onRefresh={getAllLocalSongs}
                />
              ))
            ) : (
              <div className='py-8 text-center'>
                <Music className='h-8 w-8 mx-auto mb-3 text-slate-500' />
                <p className='text-sm text-slate-400'>Nenhuma música encontrada</p>
                <p className='text-xs text-slate-500 mt-1'>Clique em "Nova Música" para adicionar</p>
              </div>
            )}
          </div>

        </motion.div>
      </div>
    </div>
  );
}

export default Library;