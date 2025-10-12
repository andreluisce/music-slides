import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Presentation as PresentationIcon, Calendar, Edit, Trash2, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getAllPresentations, deletePresentation, createPresentation } from '../lib/presentations-service';
import type { Presentation } from '../lib/supabase';

export default function Presentations() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPresentationName, setNewPresentationName] = useState('');

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPresentations();
      setPresentations(data);
    } catch (error) {
      console.error('Error loading presentations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePresentation = async () => {
    if (!newPresentationName.trim()) return;

    try {
      await createPresentation({
        name: newPresentationName,
        description: '',
      });
      setNewPresentationName('');
      setIsCreating(false);
      loadPresentations();
    } catch (error) {
      console.error('Error creating presentation:', error);
    }
  };

  const handleDeletePresentation = async (id: string) => {
    if (!confirm('Deseja realmente deletar esta apresentação?')) return;

    try {
      await deletePresentation(id);
      loadPresentations();
    } catch (error) {
      console.error('Error deleting presentation:', error);
    }
  };

  return (
    <div className='h-full'>
      <Head>
        <title>Apresentações - Lyrics Slideshow</title>
      </Head>

      <div className='p-4'>
        {/* Header */}
        <div className='mb-4'>
          <h1 className='text-xl font-bold text-white'>Apresentações</h1>
          <p className='mt-1 text-xs text-slate-400'>Crie e gerencie suas apresentações</p>
        </div>

        {/* Actions Bar */}
        <div className='mb-3'>
          {!isCreating ? (
            <Button
              onClick={() => setIsCreating(true)}
              size='sm'
              className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
              <Plus className='mr-1.5 h-3.5 w-3.5' />
              Nova Apresentação
            </Button>
          ) : (
            <div className='flex gap-2'>
              <Input
                placeholder='Nome da apresentação'
                value={newPresentationName}
                onChange={(e) => setNewPresentationName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePresentation()}
                className='h-8 max-w-md border-white/20 bg-white/10 text-sm text-white placeholder:text-slate-400'
                autoFocus
              />
              <Button
                onClick={handleCreatePresentation}
                size='sm'
                disabled={!newPresentationName.trim()}
                className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
                Criar
              </Button>
              <Button
                onClick={() => {
                  setIsCreating(false);
                  setNewPresentationName('');
                }}
                size='sm'
                variant='outline'
                className='border-white/20 bg-white/5 text-white hover:bg-white/10'>
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className='flex h-64 items-center justify-center'>
            <div className='text-slate-400'>Carregando...</div>
          </div>
        ) : presentations.length === 0 ? (
          <div className='flex h-64 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm'>
            <PresentationIcon className='h-12 w-12 text-slate-600' />
            <h3 className='mt-3 text-sm font-semibold text-white'>Nenhuma apresentação criada</h3>
            <p className='mt-1.5 text-center text-xs text-slate-400'>
              Comece criando sua primeira apresentação para organizar
              <br />
              músicas e slides para seus eventos
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              size='sm'
              className='mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
              <Plus className='mr-1.5 h-3.5 w-3.5' />
              Criar Apresentação
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
            {presentations.map((presentation, index) => (
              <motion.div
                key={presentation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className='group rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-3 transition-all hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10 hover:shadow-lg hover:shadow-purple-500/20'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <h3 className='text-sm font-semibold text-white'>{presentation.name}</h3>
                    {presentation.description && (
                      <p className='mt-0.5 text-xs text-slate-400'>{presentation.description}</p>
                    )}
                    <p className='mt-2 text-xs text-slate-500'>
                      Criado em {new Date(presentation.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className='mt-3 flex gap-1.5'>
                  <Link href={`/presentations/${presentation.id}`} className='flex-1'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full border-white/20 bg-white/5 text-white hover:bg-white/10'>
                      <Edit className='mr-1.5 h-3.5 w-3.5' />
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleDeletePresentation(presentation.id)}
                    className='border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10'>
                    <Trash2 className='h-3.5 w-3.5' />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
