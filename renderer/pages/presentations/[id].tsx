import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Music2,
  FileText,
  Play,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  getPresentationById,
  updatePresentation,
  getPresentationItems,
  addItemToPresentation,
  deletePresentationItem,
  reorderPresentationItems,
} from '../../lib/presentations-service';
import { getAllSongs } from '../../lib/supabase-service';
import type { Presentation, PresentationItem, Song } from '../../lib/supabase';

const api = typeof window !== 'undefined' ? window.api : undefined;

export default function PresentationEditor() {
  const router = useRouter();
  const { id } = router.query;

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [items, setItems] = useState<PresentationItem[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [localSongs, setLocalSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [presentationName, setPresentationName] = useState('');
  const [showSongLibrary, setShowSongLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadPresentation(id);
      loadSongs();
      loadLocalSongs();
    }
  }, [id]);

  const loadPresentation = async (presentationId: string) => {
    setIsLoading(true);
    try {
      const data = await getPresentationById(presentationId);
      if (data) {
        setPresentation(data);
        setPresentationName(data.name);
        const itemsData = await getPresentationItems(presentationId);
        setItems(itemsData);
      }
    } catch (error) {
      console.error('Error loading presentation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSongs = async () => {
    try {
      const data = await getAllSongs();
      setSongs(data);
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  const loadLocalSongs = async () => {
    try {
      const artistGroups = await api?.getAllLocalSongs();
      if (artistGroups) {
        const flattenedSongs = artistGroups.flatMap(group =>
          group.songs.map(song => ({
            title: song.title,
            artist: group.artist,
            filePath: `${group.normalizedArtist}/${song.normalizedTitle}.txt`,
            isLocal: true,
          }))
        );
        setLocalSongs(flattenedSongs);
      }
    } catch (error) {
      console.error('Error loading local songs:', error);
    }
  };

  const handleSaveName = async () => {
    if (!presentation || !presentationName.trim()) return;

    setIsSaving(true);
    try {
      await updatePresentation(presentation.id, { name: presentationName });
      setEditingName(false);
      setPresentation({ ...presentation, name: presentationName });
    } catch (error) {
      console.error('Error updating presentation name:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSong = async (song: Song) => {
    if (!presentation) return;

    try {
      const newItem = await addItemToPresentation({
        presentation_id: presentation.id,
        item_type: 'song',
        song_id: song.id,
        order_index: items.length,
      });

      setItems([...items, { ...newItem, song }]);
      setShowSongLibrary(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding song:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await deletePresentationItem(itemId);
      setItems(items.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order_index: index,
    }));

    setItems(updatedItems);

    try {
      await reorderPresentationItems(
        updatedItems.map((item) => ({ id: item.id, order_index: item.order_index }))
      );
    } catch (error) {
      console.error('Error reordering items:', error);
    }
  };

  // Combine Supabase and local songs
  const allSongs = [
    ...songs.map(s => ({ ...s, isLocal: false })),
    ...localSongs
  ];

  const filteredSongs = allSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-slate-400'>Carregando...</div>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-slate-400'>Apresentação não encontrada</div>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-col'>
      <Head>
        <title>{presentation.name} - Editor</title>
      </Head>

      {/* Header */}
      <div className='border-b border-white/10 bg-black/20 p-6 backdrop-blur-sm'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Link href='/presentations'>
              <Button
                variant='outline'
                size='sm'
                className='border-white/20 bg-white/5 text-white hover:bg-white/10'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Voltar
              </Button>
            </Link>
            {editingName ? (
              <div className='flex items-center gap-2'>
                <Input
                  value={presentationName}
                  onChange={(e) => setPresentationName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className='border-white/20 bg-white/10 text-white'
                  autoFocus
                />
                <Button
                  onClick={handleSaveName}
                  disabled={isSaving}
                  size='sm'
                  className='bg-gradient-to-r from-purple-600 to-pink-600'>
                  <Save className='h-4 w-4' />
                </Button>
              </div>
            ) : (
              <h1
                onClick={() => setEditingName(true)}
                className='cursor-pointer text-2xl font-bold text-white hover:text-purple-400'>
                {presentation.name}
              </h1>
            )}
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={() => setShowSongLibrary(!showSongLibrary)}
              className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'>
              <Plus className='mr-2 h-4 w-4' />
              Adicionar Música
            </Button>
            <Button
              variant='outline'
              className='border-white/20 bg-white/5 text-white hover:bg-white/10'>
              <Play className='mr-2 h-4 w-4' />
              Apresentar
            </Button>
          </div>
        </div>
      </div>

      <div className='flex flex-1 overflow-hidden'>
        {/* Main Content */}
        <div className='flex-1 overflow-y-auto p-6'>
          {items.length === 0 ? (
            <div className='flex h-full flex-col items-center justify-center'>
              <Music2 className='h-16 w-16 text-slate-600' />
              <h3 className='mt-4 text-lg font-semibold text-white'>Apresentação vazia</h3>
              <p className='mt-2 text-center text-sm text-slate-400'>
                Adicione músicas ou slides personalizados
                <br />
                para começar a criar sua apresentação
              </p>
              <Button
                onClick={() => setShowSongLibrary(true)}
                className='mt-6 bg-gradient-to-r from-purple-600 to-pink-600'>
                <Plus className='mr-2 h-4 w-4' />
                Adicionar Primeira Música
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId='presentation-items'>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className='space-y-2'>
                    {items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`rounded-lg border border-white/10 bg-white/5 p-4 transition-all ${
                              snapshot.isDragging
                                ? 'shadow-lg shadow-purple-500/20'
                                : 'hover:bg-white/10'
                            }`}>
                            <div className='flex items-center gap-3'>
                              <div
                                {...provided.dragHandleProps}
                                className='cursor-grab text-slate-400 hover:text-white active:cursor-grabbing'>
                                <GripVertical className='h-5 w-5' />
                              </div>
                              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30'>
                                {item.item_type === 'song' ? (
                                  <Music2 className='h-5 w-5 text-purple-300' />
                                ) : (
                                  <FileText className='h-5 w-5 text-purple-300' />
                                )}
                              </div>
                              <div className='flex-1'>
                                {item.item_type === 'song' && item.song && (
                                  <>
                                    <h4 className='font-semibold text-white'>{item.song.title}</h4>
                                    <p className='text-sm text-slate-400'>{item.song.artist}</p>
                                  </>
                                )}
                              </div>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleRemoveItem(item.id)}
                                className='border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10'>
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        {/* Sidebar - Song Library */}
        <AnimatePresence>
          {showSongLibrary && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className='w-96 border-l border-white/10 bg-black/20 p-6 backdrop-blur-sm'>
              <div className='mb-4 flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-white'>Biblioteca</h3>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowSongLibrary(false)}
                  className='border-white/20 bg-white/5 text-white hover:bg-white/10'>
                  Fechar
                </Button>
              </div>
              <Input
                type='text'
                placeholder='Buscar músicas...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='mb-4 border-white/20 bg-white/10 text-white placeholder:text-slate-400'
              />
              <div className='space-y-2 overflow-y-auto'>
                {filteredSongs.map((song, index) => (
                  <div
                    key={song.id || `local-${index}`}
                    onClick={() => handleAddSong(song)}
                    className='cursor-pointer rounded-lg border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1'>
                        <h4 className='font-semibold text-white'>{song.title}</h4>
                        <p className='text-sm text-slate-400'>{song.artist}</p>
                      </div>
                      {song.isLocal && (
                        <span className='rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300'>
                          Local
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {filteredSongs.length === 0 && (
                  <div className='py-8 text-center text-slate-400'>Nenhuma música encontrada</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
