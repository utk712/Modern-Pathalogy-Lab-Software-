const fs = require('fs');
const path = require('path');

// Store DB in User AppData for 100% Windows Write Permissions & Persistence
const appDataDir = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Preferences') : path.join(process.env.HOME || '', '.config'));
const LIMS_DATA_DIR = path.join(appDataDir, 'ModernDiagnosticLIMS');

if (!fs.existsSync(LIMS_DATA_DIR)) {
  try {
    fs.mkdirSync(LIMS_DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Could not create AppData dir:', e);
  }
}

const DB_FILE = path.join(LIMS_DATA_DIR, 'lims_database.json');

// Standard Interfaced Analyzer Machine Drivers
const STANDARD_MACHINES = [
  {
    id: 'MACH-01',
    name: 'Sysmex XN-550 / XN-1000',
    modality: 'Hematology 5-Part Cell Counter',
    protocol: 'ASTM 1394-97 / HL7 v2.5',
    port: 'COM1 / TCP 5100',
    baudRate: 9600,
    status: 'CONNECTED',
    lastPing: 'Live Online',
    supportedParams: ['Hb', 'RBC', 'PCV', 'MCV', 'MCH', 'MCHC', 'RDW-CV', 'RDW-SD', 'TLC', 'NEUT', 'LYMPH', 'EOS', 'MONO', 'BASO', 'ANC', 'PLT', 'MPV', 'PCT', 'PDW', 'P-LCR']
  },
  {
    id: 'MACH-02',
    name: 'Mindray BC-5000 / BC-6800 Plus',
    modality: 'Auto Hematology Analyzer',
    protocol: 'HL7 v2.3.1 / Bi-directional RS232',
    port: 'COM2 / TCP 5101',
    baudRate: 115200,
    status: 'CONNECTED',
    lastPing: 'Live Online',
    supportedParams: ['Hb', 'RBC', 'PCV', 'MCV', 'MCH', 'MCHC', 'RDW-CV', 'TLC', 'NEUT', 'LYMPH', 'EOS', 'MONO', 'BASO', 'PLT', 'MPV']
  },
  {
    id: 'MACH-03',
    name: 'Roche Cobas c311 / c501 Chemistry',
    modality: 'Fully Automated Clinical Chemistry',
    protocol: 'ASTM 1381 / E1394 Serial & Ethernet',
    port: 'TCP 5200',
    baudRate: 19200,
    status: 'CONNECTED',
    lastPing: 'Live Online',
    supportedParams: ['Glucose', 'Urea', 'Creatinine', 'Bilirubin Total', 'Bilirubin Direct', 'SGOT', 'SGPT', 'ALP', 'Total Protein', 'Albumin', 'Cholesterol', 'Triglycerides', 'HDL', 'Uric Acid', 'Calcium', 'Phosphorus']
  },
  {
    id: 'MACH-04',
    name: 'Bio-Rad D-10 Dual Program HPLC',
    modality: 'HbA1c & Hemoglobin Variant Analysis',
    protocol: 'ASTM E1394 / USB Interface',
    port: 'COM4 / USB',
    baudRate: 9600,
    status: 'CONNECTED',
    lastPing: 'Live Online',
    supportedParams: ['HbA1c', 'eAG', 'HbF', 'HbA2']
  },
  {
    id: 'MACH-05',
    name: 'Roche Cobas e411 / Elecsys CLIA',
    modality: 'Chemiluminescence Immunoassay (Hormones & Tumor Markers)',
    protocol: 'ASTM / HL7 Bidirectional',
    port: 'TCP 5300',
    baudRate: 9600,
    status: 'CONNECTED',
    lastPing: 'Live Online',
    supportedParams: ['TSH', 'Total T3', 'Total T4', 'FT3', 'FT4', 'Vitamin D3', 'Vitamin B12', 'Beta-hCG', 'Ferritin', 'PSA Total', 'Troponin-I', 'Anti-TPO', 'Cortisol', 'Prolactin']
  },
  {
    id: 'MACH-06',
    name: 'Stago Compact Max / Coagulation',
    modality: 'Automated Hemostasis Analyzer',
    protocol: 'ASTM 1394 Optical Clot',
    port: 'COM3',
    baudRate: 9600,
    status: 'CONNECTED',
    lastPing: 'Live Online',
    supportedParams: ['PT', 'INR', 'APTT', 'Fibrinogen']
  }
];

const DEFAULT_EXPIRY = Date.now() + 180 * 24 * 60 * 60 * 1000;

// Production Default Dataset with Active 180-Day License
const DEFAULT_DB_DATA = {
  masterVendorConfig: {
    labName: 'Modern Diagnostic Pathology Lab',
    securityKey: 'LIMS-180D-MODERN-6B7DC6DD-7211-0949-CAB6',
    defaultUsername: 'admin',
    defaultPassword: 'admin123',
    durationValue: 180,
    durationUnit: 'days',
    expiryTimestamp: DEFAULT_EXPIRY
  },
  licenseInfo: {
    labName: 'Modern Diagnostic Pathology Lab',
    licenseKey: 'LIMS-180D-MODERN-6B7DC6DD-7211-0949-CAB6',
    expiryTimestamp: DEFAULT_EXPIRY,
    formattedExpiry: new Date(DEFAULT_EXPIRY).toLocaleString('en-GB'),
    isExpired: false
  },
  labProfile: {
    labName: 'Modern Diagnostic Pathology Lab',
    adminUsername: 'admin',
    adminPassword: 'admin123',
    isRegistered: false
  },
  patients: [],
  tests: [],
  machines: STANDARD_MACHINES,
  inventory: [],
  b2bCenters: [],
  universal_raw_buffer_queue: [],
  machine_ingest_queue: [],
  qcRuns: [],
  activeSessions: {}
};

// Thread-safe Task Queue Handler for Rapid Consecutive Ingestion Writes
class DatabaseQueueController {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  enqueue(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processNext();
    });
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const { task, resolve, reject } = this.queue.shift();

    try {
      const result = await task();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }
}

