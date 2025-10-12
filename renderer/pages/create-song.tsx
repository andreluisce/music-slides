import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const api = typeof window !== 'undefined' ? window.api : undefined;

function CreateSong() {
  const router = useRouter();
  const { artist: artistParam, title: titleParam, edit } = router.query;
  const isEditMode = edit === 'true';

  const [formData, setFormData] = useState({
    artist: '',
    title: '',
    lyrics: '',
    album: '',
    year: '',
    genre: 'Gospel',
    language: 'pt-BR',
    source: 'manual',
  });
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [originalArtist, setOriginalArtist] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');

  // Load song data when in edit mode
  useEffect(() => {
    if (isEditMode && artistParam && titleParam && api?.readSong) {
      setLoading(true);
      api.readSong(artistParam as string, titleParam as string)
        .then(result => {
          if (result.success) {
            setFormData({
              artist: artistParam as string,
              title: titleParam as string,
              lyrics: result.lyrics || '',
              album: result.metadata?.album || '',
              year: result.metadata?.year || '',
              genre: result.metadata?.genre || 'Gospel',
              language: result.metadata?.language || 'pt-BR',
              source: result.metadata?.source || 'manual',
            });
            setOriginalArtist(artistParam as string);
            setOriginalTitle(titleParam as string);
            console.log('✅ Música carregada para edição');
          } else {
            console.error('❌ Erro ao carregar música:', result.error);
            alert(`Erro ao carregar música: ${result.error}`);
          }
        })
        .catch(error => {
          console.error('❌ Erro ao carregar música:', error);
          alert('Erro ao carregar música. Verifique o console para mais detalhes.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isEditMode, artistParam, titleParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!api) {
      console.error('API not available');
      return;
    }

    try {
      const { artist, title, lyrics, ...metadata } = formData;

      let result;
      if (isEditMode) {
        // Use originalArtist and originalTitle for the update (in case they changed)
        result = await api.updateSong(originalArtist, originalTitle, lyrics, {
          ...metadata,
          artist,
          title,
        });
      } else {
        result = await api.saveSong(artist, title, lyrics, metadata);
      }

      if (result.success) {
        console.log(`✅ Música ${isEditMode ? 'atualizada' : 'salva'} com sucesso:`, result.filePath);
        // Após salvar, voltar para a biblioteca
        router.push('/library');
      } else {
        console.error(`❌ Erro ao ${isEditMode ? 'atualizar' : 'salvar'} música:`, result.error);
        alert(`Erro ao ${isEditMode ? 'atualizar' : 'salvar'} música: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao ${isEditMode ? 'atualizar' : 'salvar'} música:`, error);
      alert(`Erro ao ${isEditMode ? 'atualizar' : 'salvar'} música. Verifique o console para mais detalhes.`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = async () => {
    const query = `${formData.artist} ${formData.title}`.trim();
    if (!query || !api?.fastLyricsSearch) {
      return;
    }

    // Check if both artist and title are provided
    if (!formData.artist.trim() || !formData.title.trim()) {
      alert('Por favor, preencha tanto o artista quanto o título da música para uma busca mais precisa.');
      return;
    }

    setSearching(true);

    try {
      console.log('⚡ Searching for lyrics:', query);
      const results = await api.fastLyricsSearch(query);

      if (results && results.length > 0) {
        setSearchResults(results);
        setShowSearchResults(true);
        console.log(`✅ Found ${results.length} results`);
      } else {
        alert('Nenhuma música encontrada. Tente ajustar o artista ou título.');
        console.log('❌ No results found');
      }
    } catch (error) {
      console.error('❌ Error searching lyrics:', error);
      alert('Erro ao buscar letras. Tente novamente.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = async (result) => {
    setSearching(true);
    setShowSearchResults(false);

    try {
      console.log('📥 Fetching lyrics for:', result.title, 'by', result.artist);
      const fullResult = await api?.fetchLyricsByUrl(result.url, result.source);

      if (fullResult && fullResult.lyrics) {
        // Auto-fill the form with the fetched data
        setFormData({
          ...formData,
          artist: fullResult.artist || result.artist,
          title: fullResult.title || result.title,
          lyrics: fullResult.lyrics,
          genre: fullResult.metadata?.genre || formData.genre,
          language: fullResult.metadata?.language || formData.language,
          album: fullResult.metadata?.album || '',
          year: fullResult.metadata?.year || '',
          source: result.source,
        });
        console.log('✅ Lyrics loaded successfully');
        alert('Letra carregada com sucesso! Revise e salve.');
      } else {
        alert('Erro ao buscar a letra completa. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Error fetching lyrics:', error);
      alert('Erro ao buscar letras. Tente novamente.');
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='h-12 w-12 animate-spin text-purple-500 mx-auto mb-4' />
          <p className='text-white'>Carregando música...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
      <Head>
        <title>{isEditMode ? 'Editar Música' : 'Nova Música'} - Lyrics Slideshow</title>
      </Head>

      <div className='p-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}>
          {/* Header */}
          <div className='mb-6 flex items-center gap-4'>
            <Button
              onClick={() => router.push('/library')}
              variant='ghost'
              className='text-white hover:bg-white/10'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Voltar
            </Button>
            <h1 className='text-3xl font-bold text-white'>
              {isEditMode ? 'Editar Música' : 'Nova Música'}
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
              <div className='grid gap-6 md:grid-cols-2'>
                {/* Artista */}
                <div className='space-y-2'>
                  <Label htmlFor='artist' className='text-white'>
                    Artista *
                  </Label>
                  <Input
                    id='artist'
                    name='artist'
                    value={formData.artist}
                    onChange={handleChange}
                    required
                    disabled={searching}
                    className='bg-white/10 border-white/20 text-white placeholder:text-white/50 disabled:opacity-50'
                  />
                </div>

                {/* Título */}
                <div className='space-y-2'>
                  <Label htmlFor='title' className='text-white'>
                    Título *
                  </Label>
                  <Input
                    id='title'
                    name='title'
                    value={formData.title}
                    onChange={handleChange}
                    required
                    disabled={searching}
                    className='bg-white/10 border-white/20 text-white placeholder:text-white/50 disabled:opacity-50'
                  />
                </div>
              </div>

              {/* Search Button */}
              {!isEditMode && formData.artist && formData.title && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='mt-4'>
                  <Button
                    type='button'
                    onClick={handleSearch}
                    disabled={searching}
                    className='w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'>
                    {searching ? (
                      <>
                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                        Buscando letras...
                      </>
                    ) : (
                      <>
                        <Sparkles className='h-4 w-4 mr-2' />
                        Buscar Letra Automaticamente
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='mt-4'>
                  <div className='rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 backdrop-blur-sm'>
                    <h3 className='mb-3 text-sm font-semibold text-white'>
                      Selecione uma música ({searchResults.length} resultados)
                    </h3>
                    <div className='max-h-64 space-y-2 overflow-y-auto'>
                      {searchResults.map((result, index) => (
                        <motion.button
                          key={index}
                          type='button'
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSelectSearchResult(result)}
                          disabled={searching}
                          className='group relative w-full overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-3 text-left transition-all hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10 hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed'>
                          <div className='flex items-start gap-3'>
                            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-bold text-white shadow-lg'>
                              {index + 1}
                            </div>
                            <div className='min-w-0 flex-1'>
                              <p className='truncate text-sm font-semibold text-white transition-colors group-hover:text-purple-300'>
                                {result.title}
                              </p>
                              <p className='mt-0.5 truncate text-xs text-slate-400 transition-colors group-hover:text-slate-300'>
                                {result.artist}
                              </p>
                              <p className='mt-1 text-xs text-slate-500'>
                                {result.source === 'letrasmusic' ? 'Letras.mus.br' : 'CifraClub'}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    <Button
                      type='button'
                      onClick={() => setShowSearchResults(false)}
                      variant='ghost'
                      className='mt-3 w-full text-white hover:bg-white/10'>
                      Cancelar
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className='mt-6 grid gap-6 md:grid-cols-2'>

                {/* Álbum */}
                <div className='space-y-2'>
                  <Label htmlFor='album' className='text-white'>
                    Álbum
                  </Label>
                  <Input
                    id='album'
                    name='album'
                    value={formData.album}
                    onChange={handleChange}
                    className='bg-white/10 border-white/20 text-white placeholder:text-white/50'
                  />
                </div>

                {/* Ano */}
                <div className='space-y-2'>
                  <Label htmlFor='year' className='text-white'>
                    Ano
                  </Label>
                  <Input
                    id='year'
                    name='year'
                    type='number'
                    value={formData.year}
                    onChange={handleChange}
                    className='bg-white/10 border-white/20 text-white placeholder:text-white/50'
                  />
                </div>

                {/* Gênero */}
                <div className='space-y-2'>
                  <Label htmlFor='genre' className='text-white'>
                    Gênero
                  </Label>
                  <select
                    id='genre'
                    name='genre'
                    value={formData.genre}
                    onChange={handleChange}
                    className='flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'>
                    <option value='Gospel'>Gospel</option>
                    <option value='Worship'>Worship</option>
                    <option value='Praise'>Louvor</option>
                    <option value='Contemporary'>Contemporâneo</option>
                    <option value='Traditional'>Tradicional</option>
                  </select>
                </div>

                {/* Idioma */}
                <div className='space-y-2'>
                  <Label htmlFor='language' className='text-white'>
                    Idioma
                  </Label>
                  <select
                    id='language'
                    name='language'
                    value={formData.language}
                    onChange={handleChange}
                    className='flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'>
                    <option value='pt-BR'>Português (Brasil)</option>
                    <option value='en-US'>English (US)</option>
                    <option value='es'>Español</option>
                  </select>
                </div>
              </div>

              {/* Letra */}
              <div className='mt-6 space-y-2'>
                <Label htmlFor='lyrics' className='text-white'>
                  Letra *
                </Label>
                <textarea
                  id='lyrics'
                  name='lyrics'
                  value={formData.lyrics}
                  onChange={handleChange}
                  required
                  rows={15}
                  placeholder='Digite a letra da música aqui...'
                  className='flex min-h-[200px] w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                />
                <p className='text-sm text-white/60'>
                  Separe as estrofes com linhas em branco
                </p>
              </div>

              {/* Botões */}
              <div className='mt-6 flex gap-3 justify-end'>
                <Button
                  type='button'
                  onClick={() => router.push('/library')}
                  variant='ghost'
                  className='text-white hover:bg-white/10'>
                  Cancelar
                </Button>
                <Button
                  type='submit'
                  className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'>
                  <Save className='h-4 w-4 mr-2' />
                  {isEditMode ? 'Atualizar Música' : 'Salvar Música'}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default CreateSong;
