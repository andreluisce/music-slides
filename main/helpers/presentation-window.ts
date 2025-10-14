import { BrowserWindow, screen } from 'electron';
import path from 'path';

let presentationWindow: BrowserWindow | null = null;

export const createPresentationWindow = () => {
  // Get all displays
  const displays = screen.getAllDisplays();

  // Try to use secondary display, fallback to primary
  const externalDisplay = displays.find(display => display.bounds.x !== 0 || display.bounds.y !== 0);
  const targetDisplay = externalDisplay || screen.getPrimaryDisplay();

  const { x, y, width, height } = targetDisplay.bounds;

  presentationWindow = new BrowserWindow({
    x: x,
    y: y,
    width: width,
    height: height,
    fullscreen: true,
    frame: false,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Allow loading local resources
    },
  });

  // Open DevTools if enabled
  if (process.env.OPEN_DEVTOOLS === 'true') {
    presentationWindow.webContents.once('did-finish-load', () => {
      presentationWindow?.webContents.openDevTools();
    });
  }

  presentationWindow.on('closed', () => {
    presentationWindow = null;
  });

  return presentationWindow;
};

export const getPresentationWindow = () => {
  return presentationWindow;
};

export const closePresentationWindow = () => {
  if (presentationWindow) {
    presentationWindow.close();
    presentationWindow = null;
  }
};

export const sendToPresentationWindow = (channel: string, data: any) => {
  if (presentationWindow && !presentationWindow.isDestroyed()) {
    presentationWindow.webContents.send(channel, data);
  }
};
