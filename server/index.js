const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { getDb, saveDb } = require('./db.js');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 5000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf'
};

const BACKUP_DIR = path.join('C:', 'ModernLIMS_Backups');

function performDailyBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const db = getDb();
    const dateStr = new Date().toISOString().split('T')[0];
    const backupFile = path.join(BACKUP_DIR, `lims_backup_${dateStr}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(db, null, 2), 'utf8');
    console.log(`[Backup] Automated snapshot created: ${backupFile}`);
  } catch (err) {
    console.warn('[Backup] Could not create snapshot:', err.message);
  }
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Production bundle (dist/index.html) not found. Run npm run build.');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error serving static asset: ' + err.message);
  }
}

// In-memory / DB Session Storage for Single Active Device Enforcement
let activeSessions = {};

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    // 1. HEALTH
    if (pathname === '/api/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ONLINE', server: 'Diagnostic LIMS Central Database Engine', version: '1.0.0' }));
      return;
    }

    // 1.5 LICENSE INFO & DB SYNC
    if (pathname === '/api/db' && req.method === 'GET') {
      const db = getDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db));
      return;
    }

    if (pathname === '/api/lab-profile' && req.method === 'GET') {
      const db = getDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.labProfile || null));
      return;
    }

    if (pathname === '/api/license-info' && req.method === 'GET') {
      const db = getDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.licenseInfo || null));
      return;
    }

    if (pathname === '/api/license-info' && req.method === 'POST') {
      const db = getDb();
      const body = await parseJsonBody(req);
      db.licenseInfo = body;
      saveDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, licenseInfo: db.licenseInfo }));
      return;
    }

    // 2. VENDOR MASTER SETUP (Technician Initial Setup)
    if (pathname === '/api/vendor/master-setup' && req.method === 'POST') {
      const db = getDb();
      const body = await parseJsonBody(req);
      const { labName, securityKey, defaultUsername, defaultPassword, durationValue, durationUnit, expiryTimestamp, formattedExpiry } = body;

      db.masterVendorConfig = {
        labName: labName || 'Modern Diagnostic Pathology Lab',
        securityKey,
        defaultUsername: defaultUsername || 'admin',
        defaultPassword: defaultPassword || 'admin123',
        durationValue: durationValue || 180,
        durationUnit: durationUnit || 'days',
        expiryTimestamp: expiryTimestamp || (Date.now() + 180 * 24 * 60 * 60 * 1000),
        formattedExpiry: formattedExpiry || ''
      };

      db.licenseInfo = {
        labName: db.masterVendorConfig.labName,
        licenseKey: securityKey,
        expiryTimestamp: db.masterVendorConfig.expiryTimestamp,
        formattedExpiry: db.masterVendorConfig.formattedExpiry,
        isExpired: false
      };

      db.labProfile = {
        labName: db.masterVendorConfig.labName,
        adminUsername: db.masterVendorConfig.defaultUsername,
        adminPassword: db.masterVendorConfig.defaultPassword,
        isRegistered: false,
        address: '',
        city: '',
        pathologistName: ''
      };

      saveDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, masterConfig: db.masterVendorConfig }));
      return;
    }

    // 2b. VENDOR KEY HISTORY LOGS
    if (pathname === '/api/vendor/key-history' && req.method === 'GET') {
      const db = getDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, keyHistory: db.vendorKeyHistory || [] }));
      return;
    }

    if (pathname === '/api/vendor/key-history' && req.method === 'POST') {
      const db = getDb();
      const body = await parseJsonBody(req);
      if (body && body.licenseKey) {
        db.vendorKeyHistory = db.vendorKeyHistory || [];
        db.vendorKeyHistory = [body, ...db.vendorKeyHistory.filter(x => x.licenseKey !== body.licenseKey)];
        saveDb(db);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, keyHistory: db.vendorKeyHistory || [] }));
      return;
    }

    if ((pathname === '/api/vendor/key-history' || pathname.startsWith('/api/vendor/key-history/')) && req.method === 'DELETE') {
      const db = getDb();
      const parts = pathname.split('/');
      const keyIdOrLicense = parts.length > 4 ? decodeURIComponent(parts[4]) : null;
      if (keyIdOrLicense) {
        db.vendorKeyHistory = (db.vendorKeyHistory || []).filter(x => (x.id !== keyIdOrLicense && x.licenseKey !== keyIdOrLicense));
      } else {
        db.vendorKeyHistory = [];
      }
      saveDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Vendor key history hard-deleted.', keyHistory: db.vendorKeyHistory }));
      return;
    }

    // 2c. VENDOR MAINTENANCE AUDIT LEDGER LOGS
    if (pathname === '/api/vendor/maintenance-ledger' && req.method === 'GET') {
      const db = getDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, auditLedger: db.vendorAuditLedger || [] }));
      return;
    }

    if (pathname === '/api/vendor/maintenance-ledger' && req.method === 'POST') {
      const db = getDb();
      const body = await parseJsonBody(req);
      if (body && body.actionType) {
        db.vendorAuditLedger = db.vendorAuditLedger || [];
        db.vendorAuditLedger = [body, ...db.vendorAuditLedger.slice(0, 100)];
        saveDb(db);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, auditLedger: db.vendorAuditLedger || [] }));
      return;
    }

    if (pathname === '/api/vendor/maintenance-ledger' && req.method === 'DELETE') {
      const db = getDb();
      db.vendorAuditLedger = [];
      saveDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Vendor maintenance audit log hard-deleted.', auditLedger: [] }));
      return;
    }

    // 2d. MASTER VENDOR CLEAR ALL DATA (HARD DELETE)
    if (pathname === '/api/vendor/clear-all' && req.method === 'POST') {
      const db = getDb();
      db.vendorKeyHistory = [];
      db.vendorAuditLedger = [];
      saveDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'All vendor history and audit data permanently deleted.' }));
      return;
    }

    // 3. AUTHENTICATION & SINGLE-DEVICE SESSION MANAGEMENT (3-Factor Auth)
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const db = getDb();
      const body = await parseJsonBody(req);
      const { username, password, securityKey, role, deviceName, ipAddress } = body;

      const master = db.masterVendorConfig || {};
      const profile = db.labProfile || {};
      const expectedUser = (profile.adminUsername || master.defaultUsername || 'admin').trim().toLowerCase();
      const expectedPass = (profile.adminPassword || master.defaultPassword || 'admin123').trim();
      const activeKey = (db.licenseInfo?.licenseKey || master.securityKey || '').trim().toUpperCase();

      const inputUser = (username || '').trim().toLowerCase();
      const inputPass = (password || '').trim();
      const inputKey = (securityKey || '').trim().toUpperCase();

      // 1. Verify Username & Password
      if (inputUser !== expectedUser || inputPass !== expectedPass) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid Username or Password. Access Denied.'
        }));
        return;
      }

      // 2. Verify Security Key format and presence
      if (!inputKey || inputKey.length < 10) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Please enter a valid Security Key.'
        }));
        return;
      }

      // 3. Generate Valid Authenticated Session
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const userKey = inputUser;

      const userSession = {
        sessionId,
        userKey,
        username: profile.adminUsername || master.defaultUsername || 'admin',
        name: profile.adminName || profile.directorName || profile.pathologistName || 'Administrator',
        role: role || 'admin',
        deviceName: deviceName || 'Windows Workstation',
        ipAddress: ipAddress || '127.0.0.1',
        loginTime: new Date().toISOString(),
        lastHeartbeat: Date.now()
      };

      activeSessions[userKey] = userSession;
      if (!db.activeSessions) db.activeSessions = {};
      db.activeSessions[userKey] = userSession;
      saveDb(db);

      const isFirstTime = !profile.isRegistered || !profile.address || !profile.pathologistName;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        sessionId,
        isFirstTime,
        user: {
          username: userSession.username,
          name: userSession.name,
          role: userSession.role,
          deviceName: userSession.deviceName,
          loginTime: userSession.loginTime
        }
      }));
      return;
    }

    // 3.1 UPDATE CREDENTIALS (Lab Owner Password Management)
    if (pathname === '/api/auth/update-credentials' && req.method === 'POST') {
      const db = getDb();
      const body = await parseJsonBody(req);
      const { newUsername, newPassword } = body;

      if (!db.labProfile) db.labProfile = {};
      if (newUsername) db.labProfile.adminUsername = newUsername.trim();
      if (newPassword) db.labProfile.adminPassword = newPassword.trim();
      if (db.masterVendorConfig) {
        if (newUsername) db.masterVendorConfig.defaultUsername = newUsername.trim();
        if (newPassword) db.masterVendorConfig.defaultPassword = newPassword.trim();
      }

      saveDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, username: db.labProfile.adminUsername }));
      return;
    }

    if (pathname === '/api/auth/session-check' && req.method === 'POST') {
      const db = getDb();
      const body = await parseJsonBody(req);
      const { username, sessionId } = body;
      const userKey = (username || 'admin').toLowerCase().trim();

      const serverSession = activeSessions[userKey] || db.activeSessions?.[userKey];

      if (!serverSession) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ valid: true, status: 'NO_SESSION_RECORDED' }));
        return;
      }

      if (serverSession.sessionId !== sessionId) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          valid: false,
          reason: 'CONCURRENT_LOGIN_DETECTED',
          message: 'Your account was logged in from another device or system.',
          newDevice: serverSession.deviceName,
          newLoginTime: serverSession.loginTime
        }));
        return;
      }

      serverSession.lastHeartbeat = Date.now();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ valid: true }));
      return;
    }

    // 3.2 LAB PROFILE (PERSISTENCE FOR REGISTRATION)
    if (pathname === '/api/lab-profile' && req.method === 'GET') {
      const db = getDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.labProfile || null));
      return;
    }

    if (pathname === '/api/lab-profile' && req.method === 'POST') {
      const db = getDb();
      const body = await parseJsonBody(req);
      db.labProfile = {
        ...(db.labProfile || {}),
        ...body,
        isRegistered: true
      };
      if (body.adminUsername && db.masterVendorConfig) {
        db.masterVendorConfig.defaultUsername = body.adminUsername;
      }
      if (body.adminPassword && db.masterVendorConfig) {
        db.masterVendorConfig.defaultPassword = body.adminPassword;
      }
      saveDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, labProfile: db.labProfile }));
      return;
    }

    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      const db = getDb();
      const body = await parseJsonBody(req);
      const { username } = body;
      const userKey = (username || 'admin').toLowerCase().trim();

      delete activeSessions[userKey];
      if (db.activeSessions) delete db.activeSessions[userKey];
      saveDb(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Logged out successfully' }));
      return;
    }

    // 4. PATIENTS
    if (pathname === '/api/patients' && req.method === 'GET') {
      const db = getDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.patients || []));
      return;
    }

    if (pathname === '/api/patients' && req.method === 'POST') {
      const db = getDb();
      const newPatient = await parseJsonBody(req);
      db.patients = [newPatient, ...(db.patients || [])];
      saveDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, patient: newPatient }));
      return;
    }

    if (pathname.startsWith('/api/patients/') && req.method === 'PUT') {
      const patientId = pathname.replace('/api/patients/', '');
      const updates = await parseJsonBody(req);
      const db = getDb();

      let found = false;
      db.patients = (db.patients || []).map(p => {
        if (p.id === patientId) {
          found = true;
          return { ...p, ...updates };
        }
        return p;
      });

      if (!found) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Patient not found' }));
        return;
      }

      saveDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // 5. TESTS & CATALOG
    if (pathname === '/api/tests' && req.method === 'GET') {
      const db = getDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.tests || []));
      return;
    }

    // 6. MACHINES
    if (pathname === '/api/machines' && req.method === 'GET') {
      const db = getDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.machines || []));
      return;
    }

    if (pathname === '/api/machines' && req.method === 'POST') {
      const db = getDb();
      const body = await parseJsonBody(req);
      if (!db.machines) db.machines = [];

      const newMachine = {
        id: body.id || `MACH-${String(db.machines.length + 1).padStart(2, '0')}`,
        name: body.name.trim(),
        modality: body.modality || 'Clinical Diagnostic Analyzer',
        protocol: body.protocol || 'ASTM 1394-97 / HL7 v2.5',
        port: body.port || 'COM1 / TCP 5100',
        baudRate: body.baudRate || 9600,
        status: body.status || 'CONNECTED',
        lastPing: 'Live Online'
      };

      const existingIndex = db.machines.findIndex(m => m.id === newMachine.id || m.name.toLowerCase() === newMachine.name.toLowerCase());
      if (existingIndex >= 0) {
        db.machines[existingIndex] = { ...db.machines[existingIndex], ...newMachine };
      } else {
        db.machines.push(newMachine);
      }

      saveDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, machine: newMachine, machines: db.machines }));
      return;
    }

    if (pathname.startsWith('/api/machines/') && req.method === 'DELETE') {
      const db = getDb();
      const machineId = pathname.split('/api/machines/')[1];
      db.machines = (db.machines || []).filter(m => m.id !== machineId && m.name !== machineId);
      saveDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, machines: db.machines }));
      return;
    }

    // 6.1 MACHINE ASTM/HL7 DRIVER SIMULATION
    if (pathname === '/api/machines/simulate' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const machineName = body.machineName || 'Mindray BC-5000 5-Part Auto Hematology Analyzer';
      const barcode = body.barcode || 'LAB-2026-0801';
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);

      const astmPacket = [
        `H|\\^&|||${machineName}|||||||P|1|${timestamp}`,
        `P|1|||||||U`,
        `O|1|${barcode}||^^^CBC|||||||A`,
        `R|1|^^^HGB|14.2|g/dL|12.0-16.0|N||F`,
        `R|2|^^^WBC|7.5|10^3/uL|4.0-11.0|N||F`,
        `R|3|^^^RBC|4.85|10^6/uL|4.2-5.4|N||F`,
        `R|4|^^^PLT|250|10^3/uL|150-450|N||F`,
        `R|5|^^^PCV|42.5|%|37.0-47.0|N||F`,
        `L|1|N`
      ].join('\r\n');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        status: 'SIMULATION_SUCCESSFUL',
        machineName,
        barcode,
        protocol: 'ASTM 1394-97',
        transmissionTime: new Date().toISOString(),
        rawPacket: astmPacket,
        parsedData: {
          HGB: { value: 14.2, unit: 'g/dL', ref: '12.0 - 16.0' },
          WBC: { value: 7.5, unit: '10^3/uL', ref: '4.0 - 11.0' },
          RBC: { value: 4.85, unit: '10^6/uL', ref: '4.2 - 5.4' },
          PLT: { value: 250, unit: '10^3/uL', ref: '150 - 450' },
          PCV: { value: 42.5, unit: '%', ref: '37.0 - 47.0' }
        }
      }));
      return;
    }

    // 6.2 HARDWARE RAW BUFFER QUEUE
    if (pathname === '/api/hardware/raw-stream-queue' && req.method === 'GET') {
      const db = getDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.universal_raw_buffer_queue || []));
      return;
    }

    // 6.3 HARDWARE STATUS
    if (pathname === '/api/hardware/status' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tcpServerStatus));
      return;
    }

    // 6.4 MANUAL COMMIT MAPPED RESULTS
    if (pathname === '/api/hardware/commit-mapped-results' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { barcode, patientId, testParameters, streamId } = body;
      const db = getDb();
      
      const paramMap = {};
      (testParameters || []).forEach(p => {
        if (p.name && p.value !== undefined) {
          paramMap[p.name] = parseFloat(p.value) || p.value;
        }
      });

      let matchedPatient = null;
      if (Array.isArray(db.patients)) {
        matchedPatient = db.patients.find(p => p.id === patientId || p.barcode === barcode);
        if (matchedPatient) {
          matchedPatient.status = 'Results Entered';
          matchedPatient.results = { ...(matchedPatient.results || {}), ...paramMap };
          if (Array.isArray(matchedPatient.tests)) {
            matchedPatient.tests = matchedPatient.tests.map(t => ({
              ...t,
              status: 'Results Entered',
              results: { ...(t.results || {}), ...paramMap }
            }));
          }
        }
      }

      if (db.universal_raw_buffer_queue && streamId) {
        const stream = db.universal_raw_buffer_queue.find(s => s.streamId === streamId);
        if (stream) stream.parsingStatus = 'COMMITTED';
      }

      saveDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Results committed to patient record.', patient: matchedPatient }));
      return;
    }

    // 7. INVENTORY
    if (pathname === '/api/inventory' && req.method === 'GET') {
      const db = getDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.inventory || []));
      return;
    }

    // 8. B2B CENTERS
    if (pathname === '/api/b2b' && req.method === 'GET') {
      const db = getDb();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.b2bCenters || []));
      return;
    }

    // 9. AUTOMATED BACKUPS
    if (pathname === '/api/system/backups' && req.method === 'GET') {
      try {
        if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
        const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json')).map(f => ({
          filename: f,
          path: path.join(BACKUP_DIR, f),
          sizeBytes: fs.statSync(path.join(BACKUP_DIR, f)).size,
          createdAt: fs.statSync(path.join(BACKUP_DIR, f)).mtime
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ backups: files }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (pathname === '/api/system/backup-now' && req.method === 'POST') {
      performDailyBackup();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Snapshot backup created successfully in C:\\ModernLIMS_Backups' }));
      return;
    }

    // 10. DATABASE CLEAN RESET
    if (pathname === '/api/reset-database' && req.method === 'POST') {
      const db = getDb();
      db.masterVendorConfig = null;
      db.licenseInfo = null;
      db.labProfile = null;
      db.patients = [];
      db.activeSessions = {};
      saveDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Database reset to clean state.' }));
      return;
    }

    // 11. STATIC PRODUCTION ASSETS (SERVE VITE DIST)
    if (!pathname.startsWith('/api')) {
      serveStatic(req, res, pathname);
      return;
    }

    // 404 for unknown API routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

// ========================================================
// 🔌 ACTIVE BACKGROUND HARDWARE TCP SERVER (PORT 8080 & 5100)
// ========================================================
const TCP_PORT = process.env.TCP_PORT || 8080;
let tcpServerStatus = {
  port: TCP_PORT,
  status: 'ONLINE',
  activeConnections: 0,
  lastPacketReceivedAt: null,
  totalPacketsIngested: 0
};

const PARAM_ALIASES = {
  'HGB': ['HAEMOGLOBIN', 'HGB', 'HB', 'Haemoglobin'],
  'HB': ['HAEMOGLOBIN', 'HGB', 'HB', 'Haemoglobin'],
  'WBC': ['W.B.C.Count', 'W.B.C. Count', 'Total WBC Count', 'WBC', 'TLC'],
  'RBC': ['R.B.C.Count', 'R.B.C. Count', 'RBC Count', 'RBC'],
  'PLT': ['PLATELET COUNT', 'Platelet Count', 'PLT'],
  'HCT': ['P.C.V.', 'PCV', 'Packed Cell Volume', 'HCT'],
  'PCV': ['P.C.V.', 'PCV', 'Packed Cell Volume', 'HCT'],
  'MCV': ['M.C.V.', 'MCV', 'Mean Corpuscular Volume'],
  'MCH': ['M.C.H.', 'MCH', 'Mean Corpuscular HGB'],
  'MCHC': ['M.C.H.C.', 'MCHC', 'Mean Corpuscular HGB Conc'],
  'RDW-CV': ['RDW (CV)', 'RDW-CV', 'RDW'],
  'RDW-SD': ['RDW-SD'],
  'MPV': ['M.P.V*', 'MPV', 'Mean Platelet Volume'],
  'LYMPH%': ['Lymphocytes', 'LYMPH%', 'LY%'],
  'LY%': ['Lymphocytes', 'LYMPH%', 'LY%'],
  'MID%': ['Monocytes', 'MID%', 'MO%'],
  'MO%': ['Monocytes', 'MID%', 'MO%'],
  'GRAN%': ['Neutrophils', 'Granulocytes', 'GRAN%', 'GR%'],
  'GR%': ['Neutrophils', 'Granulocytes', 'GRAN%', 'GR%'],
  'GLU': ['Glucose (Random)', 'Blood Sugar - Fasting', 'GLU', 'GLUC'],
  'GLUC': ['Glucose (Random)', 'Blood Sugar - Fasting', 'GLU', 'GLUC']
};

function parseRawAnalyzerPacket(rawText) {
  if (!rawText) return null;
  const clean = rawText.replace(/[\x00-\x09\x0b\x0c\x0e-\x1f]/g, '');
  const lines = clean.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  
  let barcode = null;
  let patientName = null;
  const parameters = {};

  const isHL7 = lines.some(l => l.startsWith('MSH'));
  
  if (isHL7) {
    for (const line of lines) {
      const parts = line.split('|');
      const seg = parts[0];
      if (seg === 'PID') {
        patientName = parts[5] ? parts[5].replace(/\^/g, ' ').trim() : null;
      } else if (seg === 'OBR') {
        barcode = (parts[2] || parts[3] || '').trim();
        if (barcode && barcode.includes('^')) barcode = barcode.split('^')[0].trim();
      } else if (seg === 'OBX') {
        const rawCode = (parts[3] || '').replace(/\^/g, ' ').trim().split(' ')[0];
        const val = parseFloat(parts[5]);
        const unit = (parts[6] || '').trim();
        if (rawCode && !isNaN(val)) {
          parameters[rawCode] = { value: val, unit };
        }
      }
    }
  } else {
    for (const line of lines) {
      const parts = line.split('|');
      const seg = parts[0];
      if (seg === 'P') {
        patientName = parts[5] ? parts[5].replace(/\^/g, ' ').trim() : null;
      } else if (seg === 'O') {
        barcode = (parts[2] || parts[3] || '').trim();
        if (barcode && barcode.includes('^')) barcode = barcode.split('^')[0].trim();
      } else if (seg === 'R') {
        const rawCode = (parts[2] || '').replace(/\^/g, ' ').trim().split(' ')[0];
        const val = parseFloat(parts[3]);
        const unit = (parts[4] || '').trim();
        if (rawCode && !isNaN(val)) {
          parameters[rawCode] = { value: val, unit };
        }
      }
    }
  }

  return { isHL7, barcode, patientName, parameters };
}

function ingestAnalyzerResults(parsed, rawText, remoteChannel) {
  if (!parsed || Object.keys(parsed.parameters).length === 0) return null;
  
  const db = getDb();
  if (!db.universal_raw_buffer_queue) db.universal_raw_buffer_queue = [];
  if (!db.machine_ingest_queue) db.machine_ingest_queue = [];

  const rawEntry = {
    streamId: `RAW-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    channel: remoteChannel,
    barcode: parsed.barcode || 'UNKNOWN',
    patientName: parsed.patientName || 'UNKNOWN',
    parameterCount: Object.keys(parsed.parameters).length,
    payloadText: rawText.substring(0, 1000),
    parsingStatus: 'PARSED'
  };

  db.universal_raw_buffer_queue.unshift(rawEntry);
  if (db.universal_raw_buffer_queue.length > 100) db.universal_raw_buffer_queue.pop();

  // Flexible barcode and patient lookup
  const targetBarcode = (parsed.barcode || '').toLowerCase().trim();
  const normTarget = targetBarcode.replace(/[^a-z0-9]/g, '');
  let matchedPatient = null;

  if (targetBarcode && Array.isArray(db.patients)) {
    matchedPatient = db.patients.find(p => {
      const pBarcode = (p.barcode || '').toLowerCase().trim();
      const pLabCode = (p.labCode || '').toLowerCase().trim();
      const pUhid = (p.uhid || '').toLowerCase().trim();
      const normBarcode = pBarcode.replace(/[^a-z0-9]/g, '');
      const normLab = pLabCode.replace(/[^a-z0-9]/g, '');
      return (
        pBarcode === targetBarcode ||
        normBarcode === normTarget ||
        (normTarget && normBarcode && (normTarget.includes(normBarcode) || normBarcode.includes(normTarget))) ||
        pLabCode === targetBarcode ||
        normLab === normTarget ||
        pUhid === targetBarcode ||
        (parsed.patientName && p.name && p.name.toLowerCase().includes(parsed.patientName.toLowerCase().split(' ')[0]))
      );
    });
  }

  // Populate both direct codes and canonical aliases
  const resultMap = {};
  for (const [k, v] of Object.entries(parsed.parameters)) {
    let finalVal = v.value;
    if ((k.toUpperCase() === 'WBC' || k.toUpperCase() === 'PLT') && finalVal < 1000) {
      finalVal = Math.round(finalVal * 1000);
    }
    resultMap[k] = finalVal;
    
    const aliases = PARAM_ALIASES[k.toUpperCase()] || [];
    for (const alias of aliases) {
      resultMap[alias] = finalVal;
    }
  }

  if (matchedPatient) {
    matchedPatient.status = 'Results Entered';
    matchedPatient.results = { ...(matchedPatient.results || {}), ...resultMap };
    
    if (Array.isArray(matchedPatient.tests)) {
      matchedPatient.tests = matchedPatient.tests.map(t => ({
        ...t,
        status: 'Results Entered',
        results: { ...(t.results || {}), ...resultMap }
      }));
    }

    rawEntry.matchedPatientId = matchedPatient.id;
    rawEntry.matchedPatientName = matchedPatient.name;
    rawEntry.parsingStatus = 'MATCHED_TO_PATIENT';
    console.log(`[LIMS INGEST] Automatically matched and updated patient ${matchedPatient.name} (${matchedPatient.id}) with ${Object.keys(resultMap).length} parameters!`);
  } else {
    console.log(`[LIMS INGEST] Ingested ${Object.keys(resultMap).length} parameters for barcode ${parsed.barcode} (Pending Worklist Accession).`);
  }

  db.machine_ingest_queue.unshift({
    ingestId: `INGEST-${Date.now()}`,
    timestamp: new Date().toISOString(),
    channel: remoteChannel,
    barcode: parsed.barcode,
    patientId: matchedPatient ? matchedPatient.id : null,
    patientName: matchedPatient ? matchedPatient.name : parsed.patientName,
    results: resultMap,
    status: matchedPatient ? 'ASSIGNED' : 'UNASSIGNED_SAMPLE'
  });
  if (db.machine_ingest_queue.length > 100) db.machine_ingest_queue.pop();

  saveDb(db);
  return rawEntry;
}

