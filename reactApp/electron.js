const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

// Path to the backend entry point
const isDev = !app.isPackaged;
const backendPath = isDev
  ? path.join(__dirname, '..', 'nodeApp', 'index.js')
  : path.join(process.resourcesPath, 'nodeApp', 'index.js');
let backendProcess;

function startBackend() {
  if (backendProcess) return;
  
  console.log('Starting backend server...');
  backendProcess = fork(backendPath, [], {
    cwd: path.dirname(backendPath),
    env: { ...process.env, PORT: 8889 }
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });
}

let mainWindow;

function createWindow() {
  startBackend();
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In development, load from the React dev server; in production, load the built files
  const startUrl =
    process.env.ELECTRON_START_URL ||
    `file://${path.join(__dirname, 'build', 'index.html')}`;

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
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