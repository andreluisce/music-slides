import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { createSong, updateSong } from '../lib/supabase-service';
import type { Song } from '../lib/supabase';

interface SongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  song?: Song | null;
}

export default function SongModal({ isOpen, onClose, onSave, song }: SongModalProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [lyricsLines, setLyricsLines] = useState<string[]>(['']);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (song) {
      setTitle(song.title);
      setArtist(song.artist);
      setLyricsLines(song.lyrics.length > 0 ? song.lyrics : ['']);
    } else {
      setTitle('');
      setArtist('');
      setLyricsLines(['']);
    }
  }, [song]);

  const handleAddLine = () => {
    setLyricsLines([...lyricsLines, '']);
  };

  const handleRemoveLine = (index: number) => {
    setLyricsLines(lyricsLines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, value: string) => {
    const newLines = [...lyricsLines];
    newLines[index] = value;
    setLyricsLines(newLines);
  };

  const handleSave = async () => {
    if (!title.trim() || !artist.trim()) return;

    setIsSaving(true);
    try {
      const filteredLyrics = lyricsLines.filter((line) => line.trim() !== '');

      if (song) {
        await updateSong(song.id, {
          title: title.trim(),
          artist: artist.trim(),
          lyrics: filteredLyrics,
        });
      } else {
        await createSong({
          title: title.trim(),
          artist: artist.trim(),
          lyrics: filteredLyrics,
          is_local: false,
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving song:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'>
      <div className='max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-purple-900 shadow-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-white/10 p-6'>
          <h2 className='text-2xl font-bold text-white'>
            {song ? 'Editar Música' : 'Nova Música'}
          </h2>
          <button
            onClick={onClose}
            className='rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white'>
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Content */}
        <div className='max-h-[calc(90vh-180px)] overflow-y-auto p-6'>
          <div className='space-y-4'>
            {/* Title */}
            <div>
              <Label htmlFor='title' className='text-slate-300'>
                Título
              </Label>
              <Input
                id='title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className='mt-1 border-white/20 bg-white/10 text-white placeholder:text-slate-400'
              />
            </div>

            {/* Artist */}
            <div>
              <Label htmlFor='artist' className='text-slate-300'>
                Artista
              </Label>
              <Input
                id='artist'
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className='mt-1 border-white/20 bg-white/10 text-white placeholder:text-slate-400'
              />
            </div>

            {/* Lyrics */}
            <div>
              <div className='mb-2 flex items-center justify-between'>
                <Label className='text-slate-300'>Letra (uma linha por slide)</Label>
                <Button
                  onClick={handleAddLine}
                  size='sm'
                  variant='outline'
                  className='border-white/20 bg-white/5 text-white hover:bg-white/10'>
                  <Plus className='mr-1 h-4 w-4' />
                  Adicionar Linha
                </Button>
              </div>
              <div className='space-y-2'>
                {lyricsLines.map((line, index) => (
                  <div key={index} className='flex gap-2'>
                    <Input
                      value={line}
                      onChange={(e) => handleLineChange(index, e.target.value)}
                      placeholder={`Linha ${index + 1}`}
                      className='border-white/20 bg-white/10 text-white placeholder:text-slate-400'
                    />
                    {lyricsLines.length > 1 && (
                      <Button
                        onClick={() => handleRemoveLine(index)}
                        size='sm'
                        variant='outline'
                        className='border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10'>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-3 border-t border-white/10 p-6'>
          <Button
            onClick={onClose}
            variant='outline'
            className='border-white/20 bg-white/5 text-white hover:bg-white/10'>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !artist.trim()}
            className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
