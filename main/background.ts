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
import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron';
import serve from 'electron-serve';
import settings from 'electron-settings';
import { createWindow } from './helpers';
import * as lyrics from './helpers/lyrics';
import * as bible from './helpers/bible';
import { createQuickScreen, showQuickScreen, hideQuickScreen } from './helpers/quick-screen';
import sanitize from 'sanitize-filename';
import fse from 'fs-extra';
import createTouchBarLyrics from './helpers/create-touchbar-items';
import { SearchType, Slide } from './shared/types';
import { logError } from './helpers/file-system';

let lyricsWindow: BrowserWindow;
let lyricsSettingsWindow: BrowserWindow;
let mainWindow: BrowserWindow;
let videoPlayerWindow: BrowserWindow;
let videoControlWindow: BrowserWindow;
let lastLoadedLyrics: Slide[] | null = null;

const isProd: boolean = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

  const { migrateOldSongsToNewStructure } = await import('./helpers/file-system');
  await migrateOldSongsToNewStructure();

  mainWindow = createWindow('main', {
    width: 800,
    height: 600,
  });

  if (isProd) {
    await mainWindow.loadURL('app://./index.html');
  } else {
    const port = process.argv[2];
    // mainWindow.webContents.openDevTools();
    await mainWindow.loadURL(`http://localhost:${port}/`);
  }

  createQuickScreen();

  globalShortcut.register('CommandOrControl+Shift+L', () => {
    if (quickScreenWindow.isVisible()) {
      hideQuickScreen();
    } else {
      showQuickScreen();
    }
  });

  mainWindow.on('closed', () => {
    if (lyricsSettingsWindow && !lyricsSettingsWindow.isDestroyed()) {
      lyricsSettingsWindow.close();
    }
    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
      lyricsWindow.close();
    }
    if (videoControlWindow && !videoControlWindow.isDestroyed()) {
      videoControlWindow.close();
    }
    if (videoPlayerWindow && !videoPlayerWindow.isDestroyed()) {
      videoPlayerWindow.close();
    }
  });
})();

export async function openLyricsWindow(url, filePath, isDefault = false) {
  // Ensure base app directories exist
  try {
    const documentsPath = app.getPath('documents');
    await fse.ensureDir(`${documentsPath}/lyrics-slide-show/songs`);
    await fse.ensureDir(`${documentsPath}/lyrics-slide-show/default-slides`);
    await fse.ensureDir(`${documentsPath}/lyrics-slide-show/videos`);
  } catch (e) {
    // noop: directory creation failure should not crash window creation
  }

  const displays = screen.getAllDisplays();

  const displayToShowTheLyrics = displays?.[1] || displays?.[0];
  lyricsWindow = createWindow('lyrics', {
    ...displayToShowTheLyrics.bounds,
    width: 800,
    height: 600,
    fullscreen: true,
  });

  lyricsSettingsWindow = createWindow('lyricsSettings', {
    width: 800,
    height: 600,
  });

  lyricsWindow.on('closed', () => {
    if (!lyricsSettingsWindow?.isDestroyed()) {
      lyricsSettingsWindow?.close();
    }
  });

  lyricsSettingsWindow.on('closed', () => {
    if (!lyricsWindow?.isDestroyed()) {
      lyricsWindow?.close();
    }
  });

  // Validate inputs and build query string
  let additionalQueryString = '';
  
  if (url && typeof url === 'string' && url.trim().length > 0) {
    additionalQueryString = `?url=${encodeURIComponent(url)}`;
    console.log('🔗 Opening lyrics with URL:', url);
  } else if (filePath && typeof filePath === 'string' && filePath.trim().length > 0) {
    additionalQueryString = `?filePath=${encodeURIComponent(filePath)}&isDefault=${isDefault}`;
    console.log('📂 Opening lyrics with file path:', filePath, 'isDefault:', isDefault);
  } else {
    console.warn('⚠️ openLyricsWindow: No valid URL or filePath provided');
    console.warn('   url:', url, '(type:', typeof url, ')');
    console.warn('   filePath:', filePath, '(type:', typeof filePath, ')');
    // Fall back to empty lyrics page
    additionalQueryString = '?empty=true';
  }

  if (isProd) {
    await lyricsWindow.loadURL(`app://./lyrics.html${additionalQueryString}`);
    await lyricsSettingsWindow.loadURL(
      `app://./lyrics-settings.html?windowid=${lyricsWindow.id}`
    );
  } else {
    const port = process.argv[2];
    await lyricsWindow.loadURL(`http://localhost:${port}/lyrics${additionalQueryString}`);

    lyricsWindow.webContents.openDevTools();
    lyricsSettingsWindow.webContents.openDevTools();

    await lyricsSettingsWindow.loadURL(
      `http://localhost:${port}/lyrics-settings?windowid=${lyricsWindow.id}`
    );
  }

  console.log('🪟 Main: Created lyrics windows. Lyrics window ID:', lyricsWindow.id, 'Settings window ID:', lyricsSettingsWindow.id);

  // Once settings window is ready, resend last lyrics if any queued
  lyricsSettingsWindow.webContents.on('did-finish-load', () => {
    console.log('📊 Settings window loaded, last lyrics count:', lastLoadedLyrics?.length || 0);
    // Add a small delay to ensure React has mounted
    setTimeout(() => {
      if (lastLoadedLyrics && !lyricsSettingsWindow.isDestroyed()) {
        console.log('📤 Sending lyrics to settings window:', lastLoadedLyrics.length, 'lines');
        lyricsSettingsWindow.webContents.send('loaded-lyrics', lastLoadedLyrics);
      }
    }, 500);
  });
}

