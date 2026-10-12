// ========================================================
// main.js - Modern Diagnostic LIMS Native Desktop Engine
// ========================================================

const { app, BrowserWindow, Menu } = require("electron");
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

// 🚀 START BACKEND (USING FORK)
function startBackend() {
  return new Promise((resolve) => {
    let serverPath = path.join(process.resourcesPath, "app", "server", "index.js");
    if (!fs.existsSync(serverPath)) {
      serverPath = path.join(process.resourcesPath, "server", "index.js");
    }
    if (!fs.existsSync(serverPath)) {
      serverPath = path.join(__dirname, "server", "index.js");
    }

    console.log("🚀 Starting diagnostic backend engine...");
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

// ⏳ Wait for Local Node.js Express Server Readiness
function waitForServer(port = 5000, maxRetries = 30) {
  return new Promise((resolve) => {
    let retries = 0;
    const check = () => {
      const req = http.get(`http://localhost:${port}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else if (retries < maxRetries) {
          retries++;
          setTimeout(check, 100);
        } else {
          resolve(false);
        }
      });
      req.on("error", () => {
        if (retries < maxRetries) {
          retries++;
          setTimeout(check, 100);
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
function createWindow() {
  if (mainWindow) return;

  Menu.setApplicationMenu(null); // Remove default browser menu for clean native look

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Modern Diagnostic LIMS - Laboratory Information Management System",
    backgroundColor: "#0f172a",
    icon: fs.existsSync(path.join(__dirname, "build", "icon.ico")) ? path.join(__dirname, "build", "icon.ico") : path.join(__dirname, "public", "icon.ico"),
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
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

  console.log("📂 Loading native UI bundle from:", indexPath);

  // Load from local express server first (100% API integration), fallback to static HTML file
  mainWindow.loadURL("http://localhost:5000").catch(() => {
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Guarantee window display after 500ms
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

// 🚀 App Ready
app.whenReady().then(async () => {
  try {
    await startBackend();
    await waitForServer(5000, 30); // Wait up to 3 seconds for backend readiness
  } catch (err) {
    console.log("Backend start notice:", err);
  }

  createWindow();
});

// ❌ Proper Process Cleanup
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
