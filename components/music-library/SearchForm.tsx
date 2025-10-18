import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { XCircle } from '@phosphor-icons/react';
import { DisplaySong } from '../../types/song';

interface SearchFormProps {
  onSearch: (term: string) => void;
  loading: boolean;
  error: string | null;
  results: DisplaySong[];
}

export default function SearchForm({ onSearch, loading, error }: SearchFormProps) {
  const [searchTerm, setSearchTerm] = useState("Diante do Trono Me Ama");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
      <div className='flex gap-2'>
        <Input
          name='search'
          id='search'
          value={searchTerm}
          placeholder='Ex: Diante do Trono - Me Ama'
          className='h-10 border-white/20 bg-white/10 text-base text-white placeholder:text-slate-400 focus:border-magenta/50 focus:ring-2 focus:ring-magenta/20'
          onChange={event => setSearchTerm(event.target.value)}
          autoComplete='off'
        />
        <Button
          disabled={!searchTerm || loading}
          type='submit'
          size='lg'
          className={`h-10 px-6 text-base transition-all ${!searchTerm
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
            : 'bg-magenta hover:bg-magenta-600 text-white'
            }`}>
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>
      {!searchTerm && (
        <p className='text-xs text-slate-500 mt-1'>
          💡 Digite o nome da música ou artista para buscar online
        </p>
      )}

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='mt-3 space-y-2'>
          <div className='rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 mb-3'>
            <div className='flex items-center gap-3'>
              <div className='h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent' />
              <div className='flex-1'>
                <p className='text-sm font-semibold text-blue-300'>
                  Buscando músicas...
                </p>
                <p className='text-xs text-blue-400/70'>
                  Procurando nos nossos servidores e na internet
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {error && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='mt-3'>
          <div className={`rounded-lg border p-4 ${
            error.startsWith('💡')
              ? 'border-blue-500/30 bg-blue-500/10'
              : 'border-red-500/30 bg-red-500/10'
          }`}>
            <div className='flex items-center gap-3'>
              {error.startsWith('💡') ? (
                <div className='flex-shrink-0 text-blue-400'>
                  <span className='text-lg'>💡</span>
                </div>
              ) : (
                <XCircle size={20} weight='fill' className='flex-shrink-0 text-red-400' />
              )}
              <div className='flex-1'>
                <p className={`text-sm font-semibold ${
                  error.startsWith('💡') ? 'text-blue-300' : 'text-red-300'
                }`}>
                  {error}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </form>
  );
}
