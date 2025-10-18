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
import { createApplicationMenu } from './helpers/menu';
import { performFullSync } from './helpers/sync-service';
import { LetrasMusProvider } from './helpers/lyrics-providers/letrasmusic.provider';
import { FireCrawlLyricsProvider } from './helpers/lyrics-providers/firecrawl-lyrics-provider';
import { MCPLyricsProvider } from './helpers/lyrics-providers/mcp-lyrics-provider';
import { initializeMCP, cleanupMCP, mcpService } from './helpers/mcp-service';
import { lyricsCacheService } from './helpers/lyrics-cache-service';
import { lyricsAnalyticsService } from './helpers/lyrics-analytics-service';
import { musicLibraryIntegration } from './helpers/music-library-integration';
import { supabaseLyricsIntegration } from './helpers/supabase-lyrics-integration';
import { progressNotificationService } from './helpers/progress-notification-service';
import { crossDeviceSyncService } from './helpers/cross-device-sync-service';
import { notificationCustomizationService } from './helpers/notification-customization-service';
import * as fse from 'fs-extra';
import * as presentationsService from '../lib/presentations-service';

let letrasmusProviderInstance: LetrasMusProvider;
let fireCrawlProviderInstance: FireCrawlLyricsProvider;
let mcpLyricsProviderInstance: MCPLyricsProvider;

// Search types enum - inline definition
const SearchType = {
  ByAnyParameter: 'ByAnyParameter',
  ByTitleAndArtist: 'ByTitleAndArtist',
  ByTitleAndArtistExact: 'ByTitleAndArtistExact'
} as const;

// Environment check
const isProd = process.env.NODE_ENV === 'production';