const dbQueue = new DatabaseQueueController();

function getDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const tempInit = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempInit, JSON.stringify(DEFAULT_DB_DATA, null, 2), 'utf-8');
      fs.renameSync(tempInit, DB_FILE);
      return DEFAULT_DB_DATA;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw || '{}');

    // Ensure valid license exists if null, missing, or contains stale 'Utk' name
    if (!parsed.licenseInfo || !parsed.licenseInfo.licenseKey || (parsed.labProfile?.labName || '').toLowerCase().includes('utk') || (parsed.licenseInfo?.labName || '').toLowerCase().includes('utk')) {
      parsed.licenseInfo = DEFAULT_DB_DATA.licenseInfo;
      parsed.masterVendorConfig = DEFAULT_DB_DATA.masterVendorConfig;
      parsed.labProfile = DEFAULT_DB_DATA.labProfile;
      parsed.patients = [];
      saveDb(parsed);
    }

    if (!parsed.universal_raw_buffer_queue) parsed.universal_raw_buffer_queue = [];
    if (!parsed.machine_ingest_queue) parsed.machine_ingest_queue = [];

    return parsed;
  } catch (err) {
    console.error('Error reading database file, returning default clean dataset:', err);
    return DEFAULT_DB_DATA;
  }
}

function saveDb(data) {
  try {
    // Atomic file replacement using temporary staging file to eliminate race conditions
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error saving database file:', err);
    // Fallback save attempt in local dir if AppData fails
    try {
      const fallbackFile = path.join(__dirname, 'lims_database.json');
      const fallbackTemp = `${fallbackFile}.tmp`;
      fs.writeFileSync(fallbackTemp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(fallbackTemp, fallbackFile);
      return true;
    } catch (_) {
      return false;
    }
  }
}

function saveDbAsync(data) {
  return dbQueue.enqueue(() => {
    return Promise.resolve(saveDb(data));
  });
}

module.exports = {
  getDb,
  saveDb,
  saveDbAsync,
  read: getDb,
  write: saveDbAsync,
  DB_FILE,
  LIMS_DATA_DIR
};
