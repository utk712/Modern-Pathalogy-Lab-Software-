// =========================================================================
// 08_database_integrity_backup.test.js - SQLite WAL Database Integrity & Encrypted Backup
// =========================================================================

const assert = require('assert');
const { db, SQLITE_FILE } = require('../server/sqlite_db.js');
const { performDailyBackup, listBackups, verifyBackupIntegrity } = require('../server/backup_service.js');

async function runDatabaseBackupTests() {
  const results = [];

  // DB-001: SQLite WAL Mode & Schema Integrity Check
  try {
    const journalMode = db.pragma('journal_mode', { simple: true });
    assert.strictEqual(journalMode, 'wal', 'Database must operate in WAL (Write-Ahead Logging) mode');

    const integrity = db.pragma('integrity_check', { simple: true });
    assert.strictEqual(integrity, 'ok', 'Database file must pass SQLite integrity_check');

    // Verify core tables exist
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().map(t => t.name);
    const requiredTables = ['settings', 'users', 'patients', 'audit_logs', 'doctor_commissions', 'inventory', 'b2b_centers'];
    for (const req of requiredTables) {
      assert(tables.includes(req), `Table "${req}" must exist in schema`);
    }

    results.push({
      id: 'DB-001',
      category: 'Database Integrity',
      name: 'SQLite WAL Mode & Relational Schema Validation',
      status: 'PASSED',
      evidence: `Journal Mode: ${journalMode}, Integrity: ${integrity}, Tables: ${tables.length} verified`
    });
  } catch (e) {
    results.push({ id: 'DB-001', category: 'Database Integrity', name: 'SQLite WAL Mode & Schema Validation', status: 'FAILED', evidence: e.message });
  }

  // BACKUP-001: Automated AES-256-GCM Encrypted Snapshot & Restore Verification
  try {
    // 1. Trigger point-in-time encrypted backup
    const backupOutcome = await performDailyBackup();
    assert.strictEqual(backupOutcome.success, true, 'Encrypted backup creation must succeed');
    assert(backupOutcome.filename.endsWith('.sqlite.enc'), 'Backup file must be AES-256-GCM encrypted (.sqlite.enc)');
    assert(backupOutcome.sizeBytes > 1000, 'Backup file must have valid payload bytes');

    // 2. Verify Decryption & SQLite Integrity Check
    const verifyOutcome = verifyBackupIntegrity(backupOutcome.filename);
    assert.strictEqual(verifyOutcome.valid, true, 'Decrypted backup must pass integrity check');
    assert.strictEqual(verifyOutcome.status, 'ok', 'Integrity check must return ok');

    results.push({
      id: 'BACKUP-001',
      category: 'Backup & Restore',
      name: 'Point-in-Time SQLite WAL Encrypted Snapshot & Verification',
      status: 'PASSED',
      evidence: `File: ${backupOutcome.filename}, Size: ${(backupOutcome.sizeBytes / 1024).toFixed(1)} KB, Decrypt & Integrity: PASSED (100% OK)`
    });
  } catch (e) {
    results.push({ id: 'BACKUP-001', category: 'Backup & Restore', name: 'Point-in-Time SQLite WAL Encrypted Snapshot', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  runDatabaseBackupTests().then(r => console.log(r));
}

module.exports = { runDatabaseBackupTests };
