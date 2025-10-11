import { BrowserWindow } from 'electron';
import { createWindow } from './create-window';

let quickScreenWindow: BrowserWindow;

export const createQuickScreen = () => {
  quickScreenWindow = createWindow('quick-screen', {
    width: 400,
    height: 600,
    show: false,
  });

  const port = process.argv[2];
  quickScreenWindow.loadURL(`http://localhost:${port}/quick-screen`);

  return quickScreenWindow;
};

export const showQuickScreen = () => {
  if (quickScreenWindow) {
    quickScreenWindow.show();
  }
};

export const hideQuickScreen = () => {
  if (quickScreenWindow) {
    quickScreenWindow.hide();
  }
};
