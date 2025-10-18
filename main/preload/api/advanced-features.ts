import { ipcRenderer } from 'electron';

export const advancedFeaturesApi = {
  // Cross-device sync
  sync: {
    triggerManualSync: () => ipcRenderer.invoke('sync:trigger-manual-sync'),
    getStatus: () => ipcRenderer.invoke('sync:get-status'),
    getDevices: () => ipcRenderer.invoke('sync:get-devices'),
    resolveConflict: (conflictId: string, resolution: string, mergedData?: any) => 
      ipcRenderer.invoke('sync:resolve-conflict', { conflictId, resolution, mergedData }),
    getConflicts: () => ipcRenderer.invoke('sync:get-conflicts'),
    setEnabled: (enabled: boolean) => ipcRenderer.invoke('sync:set-enabled', enabled),
    getSettings: () => ipcRenderer.invoke('sync:get-settings'),
    updateSettings: (settings: any) => ipcRenderer.invoke('sync:update-settings', settings),
  },

  // Notification customization
  notifications: {
    getSettings: () => ipcRenderer.invoke('notifications:get-settings'),
    updateSettings: (settings: any) => ipcRenderer.invoke('notifications:update-settings', settings),
    getThemes: () => ipcRenderer.invoke('notifications:get-themes'),
    createTheme: (theme: any) => ipcRenderer.invoke('notifications:create-theme', theme),
    sendCustom: (notification: any) => ipcRenderer.invoke('notifications:send-custom', notification),
    test: (type: string) => ipcRenderer.invoke('notifications:test', type),
    clearAll: () => ipcRenderer.invoke('notifications:clear-all'),
    getHistory: () => ipcRenderer.invoke('notifications:get-history'),
    importSound: (name: string, filePath: string) => 
      ipcRenderer.invoke('notifications:import-sound', { name, filePath }),
    testSound: (soundPath: string) => ipcRenderer.invoke('notifications:test-sound', soundPath),
  }
};