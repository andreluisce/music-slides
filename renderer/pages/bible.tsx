import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Book, Search, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Combobox, type ComboboxOption } from '../components/ui/combobox';

const api = typeof window !== 'undefined' ? window.api : undefined;

// Comprehensive list of Bible books with abbreviations
const BIBLE_BOOKS = {
  oldTestament: [
    { name: 'Gênesis', abbr: 'gn', en: 'genesis' },
    { name: 'Êxodo', abbr: 'ex', en: 'exodus' },
    { name: 'Levítico', abbr: 'lv', en: 'leviticus' },
    { name: 'Números', abbr: 'nm', en: 'numbers' },
    { name: 'Deuteronômio', abbr: 'dt', en: 'deuteronomy' },
    { name: 'Josué', abbr: 'js', en: 'joshua' },
    { name: 'Juízes', abbr: 'jz', en: 'judges' },
    { name: 'Rute', abbr: 'rt', en: 'ruth' },
    { name: '1 Samuel', abbr: '1sm', en: '1samuel' },
    { name: '2 Samuel', abbr: '2sm', en: '2samuel' },
    { name: '1 Reis', abbr: '1rs', en: '1kings' },
    { name: '2 Reis', abbr: '2rs', en: '2kings' },
    { name: '1 Crônicas', abbr: '1cr', en: '1chronicles' },
    { name: '2 Crônicas', abbr: '2cr', en: '2chronicles' },
    { name: 'Esdras', abbr: 'ed', en: 'ezra' },
    { name: 'Neemias', abbr: 'ne', en: 'nehemiah' },
    { name: 'Ester', abbr: 'et', en: 'esther' },
    { name: 'Jó', abbr: 'job', en: 'job' },
    { name: 'Salmos', abbr: 'sl', en: 'psalms' },
    { name: 'Provérbios', abbr: 'pv', en: 'proverbs' },
    { name: 'Eclesiastes', abbr: 'ec', en: 'ecclesiastes' },
    { name: 'Cânticos', abbr: 'ct', en: 'song' },
    { name: 'Isaías', abbr: 'is', en: 'isaiah' },
    { name: 'Jeremias', abbr: 'jr', en: 'jeremiah' },
    { name: 'Lamentações', abbr: 'lm', en: 'lamentations' },
    { name: 'Ezequiel', abbr: 'ez', en: 'ezekiel' },
    { name: 'Daniel', abbr: 'dn', en: 'daniel' },
    { name: 'Oséias', abbr: 'os', en: 'hosea' },
    { name: 'Joel', abbr: 'jl', en: 'joel' },
    { name: 'Amós', abbr: 'am', en: 'amos' },
    { name: 'Obadias', abbr: 'ob', en: 'obadiah' },
    { name: 'Jonas', abbr: 'jn', en: 'jonah' },
    { name: 'Miquéias', abbr: 'mq', en: 'micah' },
    { name: 'Naum', abbr: 'na', en: 'nahum' },
    { name: 'Habacuque', abbr: 'hc', en: 'habakkuk' },
    { name: 'Sofonias', abbr: 'sf', en: 'zephaniah' },
    { name: 'Ageu', abbr: 'ag', en: 'haggai' },
    { name: 'Zacarias', abbr: 'zc', en: 'zechariah' },
    { name: 'Malaquias', abbr: 'ml', en: 'malachi' },
  ],
  newTestament: [
    { name: 'Mateus', abbr: 'mt', en: 'matthew' },
    { name: 'Marcos', abbr: 'mc', en: 'mark' },
    { name: 'Lucas', abbr: 'lc', en: 'luke' },
    { name: 'João', abbr: 'jo', en: 'john' },
    { name: 'Atos', abbr: 'at', en: 'acts' },
    { name: 'Romanos', abbr: 'rm', en: 'romans' },
    { name: '1 Coríntios', abbr: '1co', en: '1corinthians' },
    { name: '2 Coríntios', abbr: '2co', en: '2corinthians' },
    { name: 'Gálatas', abbr: 'gl', en: 'galatians' },
    { name: 'Efésios', abbr: 'ef', en: 'ephesians' },
    { name: 'Filipenses', abbr: 'fp', en: 'philippians' },
    { name: 'Colossenses', abbr: 'cl', en: 'colossians' },
    { name: '1 Tessalonicenses', abbr: '1ts', en: '1thessalonians' },
    { name: '2 Tessalonicenses', abbr: '2ts', en: '2thessalonians' },
    { name: '1 Timóteo', abbr: '1tm', en: '1timothy' },
    { name: '2 Timóteo', abbr: '2tm', en: '2timothy' },
    { name: 'Tito', abbr: 'tt', en: 'titus' },
    { name: 'Filemom', abbr: 'fm', en: 'philemon' },
    { name: 'Hebreus', abbr: 'hb', en: 'hebrews' },
    { name: 'Tiago', abbr: 'tg', en: 'james' },
    { name: '1 Pedro', abbr: '1pe', en: '1peter' },
    { name: '2 Pedro', abbr: '2pe', en: '2peter' },
    { name: '1 João', abbr: '1jo', en: '1john' },
    { name: '2 João', abbr: '2jo', en: '2john' },
    { name: '3 João', abbr: '3jo', en: '3john' },
    { name: 'Judas', abbr: 'jd', en: 'jude' },
    { name: 'Apocalipse', abbr: 'ap', en: 'revelation' },
  ],
};

