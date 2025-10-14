import { ipcRenderer, IpcRendererEvent } from 'electron';

export const onIpc = <T>(channel: string, callback: (data: T) => void): (() => void) => {
  const listener = (_: IpcRendererEvent, data: T) => callback(data);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

export const debug = (msg: string, ...args: any[]) => {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) console.log(`[IPC DEBUG] ${msg}`, ...args);
};
