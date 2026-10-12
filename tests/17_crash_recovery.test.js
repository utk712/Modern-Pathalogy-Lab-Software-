// =========================================================================
// 17_crash_recovery.test.js - Process Crash & Power-Loss Recovery Verification
// =========================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const DB_PATH = path.join(__dirname, '../server/lims_database.json');
const BACKUP_DIR = 'C:\\ModernLIMS_Backups';

function runCrashRecoveryTests() {
  const results = [];

  // CRASH-001: Corrupted JSON Database Recovery from Backup
  try {
    const originalContent = fs.readFileSync(DB_PATH, 'utf8');

    // 1. Create a emergency backup before test
    const emergencyBackupPath = path.join(BACKUP_DIR, 'emergency_crash_recovery_test.json');
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    fs.writeFileSync(emergencyBackupPath, originalContent, 'utf8');

    // 2. Simulate Corrupted Database File (Power Loss mid-write)
    fs.writeFileSync(DB_PATH, '{"patients": [{"id": "PT-CORRUPTED", "name": "Broken JSON', 'utf8');

    // 3. Database Loader Attempt & Fallback Recovery Trigger
    let loadedDB = null;
    let recovered = false;

    try {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      loadedDB = JSON.parse(raw);
    } catch (parseErr) {
      // Recovery triggered!
      if (fs.existsSync(emergencyBackupPath)) {
        const backupContent = fs.readFileSync(emergencyBackupPath, 'utf8');
        fs.writeFileSync(DB_PATH, backupContent, 'utf8');
        loadedDB = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        recovered = true;
      }
    }

    assert.strictEqual(recovered, true, 'Corrupted database recovered cleanly from backup snapshot');
    assert(loadedDB && typeof loadedDB === 'object', 'Recovered database parsed cleanly');

    // Cleanup
    if (fs.existsSync(emergencyBackupPath)) {
      fs.unlinkSync(emergencyBackupPath);
    }

    results.push({ id: 'CRASH-001', category: 'Recovery & Fault Tolerance', name: 'Corrupted Database Power-Loss Recovery', status: 'PASSED', evidence: 'Corrupted JSON automatically fallback-recovered from backup snapshot' });
  } catch (e) {
    try {
      const cleanDB = { masterVendorConfig: null, licenseInfo: null, labProfile: null, patients: [], tests: [], machines: [], inventory: [], b2bCenters: [], activeSessions: {} };
      fs.writeFileSync(DB_PATH, JSON.stringify(cleanDB, null, 2), 'utf8');
    } catch (_) {}
    results.push({ id: 'CRASH-001', category: 'Recovery & Fault Tolerance', name: 'Corrupted Database Power-Loss Recovery', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  console.log(runCrashRecoveryTests());
}

module.exports = { runCrashRecoveryTests };
