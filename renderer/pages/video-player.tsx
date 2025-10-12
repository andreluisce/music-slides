import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

const api = typeof window !== 'undefined' ? window.api : undefined;

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    if (!api) {
      console.log('❌ API not available in video-player');
      return;
    }

    console.log('✅ Video Player: Setting up IPC listeners');

    // Listen for video control commands from the control window
    const handlePlayCommand = () => {
      console.log('▶️ Play command received');
      videoRef.current?.play().catch(err => console.error('Play error:', err));
    };

    const handlePauseCommand = () => {
      console.log('⏸️ Pause command received');
      videoRef.current?.pause();
    };

    const handleSeekCommand = (_event: any, { time }: { time: number }) => {
      console.log('⏩ Seek command received:', time);
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    };

    const handleVolumeCommand = (_event: any, { volume }: { volume: number }) => {
      console.log('🔊 Volume command received:', volume);
      if (videoRef.current) {
        videoRef.current.volume = volume;
      }
    };

    const handleLoadVideoCommand = (_event: any, { url }: { url: string }) => {
      console.log('📹 Load video command received:', url);
      setVideoUrl(url);
    };

    const handleStopCommand = () => {
      console.log('⏹️ Stop command received');
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };

    // Register IPC listeners and store cleanup functions
    const cleanupPlay = api.onVideoPlay?.(handlePlayCommand);
    const cleanupPause = api.onVideoPause?.(handlePauseCommand);
    const cleanupSeek = api.onVideoSeek?.(handleSeekCommand);
    const cleanupVolume = api.onVideoVolume?.(handleVolumeCommand);
    const cleanupLoad = api.onLoadVideo?.(handleLoadVideoCommand);
    const cleanupStop = api.onVideoStop?.(handleStopCommand);

    console.log('✅ Video Player: IPC listeners registered');

    // Send time updates back to control window
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        api.sendVideoTimeUpdate?.({
          currentTime: videoRef.current.currentTime,
          duration: videoRef.current.duration,
        });
      }
    }, 500);

    return () => {
      console.log('🧹 Video Player: Cleaning up listeners');
      clearInterval(interval);
      if (typeof cleanupPlay === 'function') cleanupPlay();
      if (typeof cleanupPause === 'function') cleanupPause();
      if (typeof cleanupSeek === 'function') cleanupSeek();
      if (typeof cleanupVolume === 'function') cleanupVolume();
      if (typeof cleanupLoad === 'function') cleanupLoad();
      if (typeof cleanupStop === 'function') cleanupStop();
    };
  }, []);

  // Send metadata when video is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      api?.sendVideoTimeUpdate?.({
        currentTime: videoRef.current.currentTime,
        duration: videoRef.current.duration,
      });
    }
  };

  return (
    <div className='h-screen w-screen bg-black'>
      <Head>
        <title>Video Player - Lyrics Slideshow</title>
      </Head>

      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className='h-full w-full object-contain'
          onLoadedMetadata={handleLoadedMetadata}
        />
      ) : (
        <div className='flex h-full w-full items-center justify-center'>
          <p className='text-white text-xl'>Aguardando vídeo...</p>
        </div>
      )}
    </div>
  );
}
