import React, { useState, useEffect } from 'react';
import { X, Plus, Trash, MagnifyingGlass, Sparkle, CheckCircle, Warning, XCircle } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { createSong, updateSong } from '../lib/supabase-service';
import type { Song } from '../lib/supabase';

const api = typeof window !== 'undefined' ? (window as any).api : undefined;

interface SongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  song?: Song | null;
}

interface SearchResult {
  title: string;
  artist: string;
  url: string;
  source: 'letrasmusic' | 'cifraclub';
}

export default function SongModal({ isOpen, onClose, onSave, song }: SongModalProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [lyricsLines, setLyricsLines] = useState<string[]>(['']);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState<string>('');
  const [searchSuccess, setSearchSuccess] = useState(false);

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
    // Reset search state when modal opens/closes
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearching(false);
    setIsFetchingLyrics(false);
    setSearchError('');
    setSearchSuccess(false);
  }, [song, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

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

  const handleSearchLyrics = async () => {
    if (!title.trim() && !artist.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchError('');
    setSearchSuccess(false);

    try {
      const searchQuery = `${artist} ${title}`.trim();
      const results = await api?.fastLyricsSearch(searchQuery);

      if (results && results.length > 0) {
        setSearchResults(results);
        setShowSearchResults(true);
        setSearchSuccess(false);
      } else {
        setSearchError('Nenhuma música encontrada. Tente buscar com termos diferentes.');
      }
    } catch (error) {
      console.error('❌ Error searching lyrics:', error);
      setSearchError('Erro ao buscar músicas. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSong = async (result: SearchResult) => {
    setIsFetchingLyrics(true);
    setShowSearchResults(false);
    setSearchError('');
    setSearchSuccess(false);

    try {
      const fullResult = await api?.fetchLyricsByUrl(result.url, result.source);
      if (fullResult) {
        setTitle(fullResult.title);
        setArtist(fullResult.artist);
        // Split lyrics by line breaks and filter empty lines
        const lines = fullResult.lyrics.split('\n').filter((line: string) => line.trim() !== '');
        setLyricsLines(lines.length > 0 ? lines : ['']);
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
      setIsFetchingLyrics(false);
    }
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
      // console.error('Error saving song:', error);
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
            <X size={20} weight='bold' />
          </button>
        </div>

        {/* Content */}
        <div className='max-h-[calc(90vh-180px)] overflow-y-auto p-6'>
          <div className='space-y-4'>
            {/* Search Button */}
            {!song && (
              <div className='rounded-lg border border-purple-500/30 bg-purple-500/10 p-4'>
                <div className='flex items-center gap-3'>
                  <Sparkle size={20} weight='fill' className='text-purple-400' />
                  <div className='flex-1'>
                    <p className='text-sm font-semibold text-purple-300'>
                      Buscar letra automaticamente
                    </p>
                    <p className='text-xs text-purple-400/70'>
                      Digite o título e/ou artista e clique em buscar
                    </p>
                  </div>
                  <Button
                    onClick={handleSearchLyrics}
                    disabled={isSearching || isFetchingLyrics || (!title.trim() && !artist.trim())}
                    size='sm'
                    className='bg-purple-600 hover:bg-purple-700'
                  >
                    <MagnifyingGlass size={16} weight='bold' className='mr-2' />
                    {isSearching ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>
              </div>
            )}

            {/* Searching State */}
            {isSearching && (
              <div className='rounded-lg border border-blue-500/30 bg-blue-500/10 p-4'>
                <div className='flex items-center gap-3'>
                  <div className='h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent' />
                  <div className='flex-1'>
                    <p className='text-sm font-semibold text-blue-300'>
                      Buscando músicas...
                    </p>
                    <p className='text-xs text-blue-400/70'>
                      Isso pode levar alguns segundos
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Search Error */}
            {searchError && !isSearching && (
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
                    className='text-red-400 hover:text-red-300'
                  >
                    <X size={16} weight='bold' />
                  </button>
                </div>
              </div>
            )}

            {/* Search Success */}
            {searchSuccess && !isFetchingLyrics && (
              <div className='rounded-lg border border-green-500/30 bg-green-500/10 p-4'>
                <div className='flex items-center gap-3'>
                  <CheckCircle size={20} weight='fill' className='text-green-400' />
                  <div className='flex-1'>
                    <p className='text-sm font-semibold text-green-300'>
                      Letra carregada com sucesso!
                    </p>
                    <p className='text-xs text-green-400/70'>
                      Você pode editar a letra antes de salvar
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className='rounded-lg border border-white/10 bg-white/5 p-4'>
                <h3 className='mb-3 text-sm font-semibold text-white'>
                  Selecione a música ({searchResults.length} resultados)
                </h3>
                <div className='max-h-60 space-y-2 overflow-y-auto'>
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSong(result)}
                      className='group w-full rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-3 text-left transition-all hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10'
                    >
                      <p className='truncate text-sm font-semibold text-white transition-colors group-hover:text-purple-300'>
                        {result.title}
                      </p>
                      <p className='truncate text-xs text-slate-400 transition-colors group-hover:text-slate-300'>
                        {result.artist}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fetching Lyrics Loading */}
            {isFetchingLyrics && (
              <div className='rounded-lg border border-white/10 bg-white/5 p-4 text-center'>
                <div className='flex items-center justify-center gap-2 text-sm text-white'>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent' />
                  Carregando letra...
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <Label htmlFor='title' className='text-slate-300'>
                Título
              </Label>
              <Input
                id='title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Ex: Me Ama'
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
                placeholder='Ex: Diante do Trono'
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
                  <Plus size={16} weight='bold' className='mr-1' />
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
                        <Trash size={16} weight='bold' />
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
