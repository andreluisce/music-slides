import React, { useState } from 'react';
import Head from 'next/head';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Sparkles } from 'lucide-react';

const api = typeof window !== 'undefined' ? window.api : undefined;

export default function SongDiscovery() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ title: string; artist: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const songs = await api?.discoverSongs(query);
      setResults(songs || []);
    } catch (error) {
      console.error('Error discovering songs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='h-full p-4'>
      <Head>
        <title>Descobrir Músicas - Lyrics Slideshow</title>
      </Head>

      <div className='mb-4'>
        <h1 className='text-xl font-bold text-white'>Descobrir Músicas com IA</h1>
        <p className='mt-1 text-xs text-slate-400'>
          Digite um tema, um sentimento ou um versículo bíblico para encontrar músicas.
        </p>
      </div>

      <div className='flex gap-2'>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Ex: Graça, adoração, Salmos 23'
          className='border-white/20 bg-white/10 text-white placeholder:text-slate-400'
        />
        <Button
          onClick={handleSearch}
          disabled={isLoading}
          className='bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600'>
          <Sparkles className='mr-2 h-4 w-4' />
          {isLoading ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      <div className='mt-4'>
        {results.length > 0 && (
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
            {results.map((song, index) => (
              <div key={index} className='rounded-lg border border-white/10 bg-white/5 p-3'>
                <h3 className='font-semibold text-white'>{song.title}</h3>
                <p className='text-sm text-slate-400'>{song.artist}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