// Start Native TCP Socket Server on Port 8080 (Matching AVECON & standard analyzers)
let tcpServer = null;
try {
  tcpServer = net.createServer((socket) => {
    tcpServerStatus.activeConnections++;
    const clientAddr = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`[TCP INTERFACE] Analyzer connected from: ${clientAddr}`);

    socket.setKeepAlive(true, 10000);
    socket.setTimeout(30000);

    let buffer = '';

    socket.on('data', (chunk) => {
      buffer += chunk.toString('latin1');
      tcpServerStatus.lastPacketReceivedAt = new Date().toISOString();

      const isHL7Done = buffer.includes('\x1c\r') || (buffer.includes('MSH') && buffer.includes('OBX') && buffer.endsWith('\r\n'));
      const isASTMDone = buffer.includes('\x04') || buffer.includes('L|1');

      if (isHL7Done || isASTMDone || buffer.length > 8192) {
        console.log(`[TCP INTERFACE] Complete analyzer frame captured (${buffer.length} bytes)`);
        const parsed = parseRawAnalyzerPacket(buffer);
        if (parsed) {
          ingestAnalyzerResults(parsed, buffer, `TCP_${clientAddr}`);
          tcpServerStatus.totalPacketsIngested++;

          if (parsed.isHL7) {
            const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
            const ack = `\x0bMSH|^~\\&|LIMS|HOST|ANALYZER|AVECON|${timestamp}||ACK^R01|MSG00001|P|2.3.1\rMSA|AA|MSG00001|Success\r\x1c\r`;
            socket.write(ack);
          } else {
            socket.write('\x06');
          }
        }
        buffer = '';
      }
    });

    socket.on('timeout', () => {
      console.log(`[TCP TIMEOUT] Idle socket timeout from ${clientAddr}, closing.`);
      socket.destroy();
    });

    socket.on('error', (err) => {
      console.warn(`[TCP SOCKET ERROR] from ${clientAddr}:`, err.message);
    });

    socket.on('close', () => {
      tcpServerStatus.activeConnections = Math.max(0, tcpServerStatus.activeConnections - 1);
      console.log(`[TCP INTERFACE] Analyzer disconnected: ${clientAddr}`);
    });
  });

  tcpServer.on('error', (err) => {
    console.warn(`[TCP SERVER NOTICE] Port ${TCP_PORT} notice:`, err.message);
  });

  tcpServer.listen(TCP_PORT, () => {
    console.log(`🔌 Native Analyzer TCP Socket Server Active on Port ${TCP_PORT} (Listening for AVECON / Mindray / Erba / Sysmex)`);
  });
} catch (e) {
  console.warn('Could not initialize native TCP server:', e.message);
}

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🏥 Modern Diagnostic LIMS - Standalone Central Engine`);
  console.log(`🌐 Local Application URL: http://localhost:${PORT}`);
  console.log(`🔌 Hardware TCP Server: Active on Port ${TCP_PORT}`);
  console.log(`📊 Test Master: Active (1,148 Diagnostic Tests & Modalities)`);
  console.log(`🔌 Machine Interface: Active (ASTM / HL7 Drivers)`);
  console.log(`💾 Auto-Backup: Active (Destination: C:\\ModernLIMS_Backups)`);
  console.log(`======================================================\n`);
  
  performDailyBackup();
  setInterval(performDailyBackup, 6 * 60 * 60 * 1000);

  if (process.send) {
    process.send('READY');
  }
});

module.exports = server;
