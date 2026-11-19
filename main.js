// ========================================================
// main.js - Modern Diagnostic LIMS Native Desktop Engine
// Multi-PC Networking: Server Mode vs Client Mode
// Silent 50x25mm Thermal Barcode Printing via Electron IPC
// ========================================================

const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { fork } = require("child_process");

let mainWindow = null;
let backendProcess = null;

// 🔒 Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Read Multi-PC Network Configuration
function readNetworkConfig() {
  const appData = process.env.APPDATA || (
    process.platform === 'darwin'
      ? path.join(process.env.HOME || '', 'Library', 'Preferences')
      : path.join(process.env.HOME || '', '.config')
  );
  const configPath = path.join(appData, 'ModernDiagnosticLIMS', 'network_config.json');
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (_) {}
  return { mode: 'server', hostIp: '127.0.0.1', port: 5000 };
}

// 🚀 START BACKEND (SERVER MODE ONLY)
function startBackend() {
  return new Promise((resolve) => {
    let serverPath = path.join(process.resourcesPath, "app", "server", "index.js");
    if (!fs.existsSync(serverPath)) {
      serverPath = path.join(process.resourcesPath, "server", "index.js");
    }
    if (!fs.existsSync(serverPath)) {
      serverPath = path.join(__dirname, "server", "index.js");
    }

    console.log("🚀 Starting central diagnostic backend engine...");
    console.log("📄 Server path:", serverPath);

    if (fs.existsSync(serverPath)) {
      try {
        backendProcess = fork(serverPath, [], {
          cwd: path.dirname(serverPath),
          env: { ...process.env, PORT: "5000" }
        });
      } catch (err) {
        console.warn("Could not fork backend process:", err);
      }
    }

    resolve();
  });
}

// ⏳ Wait for Node.js Server Readiness (Local or Remote LAN Host)
function waitForServer(host = '127.0.0.1', port = 5000, maxRetries = 30) {
  return new Promise((resolve) => {
    let retries = 0;
    const check = () => {
      const req = http.get(`http://${host}:${port}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else if (retries < maxRetries) {
          retries++;
          setTimeout(check, 150);
        } else {
          resolve(false);
        }
      });
      req.on("error", () => {
        if (retries < maxRetries) {
          retries++;
          setTimeout(check, 150);
        } else {
          resolve(false);
        }
      });
      req.end();
    };
    check();
  });
}

// 🖥️ Create Native Application Window
function createWindow(targetUrl) {
  if (mainWindow) return;

  Menu.setApplicationMenu(null); // Clean native look

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Modern Diagnostic LIMS - Laboratory Information Management System",
    backgroundColor: "#0f172a",
    icon: fs.existsSync(path.join(__dirname, "build", "icon.ico"))
      ? path.join(__dirname, "build", "icon.ico")
      : path.join(__dirname, "public", "icon.ico"),
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false
    }
  });

  let indexPath = path.join(process.resourcesPath, "app", "dist", "index.html");
  if (!fs.existsSync(indexPath)) {
    indexPath = path.join(process.resourcesPath, "dist", "index.html");
  }
  if (!fs.existsSync(indexPath)) {
    indexPath = path.join(__dirname, "dist", "index.html");
  }

  console.log("📂 Connecting application UI to:", targetUrl);

  mainWindow.loadURL(targetUrl).catch(() => {
    console.warn("Could not connect to server URL, falling back to local bundle:", indexPath);
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.maximize();
      mainWindow.show();
    }
  }, 500);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ========================================================
// 🖨️ SILENT THERMAL BARCODE PRINTING IPC HANDLERS
// ========================================================
ipcMain.handle('lims:get-printers', async () => {
  if (!mainWindow) return [];
  try {
    return await mainWindow.webContents.getPrintersAsync();
  } catch (err) {
    console.warn('Could not list printers:', err.message);
    return [];
  }
});

ipcMain.handle('lims:print-silent', async (event, payload = {}) => {
  const content = payload.htmlContent || payload.html || '';
  const printerName = payload.printerName;
  const pageSize = payload.pageSize || { width: 50000, height: 25000 };

  return new Promise((resolve) => {
    try {
      const printWin = new BrowserWindow({
        show: false,
        width: 300,
        height: 200,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
      });

      printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`);

      printWin.webContents.on('did-finish-load', () => {
        printWin.webContents.print({
          silent: true,
          printBackground: true,
          deviceName: printerName || undefined,
          margins: { marginType: 'none' },
          pageSize // 50mm x 25mm thermal sticker (50000 x 25000 microns)
        }, (success, failureReason) => {
          printWin.close();
          resolve({ success, error: failureReason });
        });
      });
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
});

// ========================================================
// 🔄 AUTO-UPDATER SETUP (ELECTRON-UPDATER & GITHUB RELEASES)
// ========================================================
let autoUpdaterModule = null;
try {
  const { autoUpdater } = require("electron-updater");
  autoUpdaterModule = autoUpdater;
  autoUpdaterModule.autoDownload = false;
  autoUpdaterModule.autoInstallOnAppQuit = true;

  autoUpdaterModule.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('lims:update-available', info);
    }
  });

  autoUpdaterModule.on('update-downloaded', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('lims:update-downloaded', info);
    }
  });
} catch (_) {}

ipcMain.handle('lims:check-updates', async () => {
  if (autoUpdaterModule && app.isPackaged) {
    try {
      const result = await autoUpdaterModule.checkForUpdates();
      return { success: true, updateInfo: result?.updateInfo };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: true, message: 'Development environment: Update check skipped.' };
});

ipcMain.handle('lims:download-update', async () => {
  if (autoUpdaterModule && app.isPackaged) {
    try {
      await autoUpdaterModule.downloadUpdate();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Cannot download updates in unpackaged mode.' };
});

ipcMain.handle('lims:install-update', () => {
  if (autoUpdaterModule) {
    autoUpdaterModule.quitAndInstall();
  }
});

// 🚀 App Ready LifeCycle
app.whenReady().then(async () => {
  const netConfig = readNetworkConfig();
  console.log(`📡 Multi-PC Mode: ${netConfig.mode.toUpperCase()}`);

  let targetUrl = `http://localhost:${netConfig.port || 5000}`;

  if (netConfig.mode === 'client') {
    // Client PC Mode: Connect to central Host PC
    const host = netConfig.hostIp || '127.0.0.1';
    const port = netConfig.port || 5000;
    targetUrl = `http://${host}:${port}`;
    console.log(`📡 Client Mode connecting to Server PC at: ${targetUrl}`);
    await waitForServer(host, port, 15);
  } else {
    // Server PC Mode: Launch local backend engine
    try {
      await startBackend();
      await waitForServer('127.0.0.1', 5000, 30);
    } catch (err) {
      console.log("Backend start notice:", err);
    }
  }

  createWindow(targetUrl);
});

// ❌ Process Cleanup
app.on("window-all-closed", () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {}
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});
