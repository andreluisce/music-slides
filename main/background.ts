import { app, BrowserWindow, ipcMain, screen } from 'electron';
import serve from 'electron-serve';
import { createWindow, vagalume } from './helpers';
import sanitize from 'sanitize-filename';
import fse from 'fs-extra';
import createTouchBarLyrics from './helpers/create-touchbar-items';
import { SearchType } from '../renderer/shared/types';

let lyricsWindow: BrowserWindow;
let lyricsSettingsWindow: BrowserWindow;
let mainWindow: BrowserWindow;

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
}

ipcMain.handle('openLyricsWindow', (event, url, filePath, isDefault = false) => {
  openLyricsWindow(url, filePath, isDefault);
});

ipcMain.handle('getPath', (event, path: Parameters<typeof app.getPath>[0]) => {
  return app.getPath(path);
});

ipcMain.handle('getAllLocalSongs', async () => {
  const documentsPath = app.getPath('documents');

  const pathExists = fse.existsSync(`${documentsPath}/lyrics-slide-show/songs`);

  if (pathExists) {
    const files = fse.readdirSync(`${documentsPath}/lyrics-slide-show/songs`);

    return files
      .map(item => (item.includes('.txt') ? item : undefined))
      .filter(Boolean)
      .sort();
  }
});

ipcMain.handle('getDefaultSlides', async () => {
  const documentsPath = app.getPath('documents');

  const pathExists = fse.existsSync(`${documentsPath}/lyrics-slide-show/default-slides`);

  if (pathExists) {
    const files = fse.readdirSync(`${documentsPath}/lyrics-slide-show/default-slides`);

    return files.map(item => (item.includes('.txt') ? item : undefined)).filter(Boolean);
  }
});

ipcMain.handle('findLyrics', async (_event, searchType, artist, title) => {
  switch (searchType) {
    case SearchType.ByAnyParameter:
      return vagalume.findByAnyParameter(`${artist} ${title}`);
    case SearchType.ByTitleAndArtist:
      return vagalume.searchByTitleAndArtist({ artist, title });
    case SearchType.ByTitleAndArtistExact:
      vagalume.searchByTitleAndArtistExact({ artist, title });
      break;
  }
});

ipcMain.handle('getLyricByUrlHandle', async (event, arg) => {
  const regex = /^\/(.+?)\/(.+?)\.html$/;

  const [, artist, title] = arg.match(regex);

  const response = await vagalume.searchByTitleAndArtistExact({ artist, title });

  const lyricArray: Array<string> = response.lyrics
    .replaceAll('/', '\n')
    .replace('\\', '\n')
    .split('\n')
    .map(text => text.trim())
    .filter(Boolean)
    .shift('\n\n');

  const documentsPath = app.getPath('documents');
  const filename = sanitize(`${artist} - ${title}.txt`);

  const fileFullPath = `${documentsPath}/lyrics-slide-show/songs/${filename}`;

  const pathExists = fse.existsSync(fileFullPath);

  if (!pathExists) {
    fse.outputFile(fileFullPath, lyricArray.join('\n'));
  }

  lyricsWindow.setTouchBar(createTouchBarLyrics(lyricArray));

  lyricsWindow.focus();

  setTimeout(() => {
    const win = BrowserWindow.getAllWindows();

    win[0].webContents.send('loaded-lyrics', lyricArray);
  }, 1000);

  return lyricArray;
});

ipcMain.handle('getLyricByFilePath', async (event, filePath, isDefault = false) => {
  const documentsPath = app.getPath('documents');

  const lyric = fse.readFileSync(
    `${documentsPath}/lyrics-slide-show/${isDefault ? 'default-slides' : 'songs'}/${filePath}`,
    {
      encoding: 'utf8',
    }
  );

  const lyricArray = lyric.split('\n');

  lyricsWindow.setTouchBar(createTouchBarLyrics(lyricArray));

  setTimeout(() => {
    const win = BrowserWindow.getAllWindows();

    win[0].webContents.send('loaded-lyrics', lyricArray);
  }, 1000);

  return lyricArray;
});

// Listen for the 'focus-target-window' message from the renderer process
ipcMain.on('focus-target-window', (event, targetWindowId) => {
  // Get the BrowserWindow instance of the target window by its ID
  const targetWindow = BrowserWindow.fromId(targetWindowId);

  // Focus the target window
  if (targetWindow) {
    targetWindow.focus();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
