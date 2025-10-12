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
import { SearchType } from '../renderer/shared/types';
import { logError } from './helpers/file-system';

let lyricsWindow: BrowserWindow;
let lyricsSettingsWindow: BrowserWindow;
let mainWindow: BrowserWindow;
let lastLoadedLyrics: string[] | null = null;

const isProd: boolean = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

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

  const additionalQueryString = url
    ? `?url=${encodeURIComponent(url)}`
    : `?filePath=${encodeURIComponent(filePath)}&isDefault=${isDefault}`;

  if (isProd) {
    await lyricsWindow.loadURL(`app://./lyrics.html${additionalQueryString}`);
    await lyricsSettingsWindow.loadURL(
      `app://./lyrics-settings.html?windowid=${lyricsWindow.webContents.id}`
    );
  } else {
    const port = process.argv[2];
    await lyricsWindow.loadURL(`http://localhost:${port}/lyrics${additionalQueryString}`);

    // lyricsWindow.webContents.openDevTools();

    await lyricsSettingsWindow.loadURL(
      `http://localhost:${port}/lyrics-settings?windowid=${lyricsWindow.webContents.id}`
    );
  }

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
  return files.map(item => (item.includes('.txt') ? item : undefined)).filter(Boolean);
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
  const regex = /^\/(.+?)\/(.+?)\.html$/;

  const [, artist, title] = url.match(regex);

  const response = await lyrics.searchByTitleAndArtistExact({ artist, title });

  const lyricArray: Array<string> = response.lyrics
    .replaceAll('/', '\n')
    .replace('\\', '\n')
    .split('\n')
    .map(text => text.trim())
    .filter(Boolean);

  const documentsPath = app.getPath('documents');
  const filename = sanitize(`${artist} - ${title}.txt`);

  const fileFullPath = `${documentsPath}/lyrics-slide-show/songs/${filename}`;

  const pathExists = await fse.pathExists(fileFullPath);

  if (!pathExists) {
    await fse.outputFile(fileFullPath, lyricArray.join('\n'));
  }

  if (lyricsWindow && !lyricsWindow.isDestroyed()) {
    lyricsWindow.setTouchBar(createTouchBarLyrics(lyricsWindow, lyricArray));
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
});

ipcMain.handle('get-lyric-by-file-path', async (event, { filePath, isDefault = false }) => {
  const documentsPath = app.getPath('documents');

  const fileContent = await fse.readFile(
    `${documentsPath}/lyrics-slide-show/${isDefault ? 'default-slides' : 'songs'}/${filePath}`,
    {
      encoding: 'utf8',
    }
  );

  // Parse the file content to separate frontmatter from lyrics
  const { parseSongFileContent } = await import('./helpers/file-system');
  const { lyrics } = parseSongFileContent(fileContent);

  // Split lyrics into lines and filter empty ones
  const lyricArray = lyrics.split('\n').filter(line => line.trim() !== '');

  if (lyricsWindow && !lyricsWindow.isDestroyed()) {
    lyricsWindow.setTouchBar(createTouchBarLyrics(lyricsWindow, lyricArray));
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

ipcMain.handle('suggest-bible-verses', async (_event, { lyrics: lyricsText }) => {
  return lyrics.suggestBibleVerses(lyricsText);
});

ipcMain.handle('suggest-theme', async () => {
  const { suggestTheme } = await import('./helpers/ai-service');
  return suggestTheme();
});

ipcMain.handle('get-setting', async (_event, key) => {
  return settings.get(key);
});

ipcMain.handle('set-setting', async (_event, { key, value }) => {
  return settings.set(key, value);
});

ipcMain.on('select-video-background', (event, { windowId, video }) => {
  const targetWindow = BrowserWindow.fromId(windowId);
  if (targetWindow && !targetWindow.isDestroyed()) {
    targetWindow.webContents.send('selected-video-background', video);
  }
});

ipcMain.on('set-custom-background', (event, { windowId, background }) => {
  const targetWindow = BrowserWindow.fromId(windowId);
  if (targetWindow && !targetWindow.isDestroyed()) {
    targetWindow.webContents.send('custom-background', background);
  }
});

ipcMain.on('set-active-slide', (event, { windowId, index }) => {
  const targetWindow = BrowserWindow.fromId(windowId);
  if (targetWindow && !targetWindow.isDestroyed()) {
    targetWindow.webContents.send('slide-clicked-index', index);
  }
});

ipcMain.on('update-lyrics-theme', (event, { windowId, themeData }) => {
  const targetWindow = BrowserWindow.fromId(windowId);
  if (targetWindow && !targetWindow.isDestroyed()) {
    targetWindow.webContents.send('theme-update', themeData);
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