ipcMain.on('open-lyrics-window', (event, { url, filePath, isDefault = false }) => {
  openLyricsWindow(url, filePath, isDefault);
});

// Video Player functionality
export async function openVideoPlayerWindow() {
  const displays = screen.getAllDisplays();
  const displayToShowTheVideo = displays?.[1] || displays?.[0];

  videoPlayerWindow = createWindow('videoPlayer', {
    ...displayToShowTheVideo.bounds,
    width: 800,
    height: 600,
    fullscreen: true,
  });

  videoControlWindow = createWindow('videoControl', {
    width: 800,
    height: 600,
  });

  videoPlayerWindow.on('closed', () => {
    if (!videoControlWindow?.isDestroyed()) {
      videoControlWindow?.close();
    }
  });

  videoControlWindow.on('closed', () => {
    if (!videoPlayerWindow?.isDestroyed()) {
      videoPlayerWindow?.close();
    }
  });

  if (isProd) {
    await videoPlayerWindow.loadURL('app://./video-player.html');
    await videoControlWindow.loadURL(
      `app://./video-control.html?windowid=${videoPlayerWindow.webContents.id}`
    );
  } else {
    const port = process.argv[2];
    await videoPlayerWindow.loadURL(`http://localhost:${port}/video-player`);
    await videoControlWindow.loadURL(
      `http://localhost:${port}/video-control?windowid=${videoPlayerWindow.webContents.id}`
    );
  }
}

ipcMain.on('open-video-player-window', () => {
  openVideoPlayerWindow();
});

// Video player control commands
ipcMain.on('video-play', (event) => {
  console.log('🎮 Main: Received video-play command');
  if (videoPlayerWindow && !videoPlayerWindow.isDestroyed()) {
    console.log('✅ Main: Sending video-play to player window');
    videoPlayerWindow.webContents.send('video-play');
  } else {
    console.log('❌ Main: Video player window not available');
  }
});

ipcMain.on('video-pause', (event) => {
  console.log('🎮 Main: Received video-pause command');
  if (videoPlayerWindow && !videoPlayerWindow.isDestroyed()) {
    console.log('✅ Main: Sending video-pause to player window');
    videoPlayerWindow.webContents.send('video-pause');
  } else {
    console.log('❌ Main: Video player window not available');
  }
});

