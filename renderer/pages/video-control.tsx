import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { getAllVideoBackgrounds } from '../lib/supabase-service';
import type { VideoBackground } from '../lib/supabase';

const api = typeof window !== 'undefined' ? window.api : undefined;

export default function VideoControl() {
  const [videos, setVideos] = useState<VideoBackground[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoBackground | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [videoPlayerWindowId, setVideoPlayerWindowId] = useState<number | null>(null);

  useEffect(() => {
    loadVideos();

    // Get video player window ID from URL params
    const params = new URLSearchParams(window.location.search);
    const windowId = params.get('windowid');
    if (windowId) {
      setVideoPlayerWindowId(parseInt(windowId, 10));
    }

    // Listen for time updates from video player
    if (api?.onVideoTimeUpdate) {
      api.onVideoTimeUpdate((_event: any, { currentTime, duration }: { currentTime: number; duration: number }) => {
        setCurrentTime(currentTime);
        setDuration(duration);
      });
    }
  }, []);

  const loadVideos = async () => {
    try {
      const data = await getAllVideoBackgrounds();
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const handleSelectVideo = (video: VideoBackground) => {
    console.log('🎬 Selecting video:', video.name);
    setSelectedVideo(video);
    setIsPlaying(false);
    setCurrentTime(0);

    // Send video to player window
    console.log('📤 Sending video to player:', video.url);
    api?.loadVideoInPlayer?.({ url: video.url });
  };

  const handlePlayPause = () => {
    if (!selectedVideo) return;

    if (isPlaying) {
      console.log('⏸️ Sending pause command');
      api?.pauseVideo?.();
      setIsPlaying(false);
    } else {
      console.log('▶️ Sending play command');
      api?.playVideo?.();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    console.log('⏹️ Sending stop command');
    api?.stopVideo?.();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    console.log('⏩ Seeking to:', newTime);
    setCurrentTime(newTime);
    api?.seekVideo?.({ time: newTime });
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    console.log('🔊 Setting volume to:', newVolume);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    api?.setVideoVolume?.({ volume: newVolume });
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    const newVolume = newMuted ? 0 : volume;
    console.log('🔇 Toggle mute:', newMuted, 'volume:', newVolume);
    api?.setVideoVolume?.({ volume: newVolume });
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    console.log('⏪ Skip backward to:', newTime);
    setCurrentTime(newTime);
    api?.seekVideo?.({ time: newTime });
  };

  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    console.log('⏩ Skip forward to:', newTime);
    setCurrentTime(newTime);
    api?.seekVideo?.({ time: newTime });
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
      <Head>
        <title>Video Control - Lyrics Slideshow</title>
      </Head>

      <div className='flex h-full flex-col p-4'>
        {/* Header */}
        <div className='mb-4'>
          <h1 className='text-xl font-bold text-white'>Controle de Vídeo</h1>
          <p className='mt-1 text-xs text-slate-400'>Controle o player de vídeo no projetor</p>
        </div>

        {/* Current Video & Controls */}
        {selectedVideo ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-4 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
            <div className='mb-3'>
              <h2 className='text-sm font-semibold text-white'>Reproduzindo Agora</h2>
              <p className='text-xs text-slate-400'>{selectedVideo.name}</p>
            </div>

            {/* Progress Bar */}
            <div className='mb-3'>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className='mb-1'
              />
              <div className='flex justify-between text-xs text-slate-400'>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className='mb-3 flex items-center justify-center gap-2'>
              <Button
                onClick={handleSkipBackward}
                size='sm'
                variant='outline'
                className='border-white/20 bg-white/10 text-white hover:bg-white/20'>
                <SkipBack className='h-4 w-4' />
              </Button>
              <Button
                onClick={handlePlayPause}
                size='sm'
                className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
                {isPlaying ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
              </Button>
              <Button
                onClick={handleStop}
                size='sm'
                variant='outline'
                className='border-white/20 bg-white/10 text-white hover:bg-white/20'>
                <Square className='h-4 w-4' />
              </Button>
              <Button
                onClick={handleSkipForward}
                size='sm'
                variant='outline'
                className='border-white/20 bg-white/10 text-white hover:bg-white/20'>
                <SkipForward className='h-4 w-4' />
              </Button>
            </div>

            {/* Volume Control */}
            <div className='flex items-center gap-2'>
              <Button
                onClick={handleToggleMute}
                size='sm'
                variant='ghost'
                className='text-white hover:bg-white/10'>
                {isMuted || volume === 0 ? <VolumeX className='h-4 w-4' /> : <Volume2 className='h-4 w-4' />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className='flex-1'
              />
              <span className='text-xs text-slate-400 w-10 text-right'>
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-4 flex h-32 items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm'>
            <p className='text-sm text-slate-400'>Selecione um vídeo abaixo para começar</p>
          </motion.div>
        )}

        {/* Video Library */}
        <div className='flex-1 overflow-hidden'>
          <h2 className='mb-2 text-sm font-semibold text-white'>Biblioteca de Vídeos</h2>
          <div className='grid h-full grid-cols-2 gap-2 overflow-y-auto pb-4 md:grid-cols-3'>
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onClick={() => handleSelectVideo(video)}
                className={`group cursor-pointer rounded-lg border p-2 transition-all ${
                  selectedVideo?.id === video.id
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-white/10'
                }`}>
                <div className='relative aspect-video overflow-hidden rounded-md bg-black'>
                  <video
                    src={video.url}
                    className='h-full w-full object-cover'
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                </div>
                <div className='mt-1'>
                  <h3 className='truncate text-xs font-medium text-white'>{video.name}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
