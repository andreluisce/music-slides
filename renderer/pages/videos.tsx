import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Upload, Video as VideoIcon, Trash2, Play, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getAllVideoBackgrounds, createVideoBackground, deleteVideoBackground } from '../lib/supabase-service';
import { uploadVideo, deleteVideo, initializeStorage } from '../lib/storage-service';
import type { VideoBackground } from '../lib/supabase';

export default function Videos() {
  const [videos, setVideos] = useState<VideoBackground[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVideos();
    // Initialize storage bucket on first load
    initializeStorage().catch(console.error);
  }, []);

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const data = await getAllVideoBackgrounds();
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Por favor, selecione um arquivo de vídeo');
      return;
    }

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      alert('O arquivo é muito grande. Tamanho máximo: 500MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload to Supabase Storage
      const { url, fileName, path } = await uploadVideo(file, (progress) => {
        setUploadProgress(progress);
      });

      // Save to database
      await createVideoBackground({
        name: fileName,
        url: url,
        thumbnail_url: null,
      });

      // Reload videos
      await loadVideos();

      // Reset
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Erro ao fazer upload do vídeo. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = async (video: VideoBackground) => {
    if (!confirm(`Deseja realmente deletar o vídeo "${video.name}"?`)) return;

    try {
      // Delete from storage
      const path = video.url.split('/').pop();
      if (path) {
        await deleteVideo(path);
      }

      // Delete from database
      await deleteVideoBackground(video.id);

      // Reload videos
      loadVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Erro ao deletar vídeo. Tente novamente.');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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
          <input
            ref={fileInputRef}
            type='file'
            accept='video/*'
            onChange={handleFileSelect}
            className='hidden'
          />
          <Button
            onClick={handleUploadClick}
            disabled={isUploading}
            className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
            {isUploading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Enviando {uploadProgress > 0 && `${uploadProgress}%`}
              </>
            ) : (
              <>
                <Upload className='mr-2 h-4 w-4' />
                Fazer Upload
              </>
            )}
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className='flex h-64 items-center justify-center'>
            <div className='text-slate-400'>Carregando...</div>
          </div>
        ) : videos.length === 0 ? (
          <div className='flex h-96 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm'>
            <VideoIcon className='h-16 w-16 text-slate-600' />
            <h3 className='mt-4 text-lg font-semibold text-white'>Nenhum vídeo encontrado</h3>
            <p className='mt-2 text-center text-sm text-slate-400'>
              Faça upload de vídeos para usar como fundo
              <br />
              nas suas apresentações
            </p>
            <Button
              onClick={handleUploadClick}
              className='mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
              <Upload className='mr-2 h-4 w-4' />
              Fazer Upload de Vídeo
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className='group rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-4 transition-all hover:border-purple-500/50 hover:from-purple-500/10 hover:to-pink-500/10 hover:shadow-lg hover:shadow-purple-500/20'>
                <div className='relative aspect-video overflow-hidden rounded-lg bg-black'>
                  <video
                    src={video.url}
                    className='h-full w-full object-cover'
                    muted
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                  <div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
                    <Play className='h-12 w-12 text-white' />
                  </div>
                </div>
                <div className='mt-3'>
                  <h3 className='truncate font-semibold text-white'>{video.name}</h3>
                  <p className='mt-1 text-xs text-slate-500'>
                    {new Date(video.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className='mt-3 flex gap-2'>
                  <Button
                    onClick={() => handleDeleteVideo(video)}
                    size='sm'
                    variant='outline'
                    className='w-full border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10'>
                    <Trash2 className='mr-2 h-4 w-4' />
                    Deletar
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
