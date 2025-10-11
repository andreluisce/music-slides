import React from 'react';
import Head from 'next/head';
import { Plus, Palette } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Themes() {
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
          <Button className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
            <Plus className='mr-2 h-4 w-4' />
            Novo Tema
          </Button>
        </div>

        {/* Empty State */}
        <div className='flex h-96 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm'>
          <Palette className='h-16 w-16 text-slate-600' />
          <h3 className='mt-4 text-lg font-semibold text-white'>Nenhum tema personalizado</h3>
          <p className='mt-2 text-center text-sm text-slate-400'>
            Crie temas personalizados para dar sua identidade
            <br />
            visual às apresentações
          </p>
          <Button className='mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
            <Plus className='mr-2 h-4 w-4' />
            Criar Tema
          </Button>
        </div>
      </div>
    </div>
  );
}
