import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Plus, Palette, Edit, Trash2, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getAllThemes, deleteTheme, updateTheme } from '../lib/supabase-service';
import type { Theme } from '../lib/supabase';
import ThemeModal from '../components/ThemeModal';

export default function Themes() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    setIsLoading(true);
    try {
      const data = await getAllThemes();
      setThemes(data);
    } catch (error) {
      console.error('Error loading themes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm('Deseja realmente deletar este tema?')) return;

    try {
      await deleteTheme(themeId);
      loadThemes();
    } catch (error) {
      console.error('Error deleting theme:', error);
    }
  };

  const handleEditTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setIsModalOpen(true);
  };

  const handleNewTheme = () => {
    setEditingTheme(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTheme(null);
  };

  const handleModalSave = () => {
    loadThemes();
  };

  const handleToggleDefault = async (theme: Theme) => {
    try {
      // Remove default from all themes
      await Promise.all(
        themes.map((t) => updateTheme(t.id, { is_default: false }))
      );

      // Set this theme as default
      await updateTheme(theme.id, { is_default: true });

      loadThemes();
    } catch (error) {
      console.error('Error setting default theme:', error);
    }
  };

  return (
    <div className='h-full'>
      <Head>
        <title>Temas - Lyrics Slideshow</title>
      </Head>

      <div className='p-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-white'>Temas e Estilos</h1>
          <p className='mt-2 text-slate-400'>Personalize a aparência das suas apresentações</p>
        </div>

        {/* Actions Bar */}
        <div className='mb-6'>
          <Button
            onClick={handleNewTheme}
            className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
            <Plus className='mr-2 h-4 w-4' />
            Novo Tema
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className='flex h-64 items-center justify-center'>
            <div className='text-slate-400'>Carregando...</div>
          </div>
        ) : themes.length === 0 ? (
          <div className='flex h-96 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm'>
            <Palette className='h-16 w-16 text-slate-600' />
            <h3 className='mt-4 text-lg font-semibold text-white'>Nenhum tema personalizado</h3>
            <p className='mt-2 text-center text-sm text-slate-400'>
              Crie temas personalizados para dar sua identidade
              <br />
              visual às apresentações
            </p>
            <Button
              onClick={handleNewTheme}
              className='mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
              <Plus className='mr-2 h-4 w-4' />
              Criar Tema
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {themes.map((theme, index) => (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className='rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 transition-all hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10 hover:shadow-lg hover:shadow-purple-500/20'>
                <div className='mb-4 flex items-start justify-between'>
                  <div>
                    <h3 className='text-lg font-semibold text-white'>{theme.name}</h3>
                    {theme.is_default && (
                      <span className='mt-1 inline-flex items-center gap-1 text-xs text-yellow-400'>
                        <Star className='h-3 w-3 fill-current' />
                        Padrão
                      </span>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div className='mb-4 flex h-32 items-center justify-center rounded-lg border border-white/10 bg-black p-4'>
                  <p
                    style={{
                      fontFamily: theme.font_family,
                      fontSize: `${theme.font_size * 0.4}px`,
                      fontWeight: theme.font_weight,
                      color: theme.text_color,
                      textShadow: theme.text_shadow,
                    }}>
                    Exemplo
                  </p>
                </div>

                {/* Info */}
                <div className='mb-4 space-y-1 text-xs text-slate-400'>
                  <p>Fonte: {theme.font_family}</p>
                  <p>Tamanho: {theme.font_size}px</p>
                  <p>Animação: {theme.animation_type}</p>
                </div>

                {/* Actions */}
                <div className='flex gap-2'>
                  {!theme.is_default && (
                    <Button
                      onClick={() => handleToggleDefault(theme)}
                      size='sm'
                      variant='outline'
                      className='flex-1 border-yellow-500/20 bg-yellow-500/5 text-yellow-400 hover:bg-yellow-500/10'>
                      <Star className='h-4 w-4' />
                    </Button>
                  )}
                  <Button
                    onClick={() => handleEditTheme(theme)}
                    size='sm'
                    variant='outline'
                    className='flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10'>
                    <Edit className='h-4 w-4' />
                  </Button>
                  {!theme.is_default && (
                    <Button
                      onClick={() => handleDeleteTheme(theme.id)}
                      size='sm'
                      variant='outline'
                      className='border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10'>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <ThemeModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          theme={editingTheme}
        />
      </div>
    </div>
  );
}
