import React, { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Book, Search, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const api = typeof window !== 'undefined' ? window.api : undefined;

export default function Bible() {
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!book.trim() || !chapter.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const response = await api?.getBibleVerse(book, chapter, verse);
      setResult(response);
    } catch (error) {
      console.error('Error searching Bible verse:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className='h-full'>
      <Head>
        <title>Bíblia - Lyrics Slideshow</title>
      </Head>

      <div className='p-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-white'>Busca Bíblica</h1>
          <p className='mt-2 text-slate-400'>Pesquise versículos para adicionar às apresentações</p>
        </div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
          <div className='mb-4 flex items-center gap-2'>
            <Search className='h-6 w-6 text-purple-400' />
            <h2 className='text-xl font-semibold text-white'>Pesquisar Versículo</h2>
          </div>

          <form onSubmit={handleSearch} className='grid grid-cols-1 gap-4 md:grid-cols-4'>
            <div className='md:col-span-2'>
              <Label htmlFor='book' className='text-slate-300'>
                Livro
              </Label>
              <Input
                id='book'
                value={book}
                onChange={(e) => setBook(e.target.value)}
                placeholder='Ex: João, Salmos, Gênesis'
                className='mt-1 border-white/20 bg-white/10 text-white placeholder:text-slate-400'
              />
            </div>

            <div>
              <Label htmlFor='chapter' className='text-slate-300'>
                Capítulo
              </Label>
              <Input
                id='chapter'
                type='number'
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder='Ex: 3'
                className='mt-1 border-white/20 bg-white/10 text-white placeholder:text-slate-400'
              />
            </div>

            <div>
              <Label htmlFor='verse' className='text-slate-300'>
                Versículo (opcional)
              </Label>
              <Input
                id='verse'
                value={verse}
                onChange={(e) => setVerse(e.target.value)}
                placeholder='Ex: 16'
                className='mt-1 border-white/20 bg-white/10 text-white placeholder:text-slate-400'
              />
            </div>

            <div className='md:col-span-4'>
              <Button
                type='submit'
                disabled={!book.trim() || !chapter.trim() || isSearching}
                className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
                <Search className='mr-2 h-4 w-4' />
                {isSearching ? 'Buscando...' : 'Buscar Versículo'}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-sm'>
            <div className='mb-4 flex items-center gap-2'>
              <BookOpen className='h-6 w-6 text-pink-400' />
              <h2 className='text-xl font-semibold text-white'>{result.reference}</h2>
            </div>

            <div className='space-y-3'>
              {Array.isArray(result.text) ? (
                result.text.map((verse: string, index: number) => (
                  <p key={index} className='text-lg leading-relaxed text-slate-200'>
                    <span className='mr-2 font-semibold text-purple-400'>{index + 1}.</span>
                    {verse}
                  </p>
                ))
              ) : (
                <p className='text-lg leading-relaxed text-slate-200'>{result.text}</p>
              )}
            </div>

            <div className='mt-6 flex gap-3'>
              <Button
                variant='outline'
                className='border-purple-500/20 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'>
                <BookOpen className='mr-2 h-4 w-4' />
                Adicionar à Apresentação
              </Button>
              <Button
                variant='outline'
                onClick={() => setResult(null)}
                className='border-white/20 bg-white/5 text-white hover:bg-white/10'>
                Nova Busca
              </Button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!result && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='flex h-96 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm'>
            <Book className='h-16 w-16 text-slate-600' />
            <h3 className='mt-4 text-lg font-semibold text-white'>Nenhuma busca realizada</h3>
            <p className='mt-2 text-center text-sm text-slate-400'>
              Digite o livro, capítulo e versículo
              <br />
              para buscar na Bíblia
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
