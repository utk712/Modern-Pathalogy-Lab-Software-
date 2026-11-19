// =========================================================================
// server/sqlite_db.js - Production SQLite WAL Database Engine
// Features: Write-Ahead Logging (WAL), Full ACID Transactional Integrity,
// Crash Recovery, Foreign Keys, Immutable Audit Logs, and Automatic JSON Migration.
// =========================================================================

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

function resolveDataDir() {
  const appData = process.env.APPDATA || (
    process.platform === 'darwin'
      ? path.join(process.env.HOME || '', 'Library', 'Preferences')
      : path.join(process.env.HOME || '', '.config')
  );
  const preferredDir = path.join(appData, 'ModernDiagnosticLIMS');
  try {
    if (!fs.existsSync(preferredDir)) {
      fs.mkdirSync(preferredDir, { recursive: true });
    }
    // Test write permission
    const testFile = path.join(preferredDir, '.perm_test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return preferredDir;
  } catch (err) {
    const fallbackDir = path.join(__dirname, 'data');
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    return fallbackDir;
  }
}

const LIMS_DATA_DIR = resolveDataDir();
const SQLITE_FILE = path.join(LIMS_DATA_DIR, 'lims_production.sqlite');
const LEGACY_JSON_FILE = path.join(LIMS_DATA_DIR, 'lims_database.json');

// Connect to SQLite with high-concurrency settings
const db = new Database(SQLITE_FILE, {
  fileMustExist: false,
  timeout: 5000
});

// Configure High-Performance WAL Mode & Integrity
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.pragma('temp_store = MEMORY');

console.log(`[SQLite] Connected to production database: ${SQLITE_FILE} (Journal: ${db.pragma('journal_mode', { simple: true })})`);

/**
 * Initialize Relational Schema
 */
function initSchema() {
  db.exec(`
    -- 1. System Settings & Key-Value Configuration Store
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 2. Staff Accounts & RBAC Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL, -- 'admin', 'pathologist', 'technician', 'receptionist', 'phlebotomist'
      signature_image TEXT,
      phone TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 3. Multi-Device Sessions
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT NOT NULL,
      device_name TEXT,
      ip_address TEXT,
      login_time TEXT NOT NULL,
      last_heartbeat INTEGER NOT NULL
    );

    -- 4. Referring Doctors & Commission Setup
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialization TEXT,
      phone TEXT,
      email TEXT,
      default_commission_pct REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- 5. B2B Franchise Centers
    CREATE TABLE IF NOT EXISTS b2b_centers (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      owner TEXT,
      phone TEXT,
      address TEXT,
      discount_pct REAL NOT NULL DEFAULT 0,
      credit_limit REAL NOT NULL DEFAULT 50000,
      ledger_balance REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    -- 6. Patients & Specimen Records
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      uhid TEXT UNIQUE NOT NULL,
      lab_code TEXT,
      barcode TEXT,
      name TEXT NOT NULL,
      age TEXT NOT NULL,
      age_type TEXT NOT NULL DEFAULT 'Years', -- 'Days', 'Months', 'Years'
      gender TEXT NOT NULL,                  -- 'Male', 'Female', 'Other'
      phone TEXT,
      email TEXT,
      referring_doctor TEXT,
      b2b_center TEXT,
      sample_source TEXT DEFAULT 'In-House Collection',
      status TEXT NOT NULL DEFAULT 'REGISTERED',
      urgent_tat INTEGER NOT NULL DEFAULT 0,
      billing_json TEXT,
      samples_json TEXT,
      tests_json TEXT,
      results_json TEXT,
      doctor_review_json TEXT,
      qc_verification_json TEXT,
      approved_by TEXT,
      approval_time TEXT,
      registration_date TEXT,
      registered_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 7. Diagnostic Test Master Catalog
    CREATE TABLE IF NOT EXISTS test_master (
      id TEXT PRIMARY KEY,
      code TEXT,
      name TEXT NOT NULL,
      short_name TEXT,
      category TEXT,
      department TEXT,
      sample_type TEXT,
      method TEXT,
      tat TEXT,
      price REAL NOT NULL DEFAULT 0,
      b2b_price REAL NOT NULL DEFAULT 0,
      parameters_json TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    -- 8. Age & Gender-Based Biological Reference Intervals
    CREATE TABLE IF NOT EXISTS reference_ranges (
      id TEXT PRIMARY KEY,
      test_id TEXT,
      param_name TEXT NOT NULL,
      param_key TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'Both', -- 'Male', 'Female', 'Both'
      min_age_days INTEGER NOT NULL DEFAULT 0,
      max_age_days INTEGER NOT NULL DEFAULT 36500, -- up to 100 years
      normal_low REAL,
      normal_high REAL,
      panic_low REAL,
      panic_high REAL,
      display_text TEXT,
      unit TEXT
    );

    -- 9. Immutable Clinical Audit Log (Strict ISO 15189:2022 & NABL Compliance)
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,             -- 'PATIENT_CREATE', 'RESULT_UPDATE', 'STATUS_CHANGE', 'REPORT_RELEASE'
      entity_type TEXT NOT NULL,        -- 'patient', 'result', 'setting', 'qc'
      entity_id TEXT NOT NULL,
      test_id TEXT,
      param_key TEXT,
      old_value TEXT,
      new_value TEXT,
      details TEXT,
      timestamp TEXT NOT NULL
    );

    -- 10. Triggers Enforcing Immutability on Audit Logs (Zero Edits or Deletes)
    CREATE TRIGGER IF NOT EXISTS prevent_audit_logs_update
    BEFORE UPDATE ON audit_logs
    BEGIN
      SELECT RAISE(ABORT, 'Illegal Operation: audit_logs entries are immutable and cannot be updated.');
    END;

    CREATE TRIGGER IF NOT EXISTS prevent_audit_logs_delete
    BEFORE DELETE ON audit_logs
    BEGIN
      SELECT RAISE(ABORT, 'Illegal Operation: audit_logs entries are immutable and cannot be deleted.');
    END;

    -- 11. Referring Doctor Commission Ledger
    CREATE TABLE IF NOT EXISTS doctor_commissions (
      id TEXT PRIMARY KEY,
      doctor_id TEXT,
      doctor_name TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      uhid TEXT,
      patient_name TEXT,
      gross_amount REAL NOT NULL DEFAULT 0,
      commission_pct REAL NOT NULL DEFAULT 0,
      commission_amount REAL NOT NULL DEFAULT 0,
      settlement_status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SETTLED'
      settled_at TEXT,
      created_at TEXT NOT NULL
    );

    -- 12. Reagents & Consumables Inventory
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      department TEXT,
      stock_tests INTEGER NOT NULL DEFAULT 0,
      min_threshold INTEGER NOT NULL DEFAULT 50,
      status TEXT NOT NULL DEFAULT 'IN_STOCK',
      lot_no TEXT,
      expiry_date TEXT,
      updated_at TEXT NOT NULL
    );

    -- 13. Quality Control (IQC & L-J Runs)
    CREATE TABLE IF NOT EXISTS qc_runs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      machine_id TEXT,
      machine_name TEXT,
      test_name TEXT,
      control_level TEXT,
      lot_no TEXT,
      target_mean REAL,
      target_sd REAL,
      observed_value REAL,
      z_score REAL,
      rule_status TEXT,
      created_at TEXT NOT NULL
    );

    -- 14. Hardware Raw Packet Buffer
    CREATE TABLE IF NOT EXISTS hardware_raw_queue (
      stream_id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      channel TEXT,
      barcode TEXT,
      patient_name TEXT,
      parameter_count INTEGER DEFAULT 0,
      payload_text TEXT,
      parsing_status TEXT,
      matched_patient_id TEXT,
      matched_patient_name TEXT
    );

    -- 15. QC Staged Gate Queue (Held for Verification)
    CREATE TABLE IF NOT EXISTS hardware_staged_queue (
      staged_id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      channel TEXT,
      barcode TEXT,
      patient_id TEXT,
      patient_name TEXT,
      parameters_json TEXT,
      evaluated_params_json TEXT,
      has_panic INTEGER DEFAULT 0,
      has_abnormal INTEGER DEFAULT 0,
      delta_alerts_json TEXT,
      iqc_status TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
      reviewed_by TEXT,
      reviewed_at TEXT
    );

    -- 16. Bi-Directional Order Query Dispatch Logs
    CREATE TABLE IF NOT EXISTS bidirectional_query_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      barcode TEXT NOT NULL,
      remote_channel TEXT,
      order_found INTEGER DEFAULT 0,
      patient_id TEXT,
      patient_name TEXT,
      test_orders_json TEXT,
      raw_query_frame TEXT,
      dispatch_frame TEXT
    );

    -- Indexes for Rapid Queries
    CREATE INDEX IF NOT EXISTS idx_patients_uhid ON patients(uhid);
    CREATE INDEX IF NOT EXISTS idx_patients_barcode ON patients(barcode);
    CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_commissions_doctor ON doctor_commissions(doctor_name);
  `);
}

initSchema();

/**
 * Password Hashing Utility using Node.js crypto.scrypt
 */
function hashPassword(password, salt = null) {
  const userSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, userSalt, 64).toString('hex');
  return { hash, salt: userSalt };
}