const BIBLE_VERSIONS = [
  { value: 'almeida', label: 'João Ferreira de Almeida' },
];

export default function Bible() {
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');
  const [version, setVersion] = useState('almeida');
  const [result, setResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Convert BIBLE_BOOKS to Combobox options
  const bookOptions: ComboboxOption[] = useMemo(() => {
    const oldTestamentOptions = BIBLE_BOOKS.oldTestament.map(book => ({
      value: book.en,
      label: `${book.name} (${book.abbr.toUpperCase()})`,
      group: 'Antigo Testamento',
    }));

    const newTestamentOptions = BIBLE_BOOKS.newTestament.map(book => ({
      value: book.en,
      label: `${book.name} (${book.abbr.toUpperCase()})`,
      group: 'Novo Testamento',
    }));

    return [...oldTestamentOptions, ...newTestamentOptions];
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!book.trim() || !chapter.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const response = await api?.getBibleVerse(book, chapter, verse, version);
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

          <form onSubmit={handleSearch} className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* Book Selection */}
              <div className='md:col-span-2'>
                <Label htmlFor='book' className='text-slate-300'>
                  Livro da Bíblia
                </Label>
                <div className='mt-1'>
                  <Combobox
                    options={bookOptions}
                    value={book}
                    onValueChange={setBook}
                    placeholder='Selecione um livro...'
                    searchPlaceholder='Buscar livro...'
                    emptyText='Nenhum livro encontrado.'
                    className='border-white/20 bg-white/10 text-white'
                  />
                </div>
              </div>

              {/* Version Selection */}
              <div className='md:col-span-2'>
                <Label htmlFor='version' className='text-slate-300'>
                  Versão da Bíblia
                </Label>
                <Select value={version} onValueChange={setVersion}>
                  <SelectTrigger className='mt-1 border-white/20 bg-white/10 text-white'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='border-white/20 bg-slate-900'>
                    {BIBLE_VERSIONS.map(v => (
                      <SelectItem
                        key={v.value}
                        value={v.value}
                        className='text-white hover:bg-white/10'>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chapter */}
              <div>
                <Label htmlFor='chapter' className='text-slate-300'>
                  Capítulo
                </Label>
                <Input
                  id='chapter'
                  type='number'
                  min='1'
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder='Ex: 3'
                  className='mt-1 border-white/20 bg-white/10 text-white placeholder:text-slate-400'
                />
              </div>

              {/* Verse */}
              <div>
                <Label htmlFor='verse' className='text-slate-300'>
                  Versículo (opcional)
                </Label>
                <Input
                  id='verse'
                  type='text'
                  value={verse}
                  onChange={(e) => setVerse(e.target.value)}
                  placeholder='Ex: 16 ou 1-5'
                  className='mt-1 border-white/20 bg-white/10 text-white placeholder:text-slate-400'
                />
              </div>
            </div>

            {/* Search Button */}
            <div className='flex gap-3'>
              <Button
                type='submit'
                disabled={!book.trim() || !chapter.trim() || isSearching}
                className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
                {isSearching ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className='mr-2 h-4 w-4' />
                    Buscar Versículo
                  </>
                )}
              </Button>
              {result && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setResult(null)}
                  className='border-white/20 bg-white/5 text-white hover:bg-white/10'>
                  Limpar
                </Button>
              )}
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
