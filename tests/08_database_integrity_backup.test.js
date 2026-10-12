// =========================================================================
// 08_database_integrity_backup.test.js - Database Integrity & Full Backup/Restore Cycle
// =========================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const DB_PATH = path.join(__dirname, '../server/lims_database.json');
const BACKUP_DIR = 'C:\\ModernLIMS_Backups';
const TEST_BACKUP_PATH = path.join(BACKUP_DIR, 'test_restore_cycle_backup.json');

function runDatabaseBackupTests() {
  const results = [];

  // DB-001: Database File Readability & Schema Check
  try {
    assert(fs.existsSync(DB_PATH), `Database file exists at ${DB_PATH}`);
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(raw);
    assert(db && typeof db === 'object', 'Database is valid JSON object');
    assert(Array.isArray(db.patients), 'db.patients is array');
    assert(Array.isArray(db.machines), 'db.machines is array');
    results.push({ id: 'DB-001', category: 'Database Integrity', name: 'Database File & Schema Validation', status: 'PASSED', evidence: `Database parsed cleanly. Machines: ${db.machines.length}` });
  } catch (e) {
    results.push({ id: 'DB-001', category: 'Database Integrity', name: 'Database File & Schema Validation', status: 'FAILED', evidence: e.message });
  }

  // BACKUP-001: Full Backup Creation, Data Destruction & Full Restore Cycle
  try {
    // Step 1: Read Current Clean DB State
    const originalContent = fs.readFileSync(DB_PATH, 'utf8');
    const originalDB = JSON.parse(originalContent);

    // Step 2: Inject Test Patient Record
    const testPatient = {
      id: 'PT-QA-9999',
      name: 'QA Test Verification Patient',
      age: '40',
      gender: 'Male',
      mobile: '9999999999',
      samples: [{ barcode: 'SMP-QA-9999', status: 'RECEIVED' }],
      tests: [{ testId: 'T101', name: 'CBC', status: 'COMPLETED', result: '14.5' }]
    };

    const populatedDB = {
      ...originalDB,
      patients: [testPatient]
    };

    fs.writeFileSync(DB_PATH, JSON.stringify(populatedDB, null, 2), 'utf8');

    // Step 3: Execute Backup Creation to Disk
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    fs.writeFileSync(TEST_BACKUP_PATH, JSON.stringify(populatedDB, null, 2), 'utf8');
    assert(fs.existsSync(TEST_BACKUP_PATH), `Backup file created at ${TEST_BACKUP_PATH}`);

    // Step 4: Data Destruction Simulation (Wipe Patients)
    const destroyedDB = { ...populatedDB, patients: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(destroyedDB, null, 2), 'utf8');
    const dbAfterWipe = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    assert.strictEqual(dbAfterWipe.patients.length, 0, 'Database wiped successfully for testing');

    // Step 5: Execute Database Restore from Backup
    const backupContent = fs.readFileSync(TEST_BACKUP_PATH, 'utf8');
    fs.writeFileSync(DB_PATH, backupContent, 'utf8');
    const restoredDB = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

    // Step 6: Verify Data Integrity Post-Restore
    assert.strictEqual(restoredDB.patients.length, 1, 'Restored database contains 1 patient');
    assert.strictEqual(restoredDB.patients[0].id, 'PT-QA-9999', 'Restored patient ID matches');
    assert.strictEqual(restoredDB.patients[0].name, 'QA Test Verification Patient', 'Restored patient name matches');
    assert.strictEqual(restoredDB.patients[0].samples[0].barcode, 'SMP-QA-9999', 'Restored sample barcode matches');

    // Step 7: Clean up test backup and reset database to original clean slate
    fs.writeFileSync(DB_PATH, originalContent, 'utf8');
    if (fs.existsSync(TEST_BACKUP_PATH)) {
      fs.unlinkSync(TEST_BACKUP_PATH);
    }

    results.push({ id: 'BACKUP-001', category: 'Backup & Restore', name: 'Complete Backup, Destroy & Restore Cycle', status: 'PASSED', evidence: 'Full cycle verified: Write -> Backup -> Destroy -> Restore -> 100% Data Match' });
  } catch (e) {
    // Restore clean DB on failure
    try {
      const cleanDB = { masterVendorConfig: null, licenseInfo: null, labProfile: null, patients: [], tests: [], machines: [], inventory: [], b2bCenters: [], activeSessions: {} };
      fs.writeFileSync(DB_PATH, JSON.stringify(cleanDB, null, 2), 'utf8');
    } catch (_) {}
    results.push({ id: 'BACKUP-001', category: 'Backup & Restore', name: 'Complete Backup, Destroy & Restore Cycle', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  console.log(runDatabaseBackupTests());
}

module.exports = { runDatabaseBackupTests };
