import React from 'react';
import Head from 'next/head';
import { Upload, Video as VideoIcon } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Videos() {
  return (
    <div className='h-full'>
      <Head>
        <title>Vídeos - Lyrics Slideshow</title>
      </Head>

      <div className='p-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-white'>Vídeos de Fundo</h1>
          <p className='mt-2 text-slate-400'>Gerencie seus vídeos de fundo para apresentações</p>
        </div>

        {/* Actions Bar */}
        <div className='mb-6'>
          <Button className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
            <Upload className='mr-2 h-4 w-4' />
            Fazer Upload
          </Button>
        </div>

        {/* Empty State */}
        <div className='flex h-96 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm'>
          <VideoIcon className='h-16 w-16 text-slate-600' />
          <h3 className='mt-4 text-lg font-semibold text-white'>Nenhum vídeo encontrado</h3>
          <p className='mt-2 text-center text-sm text-slate-400'>
            Faça upload de vídeos para usar como fundo
            <br />
            nas suas apresentações
          </p>
          <Button className='mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
            <Upload className='mr-2 h-4 w-4' />
            Fazer Upload de Vídeo
          </Button>
        </div>
      </div>
    </div>
  );
}
