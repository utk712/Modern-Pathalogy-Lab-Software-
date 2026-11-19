// =========================================================================
// tests/22_phase1_phase2_verification.test.js
// Complete automated verification suite for Phase 1 (Security & SQLite Stability)
// and Phase 2 (Multi-PC Networking & Role-Based Access Control).
// =========================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const { db, SQLITE_FILE, logAudit, getAuditLogs } = require('../server/sqlite_db.js');
const { verifyLicenseKey } = require('../server/license_engine.js');
const { performDailyBackup, listBackups, verifyBackupIntegrity } = require('../server/backup_service.js');
const { getNetworkConfig, saveNetworkConfig, getLocalNetworkAddresses } = require('../server/network_config.js');
const { authenticateUser, isRoleAuthorized, createUser, listUsers } = require('../server/auth_middleware.js');

async function runPhase1Phase2Verification() {
  console.log('========================================================================');
  console.log('🛡️ PHASE 1 & PHASE 2 COMPREHENSIVE PRODUCTION VERIFICATION SUITE');
  console.log('========================================================================\n');

  const results = [];

  // P1-001: Vendor Tools Removal from Repository Workspace
  try {
    const toolsDir = path.join(__dirname, '..', 'tools');
    const toolsExist = fs.existsSync(toolsDir);
    assert.strictEqual(toolsExist, false, 'tools/ directory must not exist in workspace');

    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    assert(gitignore.includes('tools/'), '.gitignore must ignore tools/');
    assert(gitignore.includes('*.sqlite'), '.gitignore must ignore *.sqlite');

    results.push({
      id: 'P1-001',
      category: 'Phase 1: Repo Security',
      name: 'Vendor Tools & Key Generators Removed from Public Workspace',
      status: 'PASSED',
      evidence: 'tools/ deleted from workspace and added to .gitignore'
    });
  } catch (e) {
    results.push({ id: 'P1-001', category: 'Phase 1: Repo Security', name: 'Vendor Tools Removal', status: 'FAILED', evidence: e.message });
  }

  // P1-002: Backend-Only HMAC License Verification
  try {
    const validKey = 'LIMS-180D-MODERN-6B7DC6DD-7211-0949-CAB6';
    const ver = verifyLicenseKey('Modern Diagnostic Pathology Lab', validKey);
    assert.strictEqual(ver.valid, true, 'Valid key must verify');

    const forgedKey = 'LIMS-180D-MODERN-6B7DC6DD-7211-0949-9999';
    const forgedVer = verifyLicenseKey('Modern Diagnostic Pathology Lab', forgedKey);
    assert.strictEqual(forgedVer.valid, false, 'Forged key must be rejected');

    results.push({
      id: 'P1-002',
      category: 'Phase 1: Licensing',
      name: 'Server-Side HMAC-SHA256 Verification & Tamper Resistance',
      status: 'PASSED',
      evidence: `Valid key verified (Days: ${ver.daysRemaining}); Forged signature rejected (${forgedVer.error})`
    });
  } catch (e) {
    results.push({ id: 'P1-002', category: 'Phase 1: Licensing', name: 'Server-Side HMAC Verification', status: 'FAILED', evidence: e.message });
  }

  // P1-003: SQLite WAL Mode & ACID Relational Storage
  try {
    const journalMode = db.pragma('journal_mode', { simple: true });
    assert.strictEqual(journalMode, 'wal', 'SQLite must operate in WAL mode');

    const integrity = db.pragma('integrity_check', { simple: true });
    assert.strictEqual(integrity, 'ok', 'Database must pass integrity check');

    results.push({
      id: 'P1-003',
      category: 'Phase 1: Database Stability',
      name: 'SQLite WAL Mode & Transactional Integrity',
      status: 'PASSED',
      evidence: `Journal Mode: ${journalMode}, Integrity: ${integrity}`
    });
  } catch (e) {
    results.push({ id: 'P1-003', category: 'Phase 1: Database Stability', name: 'SQLite WAL Mode', status: 'FAILED', evidence: e.message });
  }

  // P1-004: Immutable Audit Trail SQLite Engine Triggers
  try {
    logAudit({
      username: 'supervisor',
      role: 'pathologist',
      action: 'RESULT_UPDATE',
      entityType: 'patient',
      entityId: 'PT-TEST-01',
      oldValue: '12.0',
      newValue: '14.2',
      details: 'Hemoglobin manual check'
    });

    const logs = getAuditLogs({ entityId: 'PT-TEST-01' });
    assert(logs.length > 0, 'Audit log must be recorded');
    const logId = logs[0].id;

    // Attempt illegal update
    let updateBlocked = false;
    try {
      db.prepare('UPDATE audit_logs SET details = ? WHERE id = ?').run('TAMPERED', logId);
    } catch (triggerErr) {
      updateBlocked = triggerErr.message.includes('immutable');
    }
    assert.strictEqual(updateBlocked, true, 'SQLite trigger must block UPDATE on audit_logs');

    // Attempt illegal delete
    let deleteBlocked = false;
    try {
      db.prepare('DELETE FROM audit_logs WHERE id = ?').run(logId);
    } catch (triggerErr) {
      deleteBlocked = triggerErr.message.includes('immutable');
    }
    assert.strictEqual(deleteBlocked, true, 'SQLite trigger must block DELETE on audit_logs');

    results.push({
      id: 'P1-004',
      category: 'Phase 1: NABL Compliance',
      name: 'Immutable Audit Trail Engine Triggers (Zero Edits/Deletes)',
      status: 'PASSED',
      evidence: 'SQLite BEFORE UPDATE and BEFORE DELETE triggers actively aborted tampering attempts'
    });
  } catch (e) {
    results.push({ id: 'P1-004', category: 'Phase 1: NABL Compliance', name: 'Immutable Audit Trail', status: 'FAILED', evidence: e.message });
  }

  // P1-005: AES-256-GCM Encrypted Snapshots & Restore Integrity Check
  try {
    const backup = await performDailyBackup();
    assert.strictEqual(backup.success, true, 'Backup must succeed');
    assert(backup.filename.endsWith('.sqlite.enc'), 'Snapshot must be .sqlite.enc');

    const verify = verifyBackupIntegrity(backup.filename);
    assert.strictEqual(verify.valid, true, 'Decrypted backup must pass integrity check');

    results.push({
      id: 'P1-005',
      category: 'Phase 1: Encrypted Backups',
      name: 'Point-in-Time SQLite WAL Encrypted Snapshot & Decrypt Verification',
      status: 'PASSED',
      evidence: `File: ${backup.filename}, Size: ${(backup.sizeBytes / 1024).toFixed(1)} KB, Integrity: ${verify.status}`
    });
  } catch (e) {
    results.push({ id: 'P1-005', category: 'Phase 1: Encrypted Backups', name: 'Encrypted Backups', status: 'FAILED', evidence: e.message });
  }

  // P2-001: Multi-PC Network LAN Configuration & Address Enumeration
  try {
    const addresses = getLocalNetworkAddresses();
    assert(Array.isArray(addresses) && addresses.length > 0, 'Must detect at least 1 network interface');

    const config = getNetworkConfig();
    assert(config.mode === 'server' || config.mode === 'client', 'Mode must be server or client');

    const saveRes = saveNetworkConfig({ mode: 'server', port: 5000 });
    assert.strictEqual(saveRes.success, true, 'Saving network config must succeed');

    results.push({
      id: 'P2-001',
      category: 'Phase 2: Multi-PC Networking',
      name: 'Multi-PC Network LAN Architecture (Server vs Client Mode)',
      status: 'PASSED',
      evidence: `Active LAN Interfaces: ${addresses.map(a => a.ip).join(', ')}; Mode: ${config.mode}`
    });
  } catch (e) {
    results.push({ id: 'P2-001', category: 'Phase 2: Multi-PC Networking', name: 'Multi-PC Network Architecture', status: 'FAILED', evidence: e.message });
  }

  // P2-002: Role-Based Access Control (RBAC) & User Management
  try {
    // Verify initial seeded users
    const users = listUsers();
    const roles = users.map(u => u.role);
    assert(roles.includes('admin'), 'admin user exists');
    assert(roles.includes('pathologist'), 'pathologist user exists');
    assert(roles.includes('technician'), 'technician user exists');
    assert(roles.includes('receptionist'), 'receptionist user exists');
    assert(roles.includes('phlebotomist'), 'phlebotomist user exists');

    // Permissions check
    assert.strictEqual(isRoleAuthorized('receptionist', 'registration'), true);
    assert.strictEqual(isRoleAuthorized('technician', 'worklist'), true);
    assert.strictEqual(isRoleAuthorized('technician', 'reports'), false); // Technician blocked from report approval
    assert.strictEqual(isRoleAuthorized('pathologist', 'reports'), true); // Pathologist authorized to approve

    results.push({
      id: 'P2-002',
      category: 'Phase 2: RBAC Security',
      name: '5-Role Access Control Matrix & Permission Boundaries',
      status: 'PASSED',
      evidence: 'Admin, Pathologist, Technician, Receptionist, Phlebotomist seeded; role permissions enforced'
    });
  } catch (e) {
    results.push({ id: 'P2-002', category: 'Phase 2: RBAC Security', name: 'RBAC Permission Boundaries', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  runPhase1Phase2Verification().then(res => {
    console.log('\n========================================================================');
    console.log('📊 PHASE 1 & 2 VERIFICATION RESULTS');
    console.log('========================================================================');
    let passed = 0;
    let failed = 0;
    res.forEach(r => {
      if (r.status === 'PASSED') {
        passed++;
        console.log(`  ✅ [${r.id}] ${r.category} -> ${r.name}: PASSED`);
        console.log(`     Evidence: ${r.evidence}`);
      } else {
        failed++;
        console.log(`  ❌ [${r.id}] ${r.category} -> ${r.name}: FAILED`);
        console.log(`     Evidence: ${r.evidence}`);
      }
    });
    console.log('\n========================================================================');
    console.log(`📈 SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${res.length})`);
    console.log('========================================================================\n');
  });
}

module.exports = { runPhase1Phase2Verification };
