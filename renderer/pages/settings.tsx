import React, { useEffect, useState, useRef, useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Database, Monitor, Keyboard, Info, Eye, EyeOff, Image as ImageIcon, Upload } from 'lucide-react';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

const api = typeof window !== 'undefined' ? window.api : undefined;

export default function Settings() {
  const [showPagination, setShowPagination] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [logoPath, setLogoPath] = useState('/images/logo.svg');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load settings
    const loadSettings = async () => {
      const paginationSetting = await api?.getSetting('showPagination');
      const showLogoSetting = await api?.getSetting('showLogo');
      const logoPathSetting = await api?.getSetting('logoPath');

      if (paginationSetting !== undefined) setShowPagination(paginationSetting);
      if (showLogoSetting !== undefined) setShowLogo(showLogoSetting);
      // Only override default logoPath if a custom one is set
      if (logoPathSetting) {
        if (logoPathSetting === 'logo.svg') {
          setLogoPath('/images/logo.svg');
        } else {
          setLogoPath(logoPathSetting);
        }
      }
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

  const handleSelectLogo = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For now, just save the file path (we'll need to copy it to app data folder)
    const path = file.path || file.name;
    setLogoPath(path);
    await api?.setSetting('logoPath', path);

    console.log('Logo selecionado:', path);
  };

  return (
    <div className='h-full'>
      <Head>
        <title>Configurações - Lyrics Slideshow</title>
      </Head>

      <div className='p-4'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='mb-4'>
          <h1 className='text-xl font-bold text-white'>Configurações</h1>
          <p className='mt-1 text-xs text-slate-400'>Configure o aplicativo conforme suas necessidades</p>
        </motion.div>

        {/* Settings Grid */}
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
          {/* Display Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm'>
            <h3 className='mb-2 text-sm font-semibold text-white'>Apresentação</h3>

            <div className='space-y-2'>
              {/* Show Pagination Toggle */}
              <div className='flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-2.5'>
                <div className='flex-1'>
                  <Label className='text-sm text-white'>Mostrar Paginação</Label>
                  <p className='mt-0.5 text-xs text-slate-400'>
                    Exibe indicador de slides e contador
                  </p>
                </div>
                <button
                  onClick={handleTogglePagination}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    showPagination ? 'bg-purple-600' : 'bg-gray-600'
                  }`}>
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      showPagination ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Show Logo Toggle */}
              <div className='flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-2.5'>
                <div className='flex-1'>
                  <Label className='text-sm text-white'>Mostrar Logo</Label>
                  <p className='mt-0.5 text-xs text-slate-400'>
                    Exibe ícone no canto inferior direito
                  </p>
                </div>
                <button
                  onClick={handleToggleLogo}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    showLogo ? 'bg-purple-600' : 'bg-gray-600'
                  }`}>
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      showLogo ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Logo Selection */}
              <div className='rounded-md border border-white/10 bg-white/5 p-2.5'>
                <Label className='text-sm text-white'>Logo da Igreja</Label>
                <p className='mt-0.5 mb-2 text-xs text-slate-400'>
                  Selecione uma imagem para usar como logo
                </p>

                <div className='flex flex-col gap-2'>
                  {/* Logo Preview */}
                  {logoPath && (
                    <div className='flex items-center justify-center rounded-md border-2 border-dashed border-white/20 bg-white/5 p-3'>
                      <img
                        src={logoPath}
                        alt='Logo preview'
                        className='max-h-24 max-w-full object-contain'
                        onError={() => {
                          console.error('Erro ao carregar logo:', logoPath);
                        }}
                      />
                    </div>
                  )}

                  {/* Select Button */}
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    onChange={handleFileChange}
                    className='hidden'
                  />
                  <Button
                    type='button'
                    onClick={handleSelectLogo}
                    size='sm'
                    className='w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
                    <Upload className='h-3.5 w-3.5 mr-1.5' />
                    {logoPath ? 'Alterar Logo' : 'Selecionar Logo'}
                  </Button>

                  {logoPath && (
                    <p className='text-xs text-slate-400 text-center truncate'>
                      {logoPath.split('/').pop() || logoPath}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Database */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm'>
            <div className='flex items-center gap-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20'>
                <Database className='h-4 w-4 text-green-400' />
              </div>
              <div>
                <h3 className='text-sm font-semibold text-white'>Banco de Dados</h3>
                <p className='text-xs text-slate-400'>Supabase conectado</p>
              </div>
            </div>
            <div className='mt-3 space-y-1.5 text-xs text-slate-300'>
              <p className='truncate'>
                URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Não configurado'}
              </p>
              <div className='flex items-center gap-1.5 rounded-md bg-green-500/10 p-1.5'>
                <div className='h-1.5 w-1.5 rounded-full bg-green-500'></div>
                <span className='text-xs text-green-400'>Conectado</span>
              </div>
            </div>
          </motion.div>

          {/* Keyboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className='rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm'>
            <div className='flex items-center gap-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20'>
                <Keyboard className='h-4 w-4 text-purple-400' />
              </div>
              <div>
                <h3 className='text-sm font-semibold text-white'>Atalhos</h3>
                <p className='text-xs text-slate-400'>Atalhos de teclado</p>
              </div>
            </div>
            <div className='mt-3 space-y-2'>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-slate-300'>Navegar slides</span>
                <div className='flex gap-1'>
                  <kbd className='rounded bg-white/10 px-1.5 py-0.5 text-xs text-white'>←</kbd>
                  <kbd className='rounded bg-white/10 px-1.5 py-0.5 text-xs text-white'>→</kbd>
                </div>
              </div>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-slate-300'>Voltar ao início</span>
                <kbd className='rounded bg-white/10 px-1.5 py-0.5 text-xs text-white'>Esc</kbd>
              </div>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-slate-300'>Quick Screen</span>
                <div className='flex gap-1'>
                  <kbd className='rounded bg-white/10 px-1.5 py-0.5 text-xs text-white'>Cmd</kbd>
                  <kbd className='rounded bg-white/10 px-1.5 py-0.5 text-xs text-white'>Shift</kbd>
                  <kbd className='rounded bg-white/10 px-1.5 py-0.5 text-xs text-white'>L</kbd>
                </div>
              </div>
            </div>
          </motion.div>

          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className='rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm'>
            <div className='flex items-center gap-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20'>
                <Info className='h-4 w-4 text-pink-400' />
              </div>
              <div>
                <h3 className='text-sm font-semibold text-white'>Sobre</h3>
                <p className='text-xs text-slate-400'>Informações do aplicativo</p>
              </div>
            </div>
            <div className='mt-3 space-y-1.5 text-xs text-slate-300'>
              <p>
                <span className='font-semibold text-white'>Versão:</span> 1.0.0
              </p>
              <p>
                <span className='font-semibold text-white'>App:</span> Lyrics Slideshow
              </p>
              <p className='mt-2 text-xs text-slate-400'>
                Sistema completo de apresentação de letras de músicas para igrejas e eventos.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
