// IMPORTANT: Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.join(__dirname, '../.env');
console.log('📦 Loading .env from:', envPath);
dotenv.config({ path: envPath });

const envLocalPath = path.join(__dirname, '../.env.local');
dotenv.config({ path: envLocalPath });

console.log('✅ Environment variables loaded');
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
console.log('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓' : '✗');
console.log('   GOOGLE_GEMINI_API_KEY:', process.env.GOOGLE_GEMINI_API_KEY ? '✓' : '✗');

// Now import everything else
import { app, BrowserWindow, ipcMain, screen, globalShortcut, dialog } from 'electron';
import serve from 'electron-serve';
import settings from 'electron-settings';
import { createWindow } from './helpers';
import * as lyrics from './helpers/lyrics';
import * as bible from './helpers/bible';
import * as fileSystem from './helpers/file-system';

import sanitize from 'sanitize-filename';
import fse from 'fs-extra';
import createTouchBarLyrics from './helpers/create-touchbar-items';
import { SearchType, Slide } from './shared/types';
import { logError, migrateOldSongsToNewStructure } from './helpers/file-system';
import { performFullSync } from './helpers/sync-service';
import { createApplicationMenu } from './helpers/menu';

let mainWindow: BrowserWindow;

const isProd: boolean = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'dist' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

  // Create application menu
  createApplicationMenu();

  await migrateOldSongsToNewStructure();

  // Perform background sync on startup (non-blocking)
  console.log('🔄 Starting background sync on app startup...');
  (async () => {
    try {
      const stats = await performFullSync({
        uploadLocalOnly: true,
        downloadCloudOnly: true,
        resolveConflicts: 'keep-newest',
      });
      console.log('✅ Background sync completed:', stats);
    } catch (error) {
      console.log('⚠️  Background sync failed (this is okay):', error.message);
    }
  })();

  mainWindow = createWindow('main', {
    width: 800,
    height: 600,
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // ===================================================================
  // IMPORTANT: Register ALL IPC handlers BEFORE loading the URL
  // ===================================================================
  console.log('📡 Registering IPC handlers...');

  ipcMain.handle('get-all-local-songs', async () => {
    return await fileSystem.getAllSongsFlat();
  });

  ipcMain.handle('get-default-slides', async () => {
    const documentsPath = app.getPath('documents');
    const defaultSlidesDir = `${documentsPath}/lyrics-slide-show/default-slides`;

    await fse.ensureDir(defaultSlidesDir);

    const files = await fse.readdir(defaultSlidesDir);
    // Only return JSON files since we don't use .txt anymore
    return files.filter(item => item.endsWith('.json'));
  });

  ipcMain.handle('find-lyrics', async (_event, { searchType, artist, title }) => {
    switch (searchType) {
      case SearchType.ByAnyParameter:
        return lyrics.findByAnyParameter(`${artist} ${title}`);
      case SearchType.ByTitleAndArtist:
        return lyrics.searchByTitleAndArtist({ artist, title });
      case SearchType.ByTitleAndArtistExact:
        return lyrics.searchByTitleAndArtistExact({ artist, title });
    }
  });

  ipcMain.handle('get-lyric-by-url-handle', async (event, { url }) => {
    // Implementation needed - placeholder
    console.log('get-lyric-by-url-handle called with:', url);
    return null;
  });

  ipcMain.handle('get-lyric-by-file-path', async (event, { filePath, isDefault = false }) => {
    // Implementation needed - placeholder
    console.log('get-lyric-by-file-path called with:', filePath, isDefault);
    return null;
  });

  ipcMain.handle('get-background-videos', async () => {
    const documentsPath = app.getPath('documents');
    const videosPath = `${documentsPath}/lyrics-slide-show/videos`;
    await fse.ensureDir(videosPath);
    const files = await fse.readdir(videosPath);
    return files;
  });

  ipcMain.handle('get-bible-verse', async (_event, { book, chapter, verse, version }) => {
    return bible.getVerse(book, chapter, verse, version);
  });

  ipcMain.handle('get-video-base64', async (_event, { videoPath }) => {
    try {
      const videoBuffer = await fse.readFile(videoPath);
      return `data:video/mp4;base64,${videoBuffer.toString('base64')}`;
    } catch (error) {
      console.error('Error reading video file:', error);
      return null;
    }
  });

  ipcMain.handle('advanced-lyrics-search', async (_event, { userQuery }) => {
    console.log('🔍 Advanced lyrics search request:', userQuery);
    return lyrics.advancedLyricsSearch(userQuery);
  });

  // Fast search - returns list of results without fetching full lyrics
  ipcMain.handle('fast-lyrics-search', async (_event, { userQuery }) => {
    console.log('⚡ Fast lyrics search request:', userQuery);
    const { fastLyricsSearch } = await import('./helpers/lyrics-agent');
    return fastLyricsSearch(userQuery);
  });

  // Fetch lyrics by URL after user selects from results
  ipcMain.handle('fetch-lyrics-by-url', async (_event, { url, source }) => {
    console.log('📥 Fetch lyrics by URL:', url);
    const { fetchLyricsByUrl } = await import('./helpers/lyrics-agent');
    return fetchLyricsByUrl(url, source);
  });

  ipcMain.handle('suggest-theme-colors', async (_event, { lyrics: lyricsText }) => {
    return lyrics.suggestThemeColors(lyricsText);
  });

  ipcMain.handle('suggest-bible-verses', async (_event, { lyrics: lyricsText, theme }) => {
    return lyrics.suggestBibleVerses(lyricsText, theme);
  });

  ipcMain.handle('suggest-theme', async () => {
    const { suggestTheme } = await import('./helpers/ai-service');
    return suggestTheme();
  });

  ipcMain.handle('suggest-background-media', async (_event, { lyrics: lyricsParam }) => {
    const { suggestBackgroundMedia } = await import('./helpers/ai-service');
    return suggestBackgroundMedia(lyricsParam);
  });

  ipcMain.handle('search-pexels-images', async (_event, { query }) => {
    const { searchImages } = await import('./helpers/pexels');
    return searchImages(query);
  });

  ipcMain.handle('search-pexels-videos', async (_event, { query }) => {
    const { searchVideos } = await import('./helpers/pexels');
    return searchVideos(query);
  });

  ipcMain.handle('suggest-font-pairing', async (_event, { genre, mood }) => {
    const { suggestFontPairing } = await import('./helpers/ai-service');
    return suggestFontPairing(genre, mood);
  });

  ipcMain.handle('discover-songs', async (_event, { query }) => {
    const { discoverSongs } = await import('./helpers/ai-service');
    return discoverSongs(query);
  });

  ipcMain.handle('generate-chords', async (_event, { lyrics: lyricsParam }) => {
    const { generateChords } = await import('./helpers/ai-service');
    return generateChords(lyricsParam);
  });

  // Settings handlers using Supabase
  ipcMain.handle('get-settings', async () => {
    const { getSettings } = await import('./helpers/settings-service');
    return getSettings();
  });

  ipcMain.handle('update-setting', async (_event, { key, value }) => {
    const { updateSetting } = await import('./helpers/settings-service');
    return updateSetting(key, value);
  });

  ipcMain.handle('update-settings', async (_event, settings) => {
    const { updateSettings } = await import('./helpers/settings-service');
    return updateSettings(settings);
  });

  // Legacy handlers (keep for backward compatibility)
  ipcMain.handle('get-setting', async (_event, key) => {
    return settings.get(key);
  });

  ipcMain.handle('set-setting', async (_event, { key, value }) => {
    return settings.set(key, value);
  });

  ipcMain.handle('select-data-path', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Selecionar Pasta de Dados',
      buttonLabel: 'Selecionar',
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return { filePath: result.filePaths[0], canceled: false };
    }

    return { canceled: true };
  });

  ipcMain.handle('select-lyrics-path', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Selecionar Pasta de Letras',
      buttonLabel: 'Selecionar',
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return { filePath: result.filePaths[0], canceled: false };
    }

    return { canceled: true };
  });

  ipcMain.handle('select-images-path', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Selecionar Pasta de Imagens',
      buttonLabel: 'Selecionar',
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return { filePath: result.filePaths[0], canceled: false };
    }

    return { canceled: true };
  });

  ipcMain.handle('select-videos-path', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Selecionar Pasta de Vídeos',
      buttonLabel: 'Selecionar',
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return { filePath: result.filePaths[0], canceled: false };
    }

    return { canceled: true };
  });

  // CRUD operations
  ipcMain.handle('save-song', async (_event, { artist, title, lyrics: lyricsParam, metadata }) => {
    try {
      const filePath = await fileSystem.saveSong(artist, title, lyricsParam, metadata);
      console.log(`✅ Song saved: ${artist} - ${title}`);
      return { success: true, filePath };
    } catch (error) {
      console.error('❌ Error saving song:', error);
      await fileSystem.logError('Error saving song', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-song', async (_event, { artist, title, lyrics: lyricsParam, metadata }) => {
    try {
      // Check if artist or title changed (metadata contains new values if they changed)
      const newArtist = metadata?.artist || artist;
      const newTitle = metadata?.title || title;
      const hasLocationChanged = newArtist !== artist || newTitle !== title;

      if (hasLocationChanged) {
        // Delete old file
        const oldFilePath = fileSystem.getSongFilePath(artist, title);
        const oldExists = await fse.pathExists(oldFilePath);
        if (oldExists) {
          await fse.remove(oldFilePath);
          console.log(`🗑️ Deleted old file: ${oldFilePath}`);
        }

        // Create new file at new location
        const { artist: _a, title: _t, ...cleanMetadata } = metadata || {};
        const newFilePath = fileSystem.getSongFilePath(newArtist, newTitle);

        // Ensure artist folder exists
        const artistFolder = fileSystem.getArtistFolderPath(newArtist);
        await fse.ensureDir(artistFolder);

        const fileContent = fileSystem.createSongFileContent(newArtist, newTitle, lyricsParam, {
          ...cleanMetadata,
          updatedAt: new Date().toISOString().split('T')[0],
        });

        await fse.writeFile(newFilePath, fileContent, 'utf8');
        console.log(`✅ Song moved and updated: ${artist} - ${title} → ${newArtist} - ${newTitle}`);
        return { success: true, filePath: newFilePath };
      } else {
        // Just update the existing file
        const filePath = fileSystem.getSongFilePath(artist, title);
        const fileContent = fileSystem.createSongFileContent(artist, title, lyricsParam, {
          ...metadata,
          updatedAt: new Date().toISOString().split('T')[0],
        });

        await fse.writeFile(filePath, fileContent, 'utf8');
        console.log(`✅ Song updated: ${artist} - ${title}`);
        return { success: true, filePath };
      }
    } catch (error) {
      console.error('❌ Error updating song:', error);
      await fileSystem.logError('Error updating song', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-song', async (_event, { artist, title }) => {
    try {
      const filePath = fileSystem.getSongFilePath(artist, title);
      await fse.remove(filePath);
      console.log(`✅ Song deleted: ${artist} - ${title}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting song:', error);
      await fileSystem.logError('Error deleting song', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('read-song', async (_event, { artist, title }) => {
    try {
      const songData = await fileSystem.readSong(artist, title);
      return { success: true, ...songData };
    } catch (error) {
      console.error('❌ Error reading song:', error);
      await fileSystem.logError('Error reading song', error);
      return { success: false, error: error.message };
    }
  });

  // Advanced Metadata Handlers
  ipcMain.handle('get-advanced-song-analysis', async (_event, { artist, title, estimatedDuration }) => {
    console.log('🧠 Get advanced song analysis request:', `${artist} - ${title}`);
    const { getAdvancedSongAnalysis } = await import('./helpers/song-analyzer');

    try {
      // First, get the lyrics
      const songData = await fileSystem.readSong(artist, title);

      if (!songData?.lyrics) {
        throw new Error('Song not found or has no lyrics');
      }

      const analysis = await getAdvancedSongAnalysis(artist, title, songData.lyrics, estimatedDuration);
      return analysis;
    } catch (error) {
      console.error('❌ Error getting advanced song analysis:', error);
      await fileSystem.logError('Error getting advanced song analysis', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-song-analysis', async (_event, { artist, title, analysis }) => {
    console.log('💾 Update song analysis request:', `${artist} - ${title}`);
    const { updateSongAnalysis } = await import('./helpers/song-analyzer');

    try {
      await updateSongAnalysis(artist, title, analysis);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating song analysis:', error);
      await fileSystem.logError('Error updating song analysis', error);
      throw error;
    }
  });

  ipcMain.handle('generate-advanced-metadata', async (_event, { artist, title, lyrics: lyricsParam, estimatedDuration }) => {
    console.log('🤖 Generate advanced metadata request:', `${artist} - ${title}`);
    const { generateAdvancedMetadata } = await import('./helpers/advanced-lyrics-analyzer');

    try {
      const analysis = await generateAdvancedMetadata(artist, title, lyricsParam, estimatedDuration);
      return analysis;
    } catch (error) {
      console.error('❌ Error generating advanced metadata:', error);
      await fileSystem.logError('Error generating advanced metadata', error);
      throw error;
    }
  });

  ipcMain.handle('get-path', (event, { name }) => {
    return app.getPath(name);
  });

  // Sync Service Handlers
  ipcMain.handle('get-unified-song-list', async () => {
    const { getUnifiedSongList } = await import('./helpers/sync-service');
    return getUnifiedSongList();
  });

  ipcMain.handle('perform-full-sync', async (_event, options) => {
    return performFullSync(options);
  });

  ipcMain.handle('sync-song-to-cloud', async (_event, { artist, title }) => {
    const { syncSongToCloud } = await import('./helpers/sync-service');
    return syncSongToCloud(artist, title);
  });

  ipcMain.handle('sync-song-from-cloud', async (_event, { artist, title }) => {
    const { syncSongFromCloud } = await import('./helpers/sync-service');
    return syncSongFromCloud(artist, title);
  });

  ipcMain.on('send-search-progress', (_event, message: string) => {
    if (mainWindow) {
      mainWindow.webContents.send('search-progress', message);
    }
  });

  console.log('✅ All IPC handlers registered');

  // ===================================================================
  // NOW we can safely load the URL - handlers are ready!
  // ===================================================================
  if (isProd) {
    await mainWindow.loadURL('app://./index.html');
  } else {
    // The VITE_DEV_SERVER_URL is set by vite-plugin-electron
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  }

  console.log('🚀 Application loaded');
})();


app.on('window-all-closed', () => {
  app.quit();
});

process.on('uncaughtException', async error => {
  console.error('Unhandled Exception in Main Process:', error);
  await logError('Unhandled Exception in Main Process', error);
  app.relaunch();
  app.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection in Main Process:', reason, promise);
  await logError(`Unhandled Rejection in Main Process: ${reason}`, new Error(reason as string));
  app.relaunch();
  app.exit(1);
});
