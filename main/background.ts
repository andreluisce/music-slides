import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import * as lyrics from './helpers/lyrics';
import * as bible from './helpers/bible';
import { createQuickScreen, showQuickScreen, hideQuickScreen } from './helpers/quick-screen';
import sanitize from 'sanitize-filename';
import fse from 'fs-extra';
import createTouchBarLyrics from './helpers/create-touchbar-items';
import { SearchType } from '../renderer/shared/types';

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
    if (lastLoadedLyrics && !lyricsSettingsWindow.isDestroyed()) {
      lyricsSettingsWindow.webContents.send('loaded-lyrics', lastLoadedLyrics);
    }
  });
}

ipcMain.handle('openLyricsWindow', (event, { url, filePath, isDefault = false }) => {
  openLyricsWindow(url, filePath, isDefault);
});

ipcMain.handle('getPath', (event, { name }) => {
  return app.getPath(name);
});

ipcMain.handle('getAllLocalSongs', async () => {
  const documentsPath = app.getPath('documents');
  const baseDir = `${documentsPath}/lyrics-slide-show`;
  const songsDir = `${baseDir}/songs`;
  const videosDir = `${baseDir}/videos`;

  await fse.ensureDir(songsDir);
  await fse.ensureDir(videosDir);

  const files = await fse.readdir(songsDir);
  return files
    .map(item => (item.includes('.txt') ? item : undefined))
    .filter(Boolean)
    .sort();
});

ipcMain.handle('getDefaultSlides', async () => {
  const documentsPath = app.getPath('documents');
  const defaultSlidesDir = `${documentsPath}/lyrics-slide-show/default-slides`;

  await fse.ensureDir(defaultSlidesDir);

  const files = await fse.readdir(defaultSlidesDir);
  return files.map(item => (item.includes('.txt') ? item : undefined)).filter(Boolean);
});

ipcMain.handle('findLyrics', async (_event, { searchType, artist, title }) => {
  switch (searchType) {
    case SearchType.ByAnyParameter:
      return lyrics.findByAnyParameter(`${artist} ${title}`);
    case SearchType.ByTitleAndArtist:
      return lyrics.searchByTitleAndArtist({ artist, title });
    case SearchType.ByTitleAndArtistExact:
      return lyrics.searchByTitleAndArtistExact({ artist, title });
  }
});

ipcMain.handle('getLyricByUrlHandle', async (event, { url }) => {
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
  if (lyricsSettingsWindow && !lyricsSettingsWindow.isDestroyed()) {
    lyricsSettingsWindow.webContents.send('loaded-lyrics', lyricArray);
  }

  return lyricArray;
});

ipcMain.handle('getLyricByFilePath', async (event, { filePath, isDefault = false }) => {
  const documentsPath = app.getPath('documents');

  const lyric = await fse.readFile(
    `${documentsPath}/lyrics-slide-show/${isDefault ? 'default-slides' : 'songs'}/${filePath}`,
    {
      encoding: 'utf8',
    }
  );

  const lyricArray = lyric.split('\n');

  if (lyricsWindow && !lyricsWindow.isDestroyed()) {
    lyricsWindow.setTouchBar(createTouchBarLyrics(lyricsWindow, lyricArray));
  }

  // Cache and send to settings window
  lastLoadedLyrics = lyricArray;
  if (lyricsSettingsWindow && !lyricsSettingsWindow.isDestroyed()) {
    lyricsSettingsWindow.webContents.send('loaded-lyrics', lyricArray);
  }

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

ipcMain.handle('getBackgroundVideos', async () => {
  const documentsPath = app.getPath('documents');
  const videosPath = `${documentsPath}/lyrics-slide-show/videos`;
  await fse.ensureDir(videosPath);
  const files = await fse.readdir(videosPath);
  return files;
});

ipcMain.handle('get-bible-verse', async (_event, { book, chapter, verse }) => {
  return bible.getVerse(book, chapter, verse);
});

app.on('window-all-closed', () => {
  app.quit();
});

process.on('uncaughtException', error => {
  console.error('Unhandled Exception in Main Process:', error);
  // Optionally, display an error dialog to the user
  // dialog.showErrorBox('Error', 'An unexpected error occurred. The application will now close.');
  app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in Main Process:', reason, promise);
  // Optionally, display an error dialog to the user
  // dialog.showErrorBox('Error', 'An unexpected error occurred. The application will now close.');
  app.quit();
});
