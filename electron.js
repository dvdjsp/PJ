// public/electron.js
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

// Function to start Python backend
function startPythonBackend() {
  const backendPath = isDev
    ? path.join(__dirname, '../backend')
    : path.join(process.resourcesPath, 'backend');
  
  const scriptPath = path.join(backendPath, 'app.py');
  
  console.log('Starting Python backend from:', scriptPath);
  
  // Start Python process
  pythonProcess = spawn('python3', [scriptPath], {
    cwd: backendPath,
    env: { ...process.env, PORT: '5000' }
  });
  
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });
  
  pythonProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js') // Add preload script
    },
  });

  // Load the app
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  // Create and set the application menu
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Magnetization Calculator',
          click: () => {
            mainWindow.webContents.send('switch-component', 'magnetization');
          }
        },
        {
          label: 'Arbitrary Lattice',
          click: () => {
            mainWindow.webContents.send('switch-component', 'arbitrary');
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: async () => {
            require('electron').dialog.showMessageBox({
              title: 'About Ising Model Calculator',
              message: 'Ising Model Calculator v1.0.0',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Open DevTools if in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  // Start Python backend first
  startPythonBackend();
  
  // Wait a bit for backend to start, then create window
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', () => {
  // Kill Python process when closing
  if (pythonProcess) {
    pythonProcess.kill();
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
  // Kill Python process on quit
  if (pythonProcess) {
    pythonProcess.kill();
  }
});