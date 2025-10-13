import { app, Menu, shell, BrowserWindow } from 'electron';

let preferencesWindow: BrowserWindow | null = null;

export function createPreferencesWindow() {
  if (preferencesWindow) {
    preferencesWindow.focus();
    return;
  }

  preferencesWindow = new BrowserWindow({
    width: 600,
    height: 500,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'Preferências',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: require('path').join(__dirname, 'preload.js'),
    },
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    preferencesWindow.loadURL('app://./preferences.html');
  } else {
    preferencesWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/preferences.html`);
  }

  preferencesWindow.on('closed', () => {
    preferencesWindow = null;
  });

  // Remove menu bar from preferences window
  preferencesWindow.setMenuBarVisibility(false);
}

export function createApplicationMenu() {
  const isMac = process.platform === 'darwin';

  const template: any[] = [
    // App Menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about', label: 'Sobre Lyrics Show' },
              { type: 'separator' },
              {
                label: 'Preferências...',
                accelerator: 'Cmd+,',
                click: () => createPreferencesWindow(),
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide', label: 'Ocultar Lyrics Show' },
              { role: 'hideOthers', label: 'Ocultar Outros' },
              { role: 'unhide', label: 'Mostrar Tudo' },
              { type: 'separator' },
              { role: 'quit', label: 'Sair do Lyrics Show' },
            ],
          },
        ]
      : []),
    // File Menu
    {
      label: 'Arquivo',
      submenu: [
        isMac ? { role: 'close', label: 'Fechar Janela' } : { role: 'quit', label: 'Sair' },
      ],
    },
    // Edit Menu
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle', label: 'Colar e Combinar Estilo' },
              { role: 'delete', label: 'Excluir' },
              { role: 'selectAll', label: 'Selecionar Tudo' },
            ]
          : [
              { role: 'delete', label: 'Excluir' },
              { type: 'separator' },
              { role: 'selectAll', label: 'Selecionar Tudo' },
            ]),
      ],
    },
    // View Menu
    {
      label: 'Visualizar',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'forceReload', label: 'Forçar Recarregar' },
        { role: 'toggleDevTools', label: 'Ferramentas do Desenvolvedor' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Real' },
        { role: 'zoomIn', label: 'Ampliar' },
        { role: 'zoomOut', label: 'Reduzir' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia' },
      ],
    },
    // Window Menu
    {
      label: 'Janela',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'zoom', label: 'Zoom' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front', label: 'Trazer Todas para Frente' },
              { type: 'separator' },
              { role: 'window', label: 'Janela' },
            ]
          : [{ role: 'close', label: 'Fechar' }]),
      ],
    },
    // Help Menu
    {
      role: 'help',
      label: 'Ajuda',
      submenu: [
        {
          label: 'Aprender Mais',
          click: async () => {
            await shell.openExternal('https://github.com');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
