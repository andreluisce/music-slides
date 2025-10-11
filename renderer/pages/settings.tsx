import React from 'react';
import Head from 'next/head';
import { Database, Monitor, Keyboard, Info } from 'lucide-react';

export default function Settings() {
  return (
    <div className='h-full'>
      <Head>
        <title>Configurações - Lyrics Slideshow</title>
      </Head>

      <div className='p-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-white'>Configurações</h1>
          <p className='mt-2 text-slate-400'>Configure o aplicativo conforme suas necessidades</p>
        </div>

        {/* Settings Grid */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {/* Database */}
          <div className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20'>
                <Database className='h-5 w-5 text-green-400' />
              </div>
              <div>
                <h3 className='font-semibold text-white'>Banco de Dados</h3>
                <p className='text-sm text-slate-400'>Supabase conectado</p>
              </div>
            </div>
            <div className='mt-4 space-y-2 text-sm text-slate-300'>
              <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Não configurado'}</p>
            </div>
          </div>

          {/* Display */}
          <div className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20'>
                <Monitor className='h-5 w-5 text-blue-400' />
              </div>
              <div>
                <h3 className='font-semibold text-white'>Exibição</h3>
                <p className='text-sm text-slate-400'>Configurações de tela</p>
              </div>
            </div>
            <div className='mt-4 text-sm text-slate-300'>
              <p>Tela principal: Monitor 1</p>
              <p className='mt-1'>Tela de apresentação: Monitor 2</p>
            </div>
          </div>

          {/* Keyboard */}
          <div className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20'>
                <Keyboard className='h-5 w-5 text-purple-400' />
              </div>
              <div>
                <h3 className='font-semibold text-white'>Atalhos</h3>
                <p className='text-sm text-slate-400'>Atalhos de teclado</p>
              </div>
            </div>
            <div className='mt-4 space-y-2 text-sm text-slate-300'>
              <p>← → : Navegar slides</p>
              <p>Esc : Sair da apresentação</p>
            </div>
          </div>

          {/* About */}
          <div className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/20'>
                <Info className='h-5 w-5 text-pink-400' />
              </div>
              <div>
                <h3 className='font-semibold text-white'>Sobre</h3>
                <p className='text-sm text-slate-400'>Informações do aplicativo</p>
              </div>
            </div>
            <div className='mt-4 text-sm text-slate-300'>
              <p>Versão: 1.0.0</p>
              <p className='mt-1'>Lyrics Slideshow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