ipcMain.on('video-seek', (event, { time }) => {
  console.log('🎮 Main: Received video-seek command:', time);
  if (videoPlayerWindow && !videoPlayerWindow.isDestroyed()) {
    console.log('✅ Main: Sending video-seek to player window');
    videoPlayerWindow.webContents.send('video-seek', { time });
  } else {
    console.log('❌ Main: Video player window not available');
  }
});

ipcMain.on('video-volume', (event, { volume }) => {
  console.log('🎮 Main: Received video-volume command:', volume);
  if (videoPlayerWindow && !videoPlayerWindow.isDestroyed()) {
    console.log('✅ Main: Sending video-volume to player window');
    videoPlayerWindow.webContents.send('video-volume', { volume });
  } else {
    console.log('❌ Main: Video player window not available');
  }
});

ipcMain.on('load-video', (event, { url }) => {
  console.log('🎮 Main: Received load-video command:', url);
  if (videoPlayerWindow && !videoPlayerWindow.isDestroyed()) {
    console.log('✅ Main: Sending load-video to player window');
    videoPlayerWindow.webContents.send('load-video', { url });
  } else {
    console.log('❌ Main: Video player window not available');
  }
});

ipcMain.on('video-stop', (event) => {
  console.log('🎮 Main: Received video-stop command');
  if (videoPlayerWindow && !videoPlayerWindow.isDestroyed()) {
    console.log('✅ Main: Sending video-stop to player window');
    videoPlayerWindow.webContents.send('video-stop');
  } else {
    console.log('❌ Main: Video player window not available');
  }
});

ipcMain.on('video-time-update', (event, { currentTime, duration }) => {
  if (videoControlWindow && !videoControlWindow.isDestroyed()) {
    videoControlWindow.webContents.send('video-time-update', { currentTime, duration });
  }
});

ipcMain.handle('get-path', (event, { name }) => {
  return app.getPath(name);
});

ipcMain.handle('get-all-local-songs', async () => {
  const { getAllSongsGroupedByArtist } = await import('./helpers/file-system');
  return getAllSongsGroupedByArtist();
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
  try {
    console.log('📥 Processing URL:', url);
    
    // Handle different URL formats
    let artist = '';
    let title = '';
    
    // Try regex for internal paths like "/artist/song.html"
    const internalRegex = /^\/(.+?)\/(.+?)(?:\.html)?$/;
    const internalMatch = url.match(internalRegex);
    
    if (internalMatch) {
      artist = internalMatch[1].replace(/-/g, ' ');
      title = internalMatch[2].replace(/-/g, ' ').replace(/\.html$/, '');
      console.log('📋 Parsed from internal URL - Artist:', artist, 'Title:', title);
    } else {
      // Handle full URLs like "https://www.letras.mus.br/diante-do-trono/1923221/"
      const fullUrlRegex = /\/([^\/]+)\/([^\/]+)\/?$/;
      const fullMatch = url.match(fullUrlRegex);
      
      if (fullMatch) {
        artist = fullMatch[1].replace(/-/g, ' ');
        title = fullMatch[2].replace(/-/g, ' ');
        console.log('📋 Parsed from full URL - Artist:', artist, 'Title:', title);
      } else {
        throw new Error(`Invalid URL format: ${url}`);
      }
    }
    
    if (!artist || !title) {
      throw new Error(`Could not extract artist and title from URL: ${url}`);
    }

    const response = await lyrics.searchByTitleAndArtistExact({ artist, title });
    
    if (!response || !response.lyrics) {
      throw new Error(`No lyrics found for ${artist} - ${title}`);
    }

    const { getAnalyzedSlides } = await import('./helpers/song-analyzer');
    const lyricArray = await getAnalyzedSlides(artist, title, response.lyrics);
    
    if (!lyricArray || !Array.isArray(lyricArray)) {
      throw new Error('Failed to analyze lyrics - no slides generated');
    }

    const { saveSong, songExists } = await import('./helpers/file-system');
    if (!(await songExists(artist, title))) {
      await saveSong(artist, title, response.lyrics);
    }

    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
      lyricsWindow.setTouchBar(createTouchBarLyrics(lyricsWindow, lyricArray.map(l => l.text)));
      lyricsWindow.focus();
    }

    // Cache and send to settings window when available
    lastLoadedLyrics = lyricArray;
    console.log('💾 Cached lyrics from URL:', lyricArray.length, 'lines');

    // Wait a bit to ensure settings window is ready
    setTimeout(() => {
      if (lyricsSettingsWindow && !lyricsSettingsWindow.isDestroyed()) {
        console.log('📤 Sending lyrics to settings window (from URL handler)');
        lyricsSettingsWindow.webContents.send('loaded-lyrics', lyricArray);
      } else {
        console.log('⏸️ Settings window not ready, lyrics will be sent when window loads');
      }
    }, 1000);

    return lyricArray;
  } catch (error) {
    console.error('❌ Error in get-lyric-by-url-handle:', error.message);
    console.error('📋 URL:', url);
    throw error; // Re-throw to send proper error to renderer
  }
});

