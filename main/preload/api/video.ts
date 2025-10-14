import { ipcRenderer, IpcRendererEvent } from 'electron';
import { onIpc, debug } from './utils';

export const video = {
  getBackgroundVideos: () => {
    debug('Sending', 'video:get-background-videos');
    return ipcRenderer.invoke('video:get-background-videos');
  },
  getVideoBase64: (videoPath: string) => {
    debug('Sending', 'video:get-video-base64', { videoPath });
    return ipcRenderer.invoke('video:get-video-base64', { videoPath });
  },
  openPlayerWindow: () => {
    debug('Sending', 'video:open-player-window');
    ipcRenderer.send('video:open-player-window');
  },
  play: () => {
    debug('Sending', 'video:play');
    ipcRenderer.send('video:play');
  },
  pause: () => {
    debug('Sending', 'video:pause');
    ipcRenderer.send('video:pause');
  },
  stop: () => {
    debug('Sending', 'video:stop');
    ipcRenderer.send('video:stop');
  },
  seek: ({ time }: { time: number }) => {
    debug('Sending', 'video:seek', { time });
    ipcRenderer.send('video:seek', { time });
  },
  setVolume: ({ volume }: { volume: number }) => {
    debug('Sending', 'video:set-volume', { volume });
    ipcRenderer.send('video:set-volume', { volume });
  },
  loadInPlayer: ({ url }: { url: string }) => {
    debug('Sending', 'video:load-in-player', { url });
    ipcRenderer.send('video:load-in-player', { url });
  },
  sendTimeUpdate: ({ currentTime, duration }: { currentTime: number; duration: number }) => {
    debug('Sending', 'video:send-time-update', { currentTime, duration });
    ipcRenderer.send('video:send-time-update', { currentTime, duration });
  },

  onPlay: (callback: () => void) => {
    debug('Setting up listener for', 'video:on-play');
    return onIpc<void>('video:on-play', callback);
  },
  onPause: (callback: () => void) => {
    debug('Setting up listener for', 'video:on-pause');
    return onIpc<void>('video:on-pause', callback);
  },
  onStop: (callback: () => void) => {
    debug('Setting up listener for', 'video:on-stop');
    return onIpc<void>('video:on-stop', callback);
  },
  onSeek: (callback: (data: { time: number }) => void) => {
    debug('Setting up listener for', 'video:on-seek');
    return onIpc<{ time: number }>('video:on-seek', callback);
  },
  onVolume: (callback: (data: { volume: number }) => void) => {
    debug('Setting up listener for', 'video:on-volume');
    return onIpc<{ volume: number }>('video:on-volume', callback);
  },
  onLoad: (callback: (data: { url: string }) => void) => {
    debug('Setting up listener for', 'video:on-load');
    return onIpc<{ url: string }>('video:on-load', callback);
  },
  onTimeUpdate: (callback: (data: { currentTime: number; duration: number }) => void) => {
    debug('Setting up listener for', 'video:on-time-update');
    return onIpc<{ currentTime: number; duration: number }>('video:on-time-update', callback);
  },
};
