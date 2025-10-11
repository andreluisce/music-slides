import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Database, Monitor, Keyboard, Info, Eye, EyeOff } from 'lucide-react';
import { Label } from '../components/ui/label';

const api = typeof window !== 'undefined' ? window.api : undefined;

export default function Settings() {
  const [showPagination, setShowPagination] = useState(true);
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    // Load settings
    const loadSettings = async () => {
      const paginationSetting = await api?.getSetting('showPagination');
      const logoSetting = await api?.getSetting('showLogo');

      if (paginationSetting !== undefined) setShowPagination(paginationSetting);
      if (logoSetting !== undefined) setShowLogo(logoSetting);
    };
    loadSettings();
  }, []);

  const handleTogglePagination = async () => {
    const newValue = !showPagination;
    setShowPagination(newValue);
    await api?.setSetting('showPagination', newValue);
  };

  const handleToggleLogo = async () => {
    const newValue = !showLogo;
    setShowLogo(newValue);
    await api?.setSetting('showLogo', newValue);
  };

  return (
    <div className='h-full'>
      <Head>
        <title>Configurações - Lyrics Slideshow</title>
      </Head>

      <div className='p-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='mb-8'>
          <h1 className='text-3xl font-bold text-white'>Configurações</h1>
          <p className='mt-2 text-slate-400'>Configure o aplicativo conforme suas necessidades</p>
        </motion.div>

        {/* Settings Grid */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {/* Display Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
            <div className='mb-4 flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20'>
                <Monitor className='h-5 w-5 text-blue-400' />
              </div>
              <div>
                <h3 className='font-semibold text-white'>Apresentação</h3>
                <p className='text-sm text-slate-400'>Configurações de exibição</p>
              </div>
            </div>

            <div className='space-y-4'>
              {/* Show Pagination Toggle */}
              <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4'>
                <div className='flex-1'>
                  <Label className='text-white'>Mostrar Paginação</Label>
                  <p className='mt-1 text-xs text-slate-400'>
                    Exibe indicador de slides e contador
                  </p>
                </div>
                <button
                  onClick={handleTogglePagination}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showPagination ? 'bg-purple-600' : 'bg-gray-600'
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showPagination ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Show Logo Toggle */}
              <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4'>
                <div className='flex-1'>
                  <Label className='text-white'>Mostrar Logo</Label>
                  <p className='mt-1 text-xs text-slate-400'>
                    Exibe ícone no canto inferior direito
                  </p>
                </div>
                <button
                  onClick={handleToggleLogo}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showLogo ? 'bg-purple-600' : 'bg-gray-600'
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showLogo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Database */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
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
              <p className='truncate'>
                URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Não configurado'}
              </p>
              <div className='mt-3 flex items-center gap-2 rounded-lg bg-green-500/10 p-2'>
                <div className='h-2 w-2 rounded-full bg-green-500'></div>
                <span className='text-xs text-green-400'>Conectado</span>
              </div>
            </div>
          </motion.div>

          {/* Keyboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20'>
                <Keyboard className='h-5 w-5 text-purple-400' />
              </div>
              <div>
                <h3 className='font-semibold text-white'>Atalhos</h3>
                <p className='text-sm text-slate-400'>Atalhos de teclado</p>
              </div>
            </div>
            <div className='mt-4 space-y-3'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-slate-300'>Navegar slides</span>
                <div className='flex gap-1'>
                  <kbd className='rounded bg-white/10 px-2 py-1 text-xs text-white'>←</kbd>
                  <kbd className='rounded bg-white/10 px-2 py-1 text-xs text-white'>→</kbd>
                </div>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-slate-300'>Voltar ao início</span>
                <kbd className='rounded bg-white/10 px-2 py-1 text-xs text-white'>Esc</kbd>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-slate-300'>Quick Screen</span>
                <div className='flex gap-1'>
                  <kbd className='rounded bg-white/10 px-2 py-1 text-xs text-white'>Cmd</kbd>
                  <kbd className='rounded bg-white/10 px-2 py-1 text-xs text-white'>Shift</kbd>
                  <kbd className='rounded bg-white/10 px-2 py-1 text-xs text-white'>L</kbd>
                </div>
              </div>
            </div>
          </motion.div>

          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/20'>
                <Info className='h-5 w-5 text-pink-400' />
              </div>
              <div>
                <h3 className='font-semibold text-white'>Sobre</h3>
                <p className='text-sm text-slate-400'>Informações do aplicativo</p>
              </div>
            </div>
            <div className='mt-4 space-y-2 text-sm text-slate-300'>
              <p>
                <span className='font-semibold text-white'>Versão:</span> 1.0.0
              </p>
              <p>
                <span className='font-semibold text-white'>App:</span> Lyrics Slideshow
              </p>
              <p className='mt-3 text-xs text-slate-400'>
                Sistema completo de apresentação de letras de músicas para igrejas e eventos.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