function verifyPassword(password, hash, salt) {
  try {
    const computed = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch (err) {
    return false;
  }
}

/**
 * Seed Default Admin & System Users if not present
 */
function seedInitialUsers() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const now = new Date().toISOString();
    const adminCreds = hashPassword('admin123');

    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password_hash, salt, full_name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    insertUser.run('usr-admin-01', 'admin', adminCreds.hash, adminCreds.salt, 'Chief Administrator', 'admin', now, now);

    // Default Consultant Pathologist
    const pathCreds = hashPassword('doctor123');
    insertUser.run('usr-doc-01', 'doctor', pathCreds.hash, pathCreds.salt, 'Dr. Pallavi Gedam (MD Pathology)', 'pathologist', now, now);

    // Default Lab Technician
    const techCreds = hashPassword('tech123');
    insertUser.run('usr-tech-01', 'tech', techCreds.hash, techCreds.salt, 'Senior Lab Technician', 'technician', now, now);

    // Default Front Desk / Receptionist
    const recCreds = hashPassword('rec123');
    insertUser.run('usr-rec-01', 'reception', recCreds.hash, recCreds.salt, 'Front Desk Receptionist', 'receptionist', now, now);

    // Default Phlebotomist
    const phlebCreds = hashPassword('phleb123');
    insertUser.run('usr-phleb-01', 'phlebotomy', phlebCreds.hash, phlebCreds.salt, 'Senior Phlebotomist', 'phlebotomist', now, now);

    console.log('[SQLite] Seeded initial staff accounts for all 5 RBAC roles (admin, pathologist, technician, receptionist, phlebotomist).');
  }
}