// Setup serve for production
if (isProd) {
  serve({ directory: 'dist' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

// ... (rest of your imports)

let mainWindow: BrowserWindow | null;

// Main app initialization
(async () => {
  await app.whenReady();

  // Initialize LetrasMusProvider (no browser needed)
  letrasmusProviderInstance = new LetrasMusProvider();
  (global as any).letrasmusProvider = letrasmusProviderInstance;
  console.log('✅ LetrasMusProvider instantiated and exposed globally.');

  // Create application menu
  createApplicationMenu();

  // Migrate old songs structure (.txt -> .json with folders)
  await fileSystem.migrateOldSongsToNewStructure();

  // Migrate all songs to add slides[] array
  console.log('🔄 Starting slides migration...');
  try {
    const migrationResult = await fileSystem.migrateAllSongsToSlidesFormat();
    console.log('✅ Slides migration completed:', migrationResult);
  } catch (error) {
    console.error('❌ Error during slides migration:', error);
  }

  // Perform background sync on startup (non-blocking)
  console.log('🔄 Starting background sync on app startup...');
  (async () => {
    try {
      const stats = await performFullSync({
        uploadLocalOnly: true,
        downloadCloudOnly: true,
        resolveConflicts: 'keep-newest',
      });
    } catch (error) {
      console.log('⚠️  Background sync failed (this is okay):', (error as Error).message);
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

  let presentationWindowHelpers: any = null;
  
  const getPresentationHelpers = async () => {
    if (!presentationWindowHelpers) {
      presentationWindowHelpers = await import('./helpers/presentation-window');
    }
    return presentationWindowHelpers;
  };

  // Control Interface
  ipcMain.on('presentation:send-control', async (_event, { action, data }) => {
    const helpers = await getPresentationHelpers();
    const presWindow = helpers.getPresentationWindow();

    console.log('Control action received:', action, data);

    switch (action) {
      case 'clear':
        helpers.sendToPresentationWindow('presentation:on-control-received', { action: 'clear' });
        break;
      case 'slide':
        console.log('Slide change through control channel:', data);
        helpers.sendToPresentationWindow('presentation:on-control-received', { action: 'slide', data });
        break;
      case 'restart':
        console.log('Restart presentation through control channel:', data);
        helpers.sendToPresentationWindow('presentation:on-control-received', { action: 'restart', data });
        break;
      case 'fullscreen':
        if (presWindow) {
          presWindow.setFullScreen(!presWindow.isFullScreen());
        }
        break;
      case 'theme':
        console.log('Theme update through control channel:', data);
        helpers.sendToPresentationWindow('presentation:on-theme-update', data);
        break;
      case 'background':
        helpers.sendToPresentationWindow('presentation:on-custom-background', data);
        break;
      case 'transition':
        helpers.sendToPresentationWindow('presentation:on-transition-update', data);
        break;
    }
  });

  // Dialog Handlers
  ipcMain.handle('dialogs:open-theme', async () => {
    const { getPresentationWindow } = await import('./helpers/presentation-window');
    const win = getPresentationWindow();
    if (win) {
      await dialog.showMessageBox(win, {
        type: 'info',
        title: 'Tema',
        message: 'Editor de tema será implementado em breve.',
        buttons: ['OK']
      });
    }
    return null;
  });

  ipcMain.handle('dialogs:open-background', async () => {
    const { getPresentationWindow } = await import('./helpers/presentation-window');
    const win = getPresentationWindow();
    if (win) {
      await dialog.showMessageBox(win, {
        type: 'info',
        title: 'Fundo',
        message: 'Seletor de fundo será implementado em breve.',
        buttons: ['OK']
      });
    }
    return null;
  });

  ipcMain.handle('dialogs:open-transition', async () => {
    const { getPresentationWindow } = await import('./helpers/presentation-window');
    const win = getPresentationWindow();
    if (win) {
      await dialog.showMessageBox(win, {
        type: 'info',
        title: 'Transição',
        message: 'Editor de transição será implementado em breve.',
        buttons: ['OK']
      });
    }
    return null;
  });

  ipcMain.handle('songs:get-all-local', async () => {
    return await fileSystem.getAllSongsFlat();
  });

  ipcMain.handle('presentations:get-all', async () => {
    return await presentationsService.getAllPresentations();
  });

  ipcMain.handle('presentations:create', async (_event, presentation) => {
    return await presentationsService.createPresentation(presentation);
  });

  ipcMain.handle('presentations:get-items', async (_event, presentationId) => {
    return await presentationsService.getPresentationItems(presentationId);
  });

  ipcMain.handle('presentations:update', async (_event, id, updates) => {
    return await presentationsService.updatePresentation(id, updates);
  });

  ipcMain.handle('presentations:update-current-slide', async (_event, presentationId, slideId) => {
    return await presentationsService.updatePresentation(presentationId, { current_slide_id: slideId });
  });

  ipcMain.handle('songs:get-default-slides', async () => {
    const documentsPath = app.getPath('documents');
    const defaultSlidesDir = `${documentsPath}/lyrics-slide-show/default-slides`;

    await fse.ensureDir(defaultSlidesDir);

    const files = await fse.readdir(defaultSlidesDir);
    // Only return JSON files since we don't use .txt anymore
    return files.filter(item => item.endsWith('.json'));
  });

  ipcMain.handle('songs:find-lyrics', async (_event, { searchType, artist, title }) => {
    switch (searchType) {
      case SearchType.ByAnyParameter:
        return lyrics.findByAnyParameter(`${artist} ${title}`);
      case SearchType.ByTitleAndArtist:
        return lyrics.searchByTitleAndArtist({ artist, title });
      case SearchType.ByTitleAndArtistExact:
        return lyrics.searchByTitleAndArtistExact({ artist, title });
    }
  });

  ipcMain.handle('songs:get-lyric-by-url-handle', async (event, { url }) => {
    // Implementation needed - placeholder
    console.log('get-lyric-by-url-handle called with:', url);
    return null;
  });

  ipcMain.handle('songs:get-lyric-by-file-path', async (event, { filePath, isDefault = false }) => {
    // Implementation needed - placeholder
    console.log('get-lyric-by-file-path called with:', filePath, isDefault);
    return null;
  });

  ipcMain.handle('video:get-background-videos', async () => {
    const documentsPath = app.getPath('documents');
    const videosPath = `${documentsPath}/lyrics-slide-show/videos`;
    await fse.ensureDir(videosPath);
    const files = await fse.readdir(videosPath);
    // Return full paths for videos
    return files.map(file => `${videosPath}/${file}`);
  });

  ipcMain.handle('get-background-images', async () => {
    const documentsPath = app.getPath('documents');
    const imagesPath = `${documentsPath}/lyrics-slide-show/images`;
    await fse.ensureDir(imagesPath);
    const files = await fse.readdir(imagesPath);
    // Filter for image files and return full paths
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return files
      .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)))
      .map(file => `${imagesPath}/${file}`);
  });

  ipcMain.handle('bible:get-verse', async (_event, { book, chapter, verse, version }) => {
    return bible.getVerse(book, chapter, verse, version);
  });

  ipcMain.handle('video:get-video-base64', async (_event, { videoPath }) => {
    try {
      const videoBuffer = await fse.readFile(videoPath);
      return `data:video/mp4;base64,${videoBuffer.toString('base64')}`;
    } catch (error) {
      console.error('Error reading video file:', error);
      return null;
    }
  });

  ipcMain.handle('ai:advanced-lyrics-search', async (_event, { userQuery }) => {
    const { intelligentLyricsSearch } = await import('./helpers/lyrics-agent');
    return intelligentLyricsSearch(userQuery, (message) => {
      _event.sender.send('search-progress', message);
    });
  });

  // Fast search - returns list of results without fetching full lyrics
  ipcMain.handle('ai:fast-lyrics-search', async (_event, { userQuery }) => {
    console.log('⚡ Fast lyrics search request:', userQuery);
    const { fastLyricsSearch } = await import('./helpers/lyrics-agent');
    return fastLyricsSearch(userQuery, (message) => {
      _event.sender.send('search-progress', message);
    });
  });

  // Fetch lyrics by URL after user selects from results
  ipcMain.handle('ai:fetch-lyrics-by-url', async (_event, { url, source }) => {
    console.log('📥 Fetch lyrics by URL:', url);
    const { fetchLyricsByUrl } = await import('./helpers/lyrics-agent');
    return fetchLyricsByUrl(url, source, (message) => {
      _event.sender.send('search-progress', message);
    });
  });

  ipcMain.handle('ai:suggest-theme-colors', async (_event, { lyrics: lyricsText }) => {
    return lyrics.suggestThemeColors(lyricsText);
  });

  ipcMain.handle('ai:suggest-bible-verses', async (_event, { lyrics: lyricsText, theme }) => {
    return lyrics.suggestBibleVerses(lyricsText, theme);
  });

  ipcMain.handle('ai:suggest-theme', async () => {
    const { suggestTheme } = await import('./helpers/ai-service');
    return suggestTheme();
  });

  ipcMain.handle('ai:suggest-background-media', async (_event, { lyrics: lyricsParam }) => {
    const { suggestBackgroundMedia } = await import('./helpers/ai-service');
    return suggestBackgroundMedia(lyricsParam);
  });

  ipcMain.handle('ai:search-pexels-images', async (_event, { query }) => {
    const { searchImages } = await import('./helpers/pexels');
    return searchImages(query);
  });

  ipcMain.handle('ai:search-pexels-videos', async (_event, { query }) => {
    const { searchVideos } = await import('./helpers/pexels');
    return searchVideos(query);
  });

  ipcMain.handle('ai:suggest-font-pairing', async (_event, { genre, mood }) => {
    const { suggestFontPairing } = await import('./helpers/ai-service');
    return suggestFontPairing(genre, mood);
  });

  ipcMain.handle('ai:discover-songs', async (_event, { query }) => {
    const { discoverSongs } = await import('./helpers/ai-service');
    return discoverSongs(query);
  });

  ipcMain.handle('ai:generate-chords', async (_event, { lyrics: lyricsParam }) => {
    const { generateChords } = await import('./helpers/ai-service');
    return generateChords(lyricsParam);
  });

  // Settings handlers using Supabase
  ipcMain.handle('settings:get-all', async () => {
    const { getSettings } = await import('./helpers/settings-service');
    return getSettings();
  });

  ipcMain.handle('settings:update', async (_event, { key, value }) => {
    const { updateSetting } = await import('./helpers/settings-service');
    return updateSetting(key, value);
  });

  ipcMain.handle('settings:update-all', async (_event, settings) => {
    const { updateSettings } = await import('./helpers/settings-service');
    return updateSettings(settings);
  });

  // Themes Service Handlers
  ipcMain.handle('themes:get-all', async () => {
    const themesService = await import('../lib/themes-service');
    return themesService.getThemes();
  });

  ipcMain.handle('themes:create', async (_event, themeData) => {
    const themesService = await import('../lib/themes-service');
    return themesService.createTheme(themeData);
  });

  ipcMain.handle('themes:update', async (_event, { id, themeData }) => {
    const themesService = await import('../lib/themes-service');
    return themesService.updateTheme(id, themeData);
  });

  ipcMain.handle('themes:delete', async (_event, id) => {
    const themesService = await import('../lib/themes-service');
    return themesService.deleteTheme(id);
  });

  // Legacy handlers (keep for backward compatibility)
  ipcMain.handle('settings:get', async (_event, key) => {
    return settings.get(key);
  });

  ipcMain.handle('settings:set', async (_event, { key, value }) => {
    return settings.set(key, value);
  });

  ipcMain.handle('settings:select-data-path', async () => {
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

  ipcMain.handle('settings:select-lyrics-path', async () => {
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

  ipcMain.handle('settings:select-images-path', async () => {
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

  ipcMain.handle('settings:select-videos-path', async () => {
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
  ipcMain.handle('songs:save', async (_event, { artist, title, lyrics: lyricsParam, metadata }) => {
    try {
      const filePath = await fileSystem.saveSong(artist, title, lyricsParam, metadata);
      console.log(`✅ Song saved: ${artist} - ${title}`);
      return { success: true, filePath };
    } catch (error) {
      console.error('❌ Error saving song:', error);
      await fileSystem.logError('Error saving song', error as Error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('songs:update', async (_event, { artist, title, lyrics: lyricsParam, metadata }) => {
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
      await fileSystem.logError('Error updating song', error as Error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('songs:delete', async (_event, { artist, title }) => {
    try {
      const filePath = fileSystem.getSongFilePath(artist, title);
      await fse.remove(filePath);
      console.log(`✅ Song deleted: ${artist} - ${title}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting song:', error);
      await fileSystem.logError('Error deleting song', error as Error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('songs:read', async (_event, { artist, title }) => {
    try {
      const songData = await fileSystem.readSong(artist, title);
      return { success: true, ...songData };
    } catch (error) {
      console.error('❌ Error reading song:', error);
      await fileSystem.logError('Error reading song', error as Error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Advanced Metadata Handlers
  ipcMain.handle('songs:get-advanced-analysis', async (_event, { artist, title, estimatedDuration }) => {
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
      await fileSystem.logError('Error getting advanced song analysis', error as Error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('songs:update-analysis', async (_event, { artist, title, analysis }) => {
    console.log('💾 Update song analysis request:', `${artist} - ${title}`);
    const { updateSongAnalysis } = await import('./helpers/song-analyzer');

    try {
      await updateSongAnalysis(artist, title, analysis);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating song analysis:', error);
      await fileSystem.logError('Error updating song analysis', error as Error);
      throw error;
    }
  });

  ipcMain.handle('songs:generate-advanced-metadata', async (_event, { artist, title, lyrics: lyricsParam, estimatedDuration }) => {
    console.log('🤖 Generate advanced metadata request:', `${artist} - ${title}`);
    const { generateAdvancedMetadata } = await import('./helpers/advanced-lyrics-analyzer');

    try {
      const analysis = await generateAdvancedMetadata(artist, title, lyricsParam, estimatedDuration);
      return analysis;
    } catch (error) {
      console.error('❌ Error generating advanced metadata:', error);
      await fileSystem.logError('Error generating advanced metadata', error as Error);
      throw error;
    }
  });

  ipcMain.handle('system:get-path', (event, { name }) => {
    return app.getPath(name);
  });

  // Sync Service Handlers
  ipcMain.handle('sync:get-unified-song-list', async () => {
    const { getUnifiedSongList } = await import('./helpers/sync-service');
    return getUnifiedSongList();
  });

  ipcMain.handle('sync:perform-full', async (_event, options) => {
    return performFullSync(options);
  });

  ipcMain.handle('sync:song-to-cloud', async (_event, { artist, title }) => {
    const { syncSongToCloud } = await import('./helpers/sync-service');
    return syncSongToCloud(artist, title);
  });

  ipcMain.handle('sync:song-from-cloud', async (_event, { artist, title }) => {
    const { syncSongFromCloud } = await import('./helpers/sync-service');
    return syncSongFromCloud(artist, title);
  });

  ipcMain.on('ai:on-search-progress', (_event, message: string) => {
    if (mainWindow) {
      mainWindow.webContents.send('ai:on-search-progress', message);
    }
  });

  // Handle opening presentation window
  ipcMain.handle('presentation:open', async (_event, { artist, title, filePath }) => {
    console.log('🎵 Opening presentation window for:', artist, '-', title);

    try {
      const { createPresentationWindow, getPresentationWindow, sendToPresentationWindow } =
        await import('./helpers/presentation-window');

      // Get or create presentation window
      let presWindow = getPresentationWindow();

      if (!presWindow || presWindow.isDestroyed()) {
        presWindow = createPresentationWindow();

        // Load the presentation page
        if (isProd) {
          await presWindow.loadURL('app://./presentation');
        } else {
          await presWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/presentation`);
        }
      }

      // Load song data (lyrics + slides)
      console.log('🎵 Loading song data for:', artist, '-', title);

      let songData: any = null;
      try {
        console.log('🎵 Reading song from file system...');
        songData = await fileSystem.readSong(artist, title);
        console.log('🎵 Song data received:', {
          hasLyrics: !!songData?.lyrics,
          hasSlides: !!songData?.slides,
          slidesCount: songData?.slides?.length || 0
        });

        if (!songData?.slides && !songData?.lyrics) {
          console.log('⚠️  Song found but has no lyrics or slides');
        }
      } catch (error) {
        console.error('❌ Error reading song:', error);
      }

      // Wait a bit for the window to be ready, then send the song data
      presWindow.webContents.once('did-finish-load', () => {
        console.log('🎵 Presentation window finished loading, sending song data');
        if (songData) {
          console.log('🎵 Sending slides array to presentation window...');
          // Send slides array (novo formato) e lyrics (compatibilidade)
          sendToPresentationWindow('presentation:on-loaded-lyrics', {
            lyrics: songData.lyrics,
            slides: songData.slides,
            artist,
            title
          });
          sendToPresentationWindow('presentation:on-song-info', {
            artist: artist || '',
            title: title || ''
          });
          console.log('✅ Song data sent successfully');
        } else {
          console.log('⚠️  No song data to send');
        }
      });

      // If already loaded, send immediately
      const isLoading = presWindow.webContents.isLoadingMainFrame();
      console.log('🎵 Window loading status:', isLoading ? 'loading' : 'already loaded');

      if (!isLoading && songData) {
        console.log('🎵 Presentation window already loaded, sending song data immediately');
        sendToPresentationWindow('presentation:on-loaded-lyrics', {
          lyrics: songData.lyrics,
          slides: songData.slides,
          artist,
          title
        });
        sendToPresentationWindow('presentation:on-song-info', { artist, title });
        console.log('✅ Song data sent immediately');
      }

      console.log('✅ Presentation window opened successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error opening presentation window:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Handle closing presentation window
  ipcMain.handle('presentation:close', async () => {
    const { closePresentationWindow } = await import('./helpers/presentation-window');
    closePresentationWindow();
    return { success: true };
  });

  // Handle sending slide change to presentation window
  ipcMain.on('presentation:send-slide-change', async (_event, slideIndex: number) => {
    console.log('DEBUG: Forwarding slide change event, index:', slideIndex);
    const helpers = await getPresentationHelpers();
    helpers.sendToPresentationWindow('presentation:on-slide-changed', slideIndex);
  });

  // Handle sending theme update to presentation window
  ipcMain.on('presentation:send-theme-update', async (_event, themeData: any) => {
    console.log('Theme update through theme channel:', themeData);
    const helpers = await getPresentationHelpers();
    helpers.sendToPresentationWindow('presentation:on-theme-update', themeData);
  });

  // Handle sending custom background to presentation window
  ipcMain.on('presentation:set-custom-background', async (_event, backgroundData: any) => {
    console.log('Background update through custom channel:', backgroundData);
    const helpers = await getPresentationHelpers();
    helpers.sendToPresentationWindow('presentation:on-custom-background', backgroundData);
  });

  // Manipulador de tela cheia
  ipcMain.on('presentation:set-fullscreen', async () => {
    const { getPresentationWindow } = await import('./helpers/presentation-window');
    const presWindow = getPresentationWindow();
    if (presWindow) {
      const isFullScreen = presWindow.isFullScreen();
      presWindow.setFullScreen(!isFullScreen);
    }
  });

  // Manipulador do diálogo de tema
  ipcMain.handle('open-theme-dialog', async () => {
    const { getPresentationWindow } = await import('./helpers/presentation-window');
    const presWindow = getPresentationWindow();
    
    if (presWindow) {
      // Abrir um diálogo de tema (você pode criar um diálogo personalizado aqui)
      const result = await dialog.showMessageBox(presWindow, {
        type: 'info',
        title: 'Tema',
        message: 'As configurações de tema serão adicionadas em breve.',
        buttons: ['OK']
      });
    }

    return null; // Por enquanto retorna null, depois retornará as configurações do tema
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

// App event handlers
app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', async () => {
  console.log('✅ Application shutting down.');
});

process.on('uncaughtException', async (error: Error) => {
  console.error('Unhandled Exception in Main Process:', error);
  await fileSystem.logError('Unhandled Exception in Main Process', error);
  app.relaunch();
  app.exit(1);
});

process.on('unhandledRejection', async (reason: Error, promise) => {
  console.error('Unhandled Rejection in Main Process:', reason, promise);
  await fileSystem.logError(`Unhandled Rejection in Main Process: ${reason}`, reason);
  app.relaunch();
  app.exit(1);
});

// ============================================================================
// MCP LYRICS HANDLERS
// ============================================================================

// Initialize MCP services
ipcMain.handle('mcp-lyrics:initialize', async () => {
  try {
    console.log('[Main] Initializing MCP services...');
    const success = await initializeMCP();
    
    if (success) {
      // Initialize provider instances
      fireCrawlProviderInstance = new FireCrawlLyricsProvider(true); // Enable Gemini AI
      mcpLyricsProviderInstance = new MCPLyricsProvider();
      
      console.log('[Main] MCP services initialized successfully');
      return { success: true, message: 'MCP services initialized' };
    } else {
      return { success: false, message: 'Failed to initialize MCP services' };
    }
  } catch (error) {
    console.error('[Main] MCP initialization failed:', error);
    return { success: false, message: error.message };
  }
});

// Get MCP status
ipcMain.handle('mcp-lyrics:status', async () => {
  try {
    const runningServers = mcpService.getRunningServers();
    return {
      initialized: runningServers.length > 0,
      servers: runningServers,
      providers: {
        firecrawl: !!fireCrawlProviderInstance,
        playwright: !!mcpLyricsProviderInstance
      }
    };
  } catch (error) {
    console.error('[Main] Error getting MCP status:', error);
    return { initialized: false, servers: [], providers: {} };
  }
});

// Search with FireCrawl MCP + AI
ipcMain.handle('mcp-lyrics:search-firecrawl', async (event, { artist, title }) => {
  try {
    if (!fireCrawlProviderInstance) {
      throw new Error('FireCrawl provider not initialized');
    }
    
    console.log(`[Main] FireCrawl search: ${artist} - ${title}`);
    const results = await fireCrawlProviderInstance.searchByTitleAndArtist({ artist, title });
    return { success: true, results };
  } catch (error) {
    console.error('[Main] FireCrawl search failed:', error);
    return { success: false, error: error.message, results: [] };
  }
});

// Get lyrics with FireCrawl MCP + AI
ipcMain.handle('mcp-lyrics:get-lyrics-firecrawl', async (event, url) => {
  try {
    if (!fireCrawlProviderInstance) {
      throw new Error('FireCrawl provider not initialized');
    }
    
    console.log(`[Main] FireCrawl get lyrics: ${url}`);
    const result = await fireCrawlProviderInstance.getLyrics(url);
    return { success: true, result };
  } catch (error) {
    console.error('[Main] FireCrawl get lyrics failed:', error);
    return { success: false, error: error.message, result: null };
  }
});

// Search with Playwright MCP
ipcMain.handle('mcp-lyrics:search-playwright', async (event, { artist, title }) => {
  try {
    if (!mcpLyricsProviderInstance) {
      throw new Error('MCP Lyrics provider not initialized');
    }
    
    console.log(`[Main] Playwright MCP search: ${artist} - ${title}`);
    const results = await mcpLyricsProviderInstance.searchByTitleAndArtist({ artist, title });
    return { success: true, results };
  } catch (error) {
    console.error('[Main] Playwright MCP search failed:', error);
    return { success: false, error: error.message, results: [] };
  }
});

// Get lyrics with Playwright MCP
ipcMain.handle('mcp-lyrics:get-lyrics-playwright', async (event, url) => {
  try {
    if (!mcpLyricsProviderInstance) {
      throw new Error('MCP Lyrics provider not initialized');
    }
    
    console.log(`[Main] Playwright MCP get lyrics: ${url}`);
    const result = await mcpLyricsProviderInstance.getLyrics(url);
    return { success: true, result };
  } catch (error) {
    console.error('[Main] Playwright MCP get lyrics failed:', error);
    return { success: false, error: error.message, result: null };
  }
});

// Cleanup MCP services
ipcMain.handle('mcp-lyrics:cleanup', async () => {
  try {
    console.log('[Main] Cleaning up MCP services...');
    await cleanupMCP();
    fireCrawlProviderInstance = null;
    mcpLyricsProviderInstance = null;
    return { success: true, message: 'MCP services cleaned up' };
  } catch (error) {
    console.error('[Main] MCP cleanup failed:', error);
    return { success: false, message: error.message };
  }
});

// Auto-initialize MCP when app is ready
app.whenReady().then(async () => {
  // Give the app a moment to fully initialize
  setTimeout(async () => {
    try {
      console.log('[Main] Auto-initializing MCP services...');
      await initializeMCP();
      
      fireCrawlProviderInstance = new FireCrawlLyricsProvider(true); // Enable Gemini AI
      mcpLyricsProviderInstance = new MCPLyricsProvider();
      
      // Set main window for progress notifications
      const allWindows = BrowserWindow.getAllWindows();
      if (allWindows.length > 0) {
        progressNotificationService.setMainWindow(allWindows[0]);
      }

      // Initialize additional services
      await notificationCustomizationService.initialize();
      await crossDeviceSyncService.initialize();
      
      console.log('[Main] MCP services auto-initialized');
    } catch (error) {
      console.warn('[Main] MCP auto-initialization failed:', error);
    }
  }, 2000);
});

// ============================================================================
// CACHE & ANALYTICS HANDLERS
// ============================================================================

// Get cache statistics
ipcMain.handle('lyrics-cache:get-stats', async () => {
  try {
    const stats = lyricsCacheService.getStats();
    return { success: true, stats };
  } catch (error) {
    console.error('[Main] Error getting cache stats:', error);
    return { success: false, error: error.message };
  }
});

// Clear cache
ipcMain.handle('lyrics-cache:clear', async () => {
  try {
    await lyricsCacheService.clearCache();
    return { success: true, message: 'Cache cleared successfully' };
  } catch (error) {
    console.error('[Main] Error clearing cache:', error);
    return { success: false, error: error.message };
  }
});

// Get analytics statistics
ipcMain.handle('lyrics-analytics:get-stats', async () => {
  try {
    const stats = lyricsAnalyticsService.getStats();
    const performance = lyricsAnalyticsService.getPerformanceMetrics();
    const topSearched = lyricsAnalyticsService.getTopSearched();
    
    return {
      success: true,
      data: {
        stats,
        performance,
        topSearched
      }
    };
  } catch (error) {
    console.error('[Main] Error getting analytics stats:', error);
    return { success: false, error: error.message };
  }
});

// Export analytics data
ipcMain.handle('lyrics-analytics:export', async () => {
  try {
    const data = await lyricsAnalyticsService.exportData();
    return { success: true, data };
  } catch (error) {
    console.error('[Main] Error exporting analytics:', error);
    return { success: false, error: error.message };
  }
});

// Clear analytics data
ipcMain.handle('lyrics-analytics:clear', async () => {
  try {
    await lyricsAnalyticsService.clearData();
    return { success: true, message: 'Analytics data cleared successfully' };
  } catch (error) {
    console.error('[Main] Error clearing analytics:', error);
    return { success: false, error: error.message };
  }
});

// Get events in date range
ipcMain.handle('lyrics-analytics:get-events', async (event, { startTime, endTime }) => {
  try {
    const events = lyricsAnalyticsService.getEventsInRange(startTime, endTime);
    return { success: true, events };
  } catch (error) {
    console.error('[Main] Error getting analytics events:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// MUSIC LIBRARY INTEGRATION HANDLERS
// ============================================================================

// Get lyrics for a specific song
ipcMain.handle('music-library:get-lyrics', async (event, song) => {
  try {
    const result = await musicLibraryIntegration.getLyricsForSong(song);
    return result;
  } catch (error) {
    console.error('[Main] Error getting lyrics for song:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Batch process multiple songs
ipcMain.handle('music-library:batch-get-lyrics', async (event, songs) => {
  try {
    const result = await musicLibraryIntegration.batchGetLyrics(songs);
    return { success: true, ...result };
  } catch (error) {
    console.error('[Main] Error in batch lyrics processing:', error);
    return {
      success: false,
      error: error.message,
      processed: 0,
      successful: 0,
      failed: 0,
      results: []
    };
  }
});

// Auto-fill lyrics for songs without lyrics
ipcMain.handle('music-library:auto-fill-lyrics', async (event, songs) => {
  try {
    const result = await musicLibraryIntegration.autoFillLyrics(songs);
    return { success: true, ...result };
  } catch (error) {
    console.error('[Main] Error in auto-fill lyrics:', error);
    return {
      success: false,
      error: error.message,
      processed: 0,
      filled: 0,
      skipped: 0,
      failed: 0
    };
  }
});

// Search and replace lyrics for a song
ipcMain.handle('music-library:search-and-replace-lyrics', async (event, song) => {
  try {
    const result = await musicLibraryIntegration.searchAndReplaceLyrics(song);
    return result;
  } catch (error) {
    console.error('[Main] Error searching and replacing lyrics:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Get comprehensive lyrics statistics
ipcMain.handle('music-library:get-lyrics-stats', async () => {
  try {
    const stats = await musicLibraryIntegration.getLyricsStats();
    return { success: true, stats };
  } catch (error) {
    console.error('[Main] Error getting music library stats:', error);
    return { success: false, error: error.message };
  }
});

// Start/stop auto-processing queue
ipcMain.handle('music-library:start-auto-processing', async () => {
  try {
    musicLibraryIntegration.startAutoProcessing();
    return { success: true, message: 'Auto-processing started' };
  } catch (error) {
    console.error('[Main] Error starting auto-processing:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('music-library:stop-auto-processing', async () => {
  try {
    musicLibraryIntegration.stopAutoProcessing();
    return { success: true, message: 'Auto-processing stopped' };
  } catch (error) {
    console.error('[Main] Error stopping auto-processing:', error);
    return { success: false, error: error.message };
  }
});

// Add songs to processing queue
ipcMain.handle('music-library:add-to-queue', async (event, songs) => {
  try {
    musicLibraryIntegration.addToQueue(songs);
    return { success: true, message: `Added ${songs.length} songs to queue` };
  } catch (error) {
    console.error('[Main] Error adding songs to queue:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// SUPABASE LYRICS INTEGRATION HANDLERS
// ============================================================================

// Get songs without lyrics from Supabase
ipcMain.handle('supabase-lyrics:get-songs-without-lyrics', async (event, limit = 100) => {
  try {
    const songs = await supabaseLyricsIntegration.getSongsWithoutLyrics(limit);
    return { success: true, songs };
  } catch (error) {
    console.error('[Main] Error getting songs without lyrics:', error);
    return { success: false, error: error.message, songs: [] };
  }
});

// Search songs in Supabase
ipcMain.handle('supabase-lyrics:search-songs', async (event, { query, limit = 50 }) => {
  try {
    const songs = await supabaseLyricsIntegration.searchSongs(query, limit);
    return { success: true, songs };
  } catch (error) {
    console.error('[Main] Error searching songs:', error);
    return { success: false, error: error.message, songs: [] };
  }
});

// Get song by ID from Supabase
ipcMain.handle('supabase-lyrics:get-song', async (event, songId) => {
  try {
    const song = await supabaseLyricsIntegration.getSongById(songId);
    return { success: true, song };
  } catch (error) {
    console.error('[Main] Error getting song:', error);
    return { success: false, error: error.message, song: null };
  }
});

// Update song lyrics in Supabase
ipcMain.handle('supabase-lyrics:update-lyrics', async (event, { songId, lyrics, source, metadata }) => {
  try {
    const result = await supabaseLyricsIntegration.updateSongLyrics(songId, lyrics, source, metadata);
    return result;
  } catch (error) {
    console.error('[Main] Error updating song lyrics:', error);
    return { success: false, error: error.message };
  }
});

// Create new song with lyrics in Supabase
ipcMain.handle('supabase-lyrics:create-song', async (event, { artist, title, lyrics, source, metadata }) => {
  try {
    const result = await supabaseLyricsIntegration.createSongWithLyrics(artist, title, lyrics, source, metadata);
    return result;
  } catch (error) {
    console.error('[Main] Error creating song:', error);
    return { success: false, error: error.message };
  }
});

// Delete song lyrics in Supabase
ipcMain.handle('supabase-lyrics:delete-lyrics', async (event, songId) => {
  try {
    const result = await supabaseLyricsIntegration.deleteSongLyrics(songId);
    return result;
  } catch (error) {
    console.error('[Main] Error deleting song lyrics:', error);
    return { success: false, error: error.message };
  }
});

// Get library statistics from Supabase
ipcMain.handle('supabase-lyrics:get-stats', async () => {
  try {
    const stats = await supabaseLyricsIntegration.getLibraryStats();
    return { success: true, stats };
  } catch (error) {
    console.error('[Main] Error getting library stats:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================================
// PROGRESS NOTIFICATION HANDLERS
// ============================================================================

// Get all active progress
ipcMain.handle('progress:get-all', () => {
  return progressNotificationService.getActiveProgress();
});

// Get specific progress
ipcMain.handle('progress:get', (event, progressId) => {
  return progressNotificationService.getActiveProgress().find(p => p.id === progressId) || null;
});

// Cancel progress
ipcMain.handle('progress:cancel', (event, progressId) => {
  return progressNotificationService.cancelProgress(progressId);
});

// Clear completed progress
ipcMain.handle('progress:clear-completed', () => {
  progressNotificationService.clearCompleted();
  return { success: true };
});

// Update notification options
ipcMain.handle('progress:update-options', (event, options) => {
  // Implementation depends on how you want to store user preferences
  // For now, we'll just return success
  return { success: true };
});

// Full-text search songs in Supabase
ipcMain.handle('supabase-lyrics:fulltext-search', async (event, { query, limit = 20 }) => {
  try {
    const songs = await supabaseLyricsIntegration.fullTextSearchSongs(query, limit);
    return { success: true, songs };
  } catch (error) {
    console.error('[Main] Error in fulltext search:', error);
    return { success: false, error: error.message, songs: [] };
  }
});

// Cleanup MCP when app is closing
app.on('before-quit', async () => {
  console.log('[Main] App closing, cleaning up all services...');
  await cleanupMCP();
  await crossDeviceSyncService.cleanup();
  console.log('[Main] All services cleaned up');
});
