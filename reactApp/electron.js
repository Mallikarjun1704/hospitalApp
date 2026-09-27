const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');

const isDev = !app.isPackaged;
const isClientOnly = process.env.STANDALONE_FRONTEND === 'true' || 
                     process.env.APP_MODE === 'client' || 
                     process.argv.includes('--client-only');

// Path to the backend entry point
const backendPath = isDev
  ? path.join(__dirname, '..', 'nodeApp', 'index.js')
  : path.join(process.resourcesPath, 'nodeApp', 'index.js');

let backendProcess = null;

function startBackend() {
  if (isClientOnly || isDev) {
    console.log('[ELECTRON] Dev / Client Mode: Skipping background fork (backend is managed externally or already running).');
    return;
  }

  if (backendProcess) return;

  if (!fs.existsSync(backendPath)) {
    console.warn(`[ELECTRON] Backend entry point not found at ${backendPath}. Proceeding in client-only mode.`);
    return;
  }

  console.log('[ELECTRON] Starting local backend server...');
  backendProcess = fork(backendPath, [], {
    cwd: path.dirname(backendPath),
    env: { ...process.env, PORT: process.env.PORT || '8889' }
  });

  backendProcess.on('error', (err) => {
    console.error('[ELECTRON] Backend process error:', err);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`[ELECTRON] Backend process exited with code ${code} (${signal})`);
    backendProcess = null;
  });
}

let mainWindow;

function createWindow() {
  startBackend();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 650,
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: true // Show window immediately so user sees the app launching
  });

  mainWindow.show();
  mainWindow.focus();

  // In development, load from React dev server; in production, load built bundle
  const startUrl = process.env.ELECTRON_START_URL || (isDev ? 'http://localhost:3000' : null);

  if (startUrl) {
    const loadAppUrl = () => {
      mainWindow.loadURL(startUrl).then(() => {
        mainWindow.show();
      }).catch((err) => {
        console.log('[ELECTRON] Dev server not ready yet, retrying in 500ms...');
        setTimeout(loadAppUrl, 500);
      });
    };
    loadAppUrl();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
  }

  // Open DevTools in development if explicitly requested
  if (process.env.ELECTRON_DEVTOOLS === 'true') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (backendProcess) {
    console.log('[ELECTRON] Shutting down backend process...');
    backendProcess.kill();
    backendProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});