seedInitialUsers();

// Seed clinical reference ranges (ISO 15189 / NABL standards)
const { seedReferenceRanges } = require('./reference_range_resolver');
seedReferenceRanges(db);

/**
 * Automatic Migration from Legacy `lims_database.json`
 */
function migrateFromJsonIfPresent() {
  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
  const legacyCandidate = fs.existsSync(LEGACY_JSON_FILE)
    ? LEGACY_JSON_FILE
    : (fs.existsSync(path.join(__dirname, 'lims_database.json')) ? path.join(__dirname, 'lims_database.json') : null);

  if (patientCount > 0 || !legacyCandidate) {
    return;
  }

  try {
    console.log(`[SQLite Migration] Detected existing ${legacyCandidate}. Beginning safe migration to SQLite WAL...`);
    const raw = fs.readFileSync(legacyCandidate, 'utf8');
    const legacy = JSON.parse(raw);

    const now = new Date().toISOString();

    // 1. Settings (Lab Profile, License, Report Design)
    if (legacy.labProfile) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)')
        .run('labProfile', JSON.stringify(legacy.labProfile), now);
    }
    if (legacy.licenseInfo) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)')
        .run('licenseInfo', JSON.stringify(legacy.licenseInfo), now);
    }
    if (legacy.masterVendorConfig) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)')
        .run('masterVendorConfig', JSON.stringify(legacy.masterVendorConfig), now);
    }

    // 2. Patients
    if (Array.isArray(legacy.patients) && legacy.patients.length > 0) {
      const insertPatient = db.prepare(`
        INSERT OR REPLACE INTO patients (
          id, uhid, lab_code, barcode, name, age, age_type, gender, phone, email,
          referring_doctor, b2b_center, sample_source, status, urgent_tat,
          billing_json, samples_json, tests_json, results_json, doctor_review_json,
          qc_verification_json, approved_by, approval_time, registration_date, registered_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        )
      `);

      const tx = db.transaction((patientsList) => {
        for (const p of patientsList) {
          insertPatient.run(
            p.id || `PT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            p.uhid || p.id || `UHID-${Date.now()}`,
            p.labCode || '',
            p.barcode || '',
            p.name || 'Unknown Patient',
            String(p.age || '30'),
            p.ageType || 'Years',
            p.gender || 'Male',
            p.phone || '',
            p.email || '',
            p.referringDoctor || 'Direct Walk-in / Self',
            p.b2bCenter || '',
            p.sampleSource || 'In-House Collection',
            p.status || 'REGISTERED',
            p.urgentTat ? 1 : 0,
            JSON.stringify(p.billing || {}),
            JSON.stringify(p.samples || []),
            JSON.stringify(p.tests || []),
            JSON.stringify(p.results || {}),
            JSON.stringify(p.doctorReview || {}),
            JSON.stringify(p.qcVerification || {}),
            p.approvedBy || null,
            p.approvalTime || null,
            p.registrationDate || '',
            p.registeredAt || now,
            now
          );
        }
      });

      tx(legacy.patients);
      console.log(`[SQLite Migration] Successfully migrated ${legacy.patients.length} patients into SQLite.`);
    }

    // 3. B2B Centers
    if (Array.isArray(legacy.b2bCenters) && legacy.b2bCenters.length > 0) {
      const insertB2b = db.prepare(`
        INSERT OR REPLACE INTO b2b_centers (id, code, name, owner, phone, address, discount_pct, credit_limit, ledger_balance, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const b of legacy.b2bCenters) {
        insertB2b.run(b.id, b.code, b.name, b.owner || '', b.phone || '', b.address || '', b.discountPct || 0, b.creditLimit || 50000, b.ledgerBalance || 0, now);
      }
    }

    // 4. Inventory
    if (Array.isArray(legacy.inventory) && legacy.inventory.length > 0) {
      const insertInv = db.prepare(`
        INSERT OR REPLACE INTO inventory (id, code, name, department, stock_tests, min_threshold, status, lot_no, expiry_date, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const i of legacy.inventory) {
        insertInv.run(i.id, i.code, i.name, i.department || '', i.stockTests || 0, i.minThreshold || 50, i.status || 'IN_STOCK', i.lotNo || '', i.expiryDate || '', now);
      }
    }

    // Rename candidate JSON file to .migrated so it acts as an untouched archive
    if (fs.existsSync(legacyCandidate)) {
      try {
        fs.renameSync(legacyCandidate, `${legacyCandidate}.migrated`);
      } catch (_) {}
    }
    console.log(`[SQLite Migration] Completed safely. Archived legacy JSON to ${legacyCandidate}.migrated`);
  } catch (err) {
    console.error('[SQLite Migration] Error migrating from JSON:', err);
  }
}

migrateFromJsonIfPresent();

// =========================================================================
// HIGH-LEVEL DATABASE ACCESS METHODS
// =========================================================================

/**
 * Backward-compatible full object reader matching server/index.js conventions
 */
function getDb() {
  const settingsRows = db.prepare('SELECT key, value_json FROM settings').all();
  const settingsMap = {};
  for (const s of settingsRows) {
    try {
      settingsMap[s.key] = JSON.parse(s.value_json);
    } catch (_) {}
  }

  // Fetch Patients
  const patientRows = db.prepare('SELECT * FROM patients ORDER BY registered_at DESC').all();
  const patients = patientRows.map(p => ({
    id: p.id,
    uhid: p.uhid,
    labCode: p.lab_code,
    barcode: p.barcode,
    name: p.name,
    age: p.age,
    ageType: p.age_type,
    gender: p.gender,
    phone: p.phone,
    email: p.email,
    referringDoctor: p.referring_doctor,
    b2bCenter: p.b2b_center,
    sampleSource: p.sample_source,
    status: p.status,
    urgentTat: Boolean(p.urgent_tat),
    billing: JSON.parse(p.billing_json || '{}'),
    samples: JSON.parse(p.samples_json || '[]'),
    tests: JSON.parse(p.tests_json || '[]'),
    results: JSON.parse(p.results_json || '{}'),
    doctorReview: JSON.parse(p.doctor_review_json || '{}'),
    qcVerification: JSON.parse(p.qc_verification_json || '{}'),
    approvedBy: p.approved_by,
    approvalTime: p.approval_time,
    registrationDate: p.registration_date,
    registeredAt: p.registered_at
  }));

  // Fetch B2B Centers
  const b2bRows = db.prepare('SELECT * FROM b2b_centers').all();
  const b2bCenters = b2bRows.map(b => ({
    id: b.id,
    code: b.code,
    name: b.name,
    owner: b.owner,
    phone: b.phone,
    address: b.address,
    discountPct: b.discount_pct,
    creditLimit: b.credit_limit,
    ledgerBalance: b.ledger_balance
  }));

  // Fetch Inventory
  const invRows = db.prepare('SELECT * FROM inventory').all();
  const inventory = invRows.map(i => ({
    id: i.id,
    code: i.code,
    name: i.name,
    department: i.department,
    stockTests: i.stock_tests,
    minThreshold: i.min_threshold,
    status: i.status,
    lotNo: i.lot_no,
    expiryDate: i.expiry_date
  }));

  // Fetch Queues
  const rawQueueRows = db.prepare('SELECT * FROM hardware_raw_queue ORDER BY timestamp DESC LIMIT 100').all();
  const stagedQueueRows = db.prepare('SELECT * FROM hardware_staged_queue ORDER BY timestamp DESC LIMIT 100').all();
  const queryLogsRows = db.prepare('SELECT * FROM bidirectional_query_logs ORDER BY timestamp DESC LIMIT 100').all();

  return {
    masterVendorConfig: settingsMap.masterVendorConfig || null,
    licenseInfo: settingsMap.licenseInfo || null,
    labProfile: settingsMap.labProfile || null,
    reportDesign: settingsMap.reportDesign || null,
    networkConfig: settingsMap.networkConfig || null,
    patients,
    b2bCenters,
    inventory,
    universal_raw_buffer_queue: rawQueueRows.map(r => ({
      streamId: r.stream_id,
      timestamp: r.timestamp,
      channel: r.channel,
      barcode: r.barcode,
      patientName: r.patient_name,
      parameterCount: r.parameter_count,
      payloadText: r.payload_text,
      parsingStatus: r.parsing_status,
      matchedPatientId: r.matched_patient_id,
      matchedPatientName: r.matched_patient_name
    })),
    machine_staged_queue: stagedQueueRows.map(s => ({
      stagedId: s.staged_id,
      timestamp: s.timestamp,
      channel: s.channel,
      barcode: s.barcode,
      patientId: s.patient_id,
      patientName: s.patient_name,
      parameters: JSON.parse(s.parameters_json || '{}'),
      evaluatedParams: JSON.parse(s.evaluated_params_json || '{}'),
      hasPanic: Boolean(s.has_panic),
      hasAbnormal: Boolean(s.has_abnormal),
      deltaAlerts: JSON.parse(s.delta_alerts_json || '[]'),
      iqcStatus: s.iqc_status,
      status: s.status,
      reviewedBy: s.reviewed_by,
      reviewedAt: s.reviewed_at
    })),
    bidirectional_query_logs: queryLogsRows.map(q => ({
      id: q.id,
      timestamp: q.timestamp,
      barcode: q.barcode,
      remoteChannel: q.remote_channel,
      orderFound: Boolean(q.order_found),
      patientId: q.patient_id,
      patientName: q.patient_name,
      testOrders: JSON.parse(q.test_orders_json || '[]'),
      rawQueryFrame: q.raw_query_frame,
      dispatchFrame: q.dispatch_frame
    }))
  };
}

/**
 * Backward-compatible saveDb method updating SQLite tables
 */
function saveDb(data) {
  if (!data) return false;
  const now = new Date().toISOString();

  const updateSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)');

  if (data.labProfile) updateSetting.run('labProfile', JSON.stringify(data.labProfile), now);
  if (data.licenseInfo) updateSetting.run('licenseInfo', JSON.stringify(data.licenseInfo), now);
  if (data.masterVendorConfig) updateSetting.run('masterVendorConfig', JSON.stringify(data.masterVendorConfig), now);
  if (data.reportDesign) updateSetting.run('reportDesign', JSON.stringify(data.reportDesign), now);
  if (data.networkConfig) updateSetting.run('networkConfig', JSON.stringify(data.networkConfig), now);

  // Sync Patients if provided
  if (Array.isArray(data.patients)) {
    const upsertPatient = db.prepare(`
      INSERT OR REPLACE INTO patients (
        id, uhid, lab_code, barcode, name, age, age_type, gender, phone, email,
        referring_doctor, b2b_center, sample_source, status, urgent_tat,
        billing_json, samples_json, tests_json, results_json, doctor_review_json,
        qc_verification_json, approved_by, approval_time, registration_date, registered_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `);

    const tx = db.transaction((list) => {
      for (const p of list) {
        upsertPatient.run(
          p.id,
          p.uhid || p.id,
          p.labCode || '',
          p.barcode || '',
          p.name || 'Unknown Patient',
          String(p.age || '30'),
          p.ageType || 'Years',
          p.gender || 'Male',
          p.phone || '',
          p.email || '',
          p.referringDoctor || 'Direct Walk-in / Self',
          p.b2bCenter || '',
          p.sampleSource || 'In-House Collection',
          p.status || 'REGISTERED',
          p.urgentTat ? 1 : 0,
          JSON.stringify(p.billing || {}),
          JSON.stringify(p.samples || []),
          JSON.stringify(p.tests || []),
          JSON.stringify(p.results || {}),
          JSON.stringify(p.doctorReview || {}),
          JSON.stringify(p.qcVerification || {}),
          p.approvedBy || null,
          p.approvalTime || null,
          p.registrationDate || '',
          p.registeredAt || now,
          now
        );
      }
    });

    tx(data.patients);
  }

  return true;
}

/**
 * Records an immutable clinical audit log entry (ISO 15189 compliance)
 */
function logAudit({ userId, username, role, action, entityType, entityId, testId, paramKey, oldValue, newValue, details }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        user_id, username, role, action, entity_type, entity_id, test_id, param_key, old_value, new_value, details, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId || null,
      username || 'system',
      role || 'system',
      action,
      entityType,
      entityId,
      testId || null,
      paramKey || null,
      oldValue !== undefined ? String(oldValue) : null,
      newValue !== undefined ? String(newValue) : null,
      details || null,
      new Date().toISOString()
    );
    return true;
  } catch (err) {
    console.error('[Audit Log Error]', err.message);
    return false;
  }
}

/**
 * Fetch Audit Logs with filtering and pagination
 */
function getAuditLogs({ entityId, username, limit = 100, offset = 0 } = {}) {
  let query = 'SELECT * FROM audit_logs';
  const params = [];
  const whereClauses = [];

  if (entityId) {
    whereClauses.push('entity_id = ?');
    params.push(entityId);
  }
  if (username) {
    whereClauses.push('username = ?');
    params.push(username);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

/**
 * Referring Doctors & Commission Ledger System (Phase 4 NABL & Commercial Accounting)
 */
function seedInitialDoctors() {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
    if (count === 0) {
      const now = new Date().toISOString();
      const insert = db.prepare(`
        INSERT INTO doctors (id, name, specialization, phone, email, default_commission_pct, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run('doc-01', 'Dr. Rajesh V. Sharma', 'Internal Medicine', '9820011223', 'dr.sharma@clinic.com', 15.0, now);
      insert.run('doc-02', 'Dr. Ananya Sen', 'Pediatrics', '9820022334', 'dr.sen@pediatrics.org', 20.0, now);
      insert.run('doc-03', 'Dr. Vikram Malhotra', 'Orthopedics', '9820033445', 'dr.vikram@ortho.net', 10.0, now);
      insert.run('doc-04', 'Dr. Priya Nair', 'Gynecology & Obstetrics', '9820044556', 'dr.priya@maternity.in', 15.0, now);
      console.log('[SQLite] Seeded initial referring doctors and commission rates.');
    }
  } catch (err) {
    console.warn('[SQLite] Error seeding doctors:', err.message);
  }
}

seedInitialDoctors();

function getDoctors() {
  return db.prepare('SELECT * FROM doctors ORDER BY name ASC').all();
}

function upsertDoctor({ id, name, specialization, phone, email, defaultCommissionPct }) {
  const docId = id || `doc-${Date.now()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO doctors (id, name, specialization, phone, email, default_commission_pct, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      specialization = excluded.specialization,
      phone = excluded.phone,
      email = excluded.email,
      default_commission_pct = excluded.default_commission_pct
  `).run(
    docId,
    name,
    specialization || 'General Practice',
    phone || '',
    email || '',
    parseFloat(defaultCommissionPct) || 0,
    now
  );
  return { id: docId, name, defaultCommissionPct };
}

function recordDoctorCommission(patient) {
  if (!patient || !patient.referringDoctor) return null;
  const docName = String(patient.referringDoctor).trim();
  if (docName.toLowerCase().includes('direct') || docName.toLowerCase().includes('self') || docName === '') {
    return null;
  }

  // Find doctor commission pct
  const matchedDoc = db.prepare('SELECT * FROM doctors WHERE LOWER(name) = LOWER(?) OR LOWER(name) LIKE ?').get(docName, `%${docName.toLowerCase()}%`);
  const commissionPct = matchedDoc ? matchedDoc.default_commission_pct : 15.0;

  let gross = 0;
  if (patient.billing && (patient.billing.total || patient.billing.grossAmount)) {
    gross = parseFloat(patient.billing.total || patient.billing.grossAmount) || 0;
  } else if (Array.isArray(patient.tests)) {
    gross = patient.tests.reduce((acc, t) => acc + (parseFloat(t.price) || 0), 0) || 500;
  } else {
    gross = 500;
  }

  const commissionAmount = parseFloat(((gross * commissionPct) / 100).toFixed(2));
  const commId = `COMM-${patient.id || Date.now()}`;
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT OR REPLACE INTO doctor_commissions (
        id, doctor_id, doctor_name, patient_id, uhid, patient_name,
        gross_amount, commission_pct, commission_amount, settlement_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(
      commId,
      matchedDoc?.id || 'doc-external',
      matchedDoc?.name || docName,
      patient.id,
      patient.uhid || '',
      patient.name || '',
      gross,
      commissionPct,
      commissionAmount,
      now
    );
    return { commId, commissionAmount, commissionPct };
  } catch (err) {
    console.warn('[Commission] Record error:', err.message);
    return null;
  }
}

function getDoctorCommissions({ doctorName, status = 'ALL', fromDate, toDate } = {}) {
  let query = 'SELECT * FROM doctor_commissions';
  const params = [];
  const where = [];

  if (doctorName && doctorName !== 'ALL') {
    where.push('(LOWER(doctor_name) = LOWER(?) OR LOWER(doctor_name) LIKE ?)');
    params.push(doctorName, `%${doctorName.toLowerCase()}%`);
  }
  if (status && status !== 'ALL') {
    where.push('settlement_status = ?');
    params.push(status.toUpperCase());
  }
  if (fromDate) {
    where.push('created_at >= ?');
    params.push(fromDate);
  }
  if (toDate) {
    where.push('created_at <= ?');
    params.push(toDate + 'T23:59:59.999Z');
  }

  if (where.length > 0) {
    query += ' WHERE ' + where.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params);

  let totalGross = 0;
  let totalCommission = 0;
  let pendingCommission = 0;
  let settledCommission = 0;

  for (const r of rows) {
    totalGross += r.gross_amount;
    totalCommission += r.commission_amount;
    if (r.settlement_status === 'SETTLED') {
      settledCommission += r.commission_amount;
    } else {
      pendingCommission += r.commission_amount;
    }
  }

  return {
    rows,
    summary: {
      count: rows.length,
      totalGross: parseFloat(totalGross.toFixed(2)),
      totalCommission: parseFloat(totalCommission.toFixed(2)),
      pendingCommission: parseFloat(pendingCommission.toFixed(2)),
      settledCommission: parseFloat(settledCommission.toFixed(2))
    }
  };
}

function settleDoctorCommissions(commissionIds = [], settledBy = 'admin') {
  if (!Array.isArray(commissionIds) || commissionIds.length === 0) {
    return { success: false, message: 'No commission IDs provided' };
  }

  const now = new Date().toISOString();
  const updateStmt = db.prepare(`
    UPDATE doctor_commissions
    SET settlement_status = 'SETTLED', settled_at = ?
    WHERE id = ?
  `);

  const tx = db.transaction((ids) => {
    let settledCount = 0;
    for (const id of ids) {
      const res = updateStmt.run(now, id);
      if (res.changes > 0) settledCount++;
    }
    return settledCount;
  });

  const count = tx(commissionIds);

  logAudit({
    userId: null,
    username: settledBy,
    role: 'admin',
    action: 'COMMISSION_SETTLED',
    entityType: 'doctor_commission',
    entityId: commissionIds.join(','),
    oldValue: 'PENDING',
    newValue: 'SETTLED',
    details: `Settled ${count} referring doctor commission records on ${now}`
  });

  return { success: true, settledCount: count, settledAt: now };
}

module.exports = {
  db,
  getDb,
  saveDb,
  saveDbAsync: (data) => Promise.resolve(saveDb(data)),
  read: getDb,
  write: (data) => Promise.resolve(saveDb(data)),
  hashPassword,
  verifyPassword,
  logAudit,
  getAuditLogs,
  getDoctors,
  upsertDoctor,
  recordDoctorCommission,
  getDoctorCommissions,
  settleDoctorCommissions,
  SQLITE_FILE,
  LIMS_DATA_DIR
};