ipcMain.handle('get-lyric-by-file-path', async (event, { filePath, isDefault = false }) => {
  try {
    console.log('📝 Processing file path:', filePath);
    
    // Validate filePath
    if (!filePath || filePath === 'null' || filePath === 'undefined') {
      throw new Error(`Invalid file path: ${filePath}`);
    }
    
    const documentsPath = app.getPath('documents');
    const fullPath = `${documentsPath}/lyrics-slide-show/${isDefault ? 'default-slides' : 'songs'}/${filePath}`;
    
    console.log('📂 Full path:', fullPath);
    
    // Check if file exists
    if (!(await fse.pathExists(fullPath))) {
      throw new Error(`File does not exist: ${fullPath}`);
    }
    
    const fileContent = await fse.readFile(fullPath, { encoding: 'utf8' });

    console.log('📄 Reading file:', fullPath);

    const { parseSongFileContent } = await import('./helpers/file-system');
    // Always parse as JSON with metadata (no .txt files anymore)
    const lyricsData = parseSongFileContent(fileContent);

    const { lyrics: rawLyrics, metadata } = lyricsData;
    
    if (!rawLyrics || !metadata) {
      throw new Error('Invalid file format - missing lyrics or metadata');
    }
    
    if (!metadata.artist || !metadata.title) {
      throw new Error('Invalid metadata - missing artist or title');
    }

    const { getAnalyzedSlides } = await import('./helpers/song-analyzer');
    const lyricArray = await getAnalyzedSlides(metadata.artist, metadata.title, rawLyrics);
    
    if (!lyricArray || !Array.isArray(lyricArray)) {
      throw new Error('Failed to analyze lyrics - no slides generated');
    }

    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
      lyricsWindow.setTouchBar(createTouchBarLyrics(lyricsWindow, lyricArray.map(l => l.text)));
    }

    // Cache and send to settings window
    lastLoadedLyrics = lyricArray;
    console.log('💾 Cached lyrics from file:', lyricArray.length, 'lines');

    // Wait a bit to ensure settings window is ready
    setTimeout(() => {
      if (lyricsSettingsWindow && !lyricsSettingsWindow.isDestroyed()) {
        console.log('📤 Sending lyrics to settings window (from file handler)');
        lyricsSettingsWindow.webContents.send('loaded-lyrics', lyricArray);
      } else {
        console.log('⏸️ Settings window not ready, lyrics will be sent when window loads');
      }
    }, 1000);

    return lyricArray;
  } catch (error) {
    console.error('❌ Error in get-lyric-by-file-path:', error.message);
    console.error('📂 File path:', filePath);
    console.error('🔄 Is default:', isDefault);
    throw error; // Re-throw to send proper error to renderer
  }
});

