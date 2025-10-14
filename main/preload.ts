import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { presentation } from './preload/api/presentation';
import { system } from './preload/api/system';
import { songs } from './preload/api/songs';
import { presentations } from './preload/api/presentations';
import { video } from './preload/api/video';
import { bible } from './preload/api/bible';
import { ai } from './preload/api/ai';
import { settings } from './preload/api/settings';
import { dialogs } from './preload/api/dialogs';
import { sync } from './preload/api/sync';
import { error } from './preload/api/error';
import { onIpc } from './preload/api/utils';

contextBridge.exposeInMainWorld('api', {
  presentation,
  system,
  songs,
  presentations,
  video,
  bible,
  ai,
  settings,
  dialogs,
  sync,
  error,
  onIpc: <T>(channel: string, callback: (data: T) => void) => {
    return onIpc<T>(channel, callback);
  },
});