// Listen for the 'focus-target-window' message from the renderer process
ipcMain.on('focus-target-window', (event, { windowId }) => {
  // Get the BrowserWindow instance of the target window by its ID
  const targetWindow = BrowserWindow.fromId(windowId);

  // Focus the target window
  if (targetWindow) {
    targetWindow.focus();
  }
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

ipcMain.handle('suggest-background-media', async (_event, { lyrics }) => {
  const { suggestBackgroundMedia } = await import('./helpers/ai-service');
  return suggestBackgroundMedia(lyrics);
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

ipcMain.handle('generate-chords', async (_event, { lyrics }) => {
  const { generateChords } = await import('./helpers/ai-service');
  return generateChords(lyrics);
});

ipcMain.handle('get-setting', async (_event, key) => {
  return settings.get(key);
});

ipcMain.handle('set-setting', async (_event, { key, value }) => {
  return settings.set(key, value);
});

ipcMain.on('select-video-background', (event, { windowId, video }) => {
  console.log('📨 IPC: Received select-video-background. WindowId:', windowId, 'Video:', video);
  const targetWindow = BrowserWindow.fromId(windowId);
  if (targetWindow && !targetWindow.isDestroyed()) {
    console.log('✅ IPC: Sending to lyrics window. Window exists:', !targetWindow.isDestroyed());
    targetWindow.webContents.send('selected-video-background', video);
  } else {
    console.error('❌ IPC: Target window not found or destroyed. WindowId:', windowId);
  }
});

ipcMain.on('set-custom-background', (event, { windowId, background }) => {
  console.log('📨 IPC: Received set-custom-background. WindowId:', windowId, 'Background:', background?.substring?.(0, 50) || background);
  const targetWindow = BrowserWindow.fromId(windowId);
  if (targetWindow && !targetWindow.isDestroyed()) {
    console.log('✅ IPC: Sending to lyrics window. Window exists:', !targetWindow.isDestroyed());
    targetWindow.webContents.send('custom-background', background);
  } else {
    console.error('❌ IPC: Target window not found or destroyed. WindowId:', windowId);
  }
});

ipcMain.on('set-active-slide', (event, { windowId, index }) => {
  console.log('🎮 Main: Received set-active-slide. WindowId:', windowId, 'Index:', index);
  console.log('🔍 Main: All windows:', BrowserWindow.getAllWindows().map(w => ({ id: w.id, title: w.getTitle() })));
  const targetWindow = BrowserWindow.fromId(windowId);
  if (targetWindow && !targetWindow.isDestroyed()) {
    console.log('✅ Main: Sending slide-clicked-index to lyrics window. Window title:', targetWindow.getTitle());
    targetWindow.webContents.send('slide-clicked-index', index);
  } else {
    console.log('❌ Main: Target window not found or destroyed. WindowId:', windowId);
  }
});

ipcMain.on('update-lyrics-theme', (event, { windowId, themeData }) => {
  console.log('🎮 Main: Received update-lyrics-theme. WindowId:', windowId, 'Theme data:', themeData);
  console.log('🔍 Main: All windows:', BrowserWindow.getAllWindows().map(w => ({ id: w.id, title: w.getTitle() })));
  const targetWindow = BrowserWindow.fromId(windowId);
  if (targetWindow && !targetWindow.isDestroyed()) {
    console.log('✅ Main: Sending theme-update to lyrics window. Window title:', targetWindow.getTitle());
    targetWindow.webContents.send('theme-update', themeData);
  } else {
    console.log('❌ Main: Target window not found or destroyed. WindowId:', windowId);
  }
});

ipcMain.on('renderer-error', async (event, errorDetails) => {
  console.error('Unhandled Error in Renderer Process (via IPC):', errorDetails);
  await logError(`Unhandled Error in Renderer Process (${errorDetails.type})`, {
    name: 'RendererError',
    message: errorDetails.message,
    stack: errorDetails.stack,
  });
});

// CRUD de músicas
ipcMain.handle('save-song', async (_event, { artist, title, lyrics, metadata }) => {
  const { saveSong } = await import('./helpers/file-system');
  try {
    const filePath = await saveSong(artist, title, lyrics, metadata);
    console.log(`✅ Song saved: ${artist} - ${title}`);
    return { success: true, filePath };
  } catch (error) {
    console.error('❌ Error saving song:', error);
    await logError('Error saving song', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-song', async (_event, { artist, title, lyrics, metadata }) => {
  const { getSongFilePath, createSongFileContent, getArtistFolderPath } = await import('./helpers/file-system');
  try {
    // Check if artist or title changed (metadata contains new values if they changed)
    const newArtist = metadata?.artist || artist;
    const newTitle = metadata?.title || title;
    const hasLocationChanged = newArtist !== artist || newTitle !== title;

    if (hasLocationChanged) {
      // Delete old file
      const oldFilePath = getSongFilePath(artist, title);
      const oldExists = await fse.pathExists(oldFilePath);
      if (oldExists) {
        await fse.remove(oldFilePath);
        console.log(`🗑️ Deleted old file: ${oldFilePath}`);
      }

      // Create new file at new location
      const { artist: _a, title: _t, ...cleanMetadata } = metadata || {};
      const newFilePath = getSongFilePath(newArtist, newTitle);

      // Ensure artist folder exists
      const artistFolder = getArtistFolderPath(newArtist);
      await fse.ensureDir(artistFolder);

      const fileContent = createSongFileContent(newArtist, newTitle, lyrics, {
        ...cleanMetadata,
        updatedAt: new Date().toISOString().split('T')[0],
      });

      await fse.writeFile(newFilePath, fileContent, 'utf8');
      console.log(`✅ Song moved and updated: ${artist} - ${title} → ${newArtist} - ${newTitle}`);
      return { success: true, filePath: newFilePath };
    } else {
      // Just update the existing file
      const filePath = getSongFilePath(artist, title);
      const fileContent = createSongFileContent(artist, title, lyrics, {
        ...metadata,
        updatedAt: new Date().toISOString().split('T')[0],
      });

      await fse.writeFile(filePath, fileContent, 'utf8');
      console.log(`✅ Song updated: ${artist} - ${title}`);
      return { success: true, filePath };
    }
  } catch (error) {
    console.error('❌ Error updating song:', error);
    await logError('Error updating song', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-song', async (_event, { artist, title }) => {
  const { getSongFilePath } = await import('./helpers/file-system');
  try {
    const filePath = getSongFilePath(artist, title);
    await fse.remove(filePath);
    console.log(`✅ Song deleted: ${artist} - ${title}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting song:', error);
    await logError('Error deleting song', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-song', async (_event, { artist, title }) => {
  const { readSong } = await import('./helpers/file-system');
  try {
    const songData = await readSong(artist, title);
    return { success: true, ...songData };
  } catch (error) {
    console.error('❌ Error reading song:', error);
    await logError('Error reading song', error);
    return { success: false, error: error.message };
  }
});

// Advanced Metadata Handlers
ipcMain.handle('get-advanced-song-analysis', async (_event, { artist, title, estimatedDuration }) => {
  console.log('🧠 Get advanced song analysis request:', `${artist} - ${title}`);
  const { getAdvancedSongAnalysis } = await import('./helpers/song-analyzer');
  
  try {
    // First, get the lyrics
    const { readSong } = await import('./helpers/file-system');
    const songData = await readSong(artist, title);
    
    if (!songData?.lyrics) {
      throw new Error('Song not found or has no lyrics');
    }
    
    const analysis = await getAdvancedSongAnalysis(artist, title, songData.lyrics, estimatedDuration);
    return analysis;
  } catch (error) {
    console.error('❌ Error getting advanced song analysis:', error);
    await logError('Error getting advanced song analysis', error);
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
    await logError('Error updating song analysis', error);
    throw error;
  }
});

ipcMain.handle('generate-advanced-metadata', async (_event, { artist, title, lyrics, estimatedDuration }) => {
  console.log('🤖 Generate advanced metadata request:', `${artist} - ${title}`);
  const { generateAdvancedMetadata } = await import('./helpers/advanced-lyrics-analyzer');
  
  try {
    const analysis = await generateAdvancedMetadata(artist, title, lyrics, estimatedDuration);
    return analysis;
  } catch (error) {
    console.error('❌ Error generating advanced metadata:', error);
    await logError('Error generating advanced metadata', error);
    throw error;
  }
});

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
