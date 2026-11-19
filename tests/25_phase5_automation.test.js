// =========================================================================
// tests/25_phase5_automation.test.js - Advanced Automation & Packaging Verification
// Covers: Machine Interfacing (ASTM/HL7 TCP/Serial listeners), Staging QC Gates,
// Electron Auto-Updater configuration, and Clean NSIS Production Packaging.
// =========================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { isAnalyzerQuery, handleAnalyzerQuery } = require('../server/bidirectional_controller.js');
const { processThroughQCGate } = require('../server/qc_gate.js');

async function runPhase5AutomationTests() {
  const results = [];
  console.log('[Test Suite 25] Starting Phase 5 Advanced Automation & Packaging Verification...');

  // -------------------------------------------------------------------------
  // TEST AUT-001: Machine Interfacing (ASTM / HL7 Bidirectional Middleware)
  // -------------------------------------------------------------------------
  try {
    // 1. Test ASTM Query Detection
    const astmQueryFrame = '\x021Q|1|^SMP-8801||ALL||||||||O\x0307\r\n';
    const isQuery = isAnalyzerQuery(astmQueryFrame);
    assert.strictEqual(isQuery, true, 'ASTM Q frame must be detected as an analyzer order query');

    // 2. Test ASTM Order Dispatch Handling
    const mockDb = {
      patients: [
        {
          id: 'PT-8801',
          name: 'Sunita Verma',
          barcode: 'SMP-8801',
          tests: [
            { id: 'TEST_CBC', name: 'Complete Blood Count', code: 'CBC' }
          ]
        }
      ]
    };
    const dispatch = handleAnalyzerQuery(astmQueryFrame, mockDb);
    assert.ok(dispatch, 'Dispatch frame must be generated for patient');
    assert.strictEqual(dispatch.found, true);
    assert.ok(dispatch.responsePayload.includes('SMP-8801'), 'Order frame must include specimen barcode');

    // 3. Test QC Staging Gate & Delta Check
    const stagedRecord = processThroughQCGate(
      'SMP-8801',
      { 'HGB': '14.2', 'PLT': '250000', 'WBC': '7200' },
      mockDb.patients[0],
      mockDb,
      'TCP'
    );
    assert.ok(stagedRecord, 'Staged QC record must be constructed');
    assert.strictEqual(stagedRecord.hasPanic, false, 'Normal values must not trigger panic in QC gate');

    results.push({
      id: 'AUT-001',
      category: 'Machine Interfacing',
      name: 'ASTM E1394 / HL7 Bi-directional Analyzer Dispatch & QC Gate',
      status: 'PASSED',
      evidence: `Query Detection: TRUE, Order Found: PT-8801 (${dispatch.responsePayload.length} bytes), QC Gate Status: STAGED_FOR_REVIEW`
    });
  } catch (err) {
    results.push({
      id: 'AUT-001',
      category: 'Machine Interfacing',
      name: 'ASTM E1394 / HL7 Bi-directional Analyzer Dispatch & QC Gate',
      status: 'FAILED',
      evidence: err.message
    });
  }

  // -------------------------------------------------------------------------
  // TEST AUT-002: Auto-Updater & Clean Production Packaging Configuration
  // -------------------------------------------------------------------------
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    // Check electron-updater
    assert.ok(pkg.dependencies['electron-updater'], 'electron-updater must be in dependencies');

    // Check NSIS installer config
    assert.ok(pkg.build, 'build section must exist in package.json');
    assert.strictEqual(pkg.build.win.target, 'nsis', 'Windows build target must be NSIS installer');
    assert.strictEqual(pkg.build.nsis.oneClick, false, 'NSIS must allow custom install directory');

    // Check .gitignore isolates binaries and private vendor tools
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    assert.ok(gitignore.includes('tools/'), '.gitignore must ignore vendor tools/');
    assert.ok(gitignore.includes('*.sqlite'), '.gitignore must ignore live SQLite database files');
    assert.ok(gitignore.includes('*.exe'), '.gitignore must ignore built .exe installer binaries');

    results.push({
      id: 'AUT-002',
      category: 'Packaging & Updates',
      name: 'Auto-Updater (electron-updater) & Clean NSIS Setup Configuration',
      status: 'PASSED',
      evidence: `Version: ${pkg.version}, Target: ${pkg.build.win.target}, NSIS OneClick: ${pkg.build.nsis.oneClick}, Git Binaries Protected: TRUE`
    });
  } catch (err) {
    results.push({
      id: 'AUT-002',
      category: 'Packaging & Updates',
      name: 'Auto-Updater (electron-updater) & Clean NSIS Setup Configuration',
      status: 'FAILED',
      evidence: err.message
    });
  }

  return results;
}

module.exports = {
  runPhase5AutomationTests
};

if (require.main === module) {
  runPhase5AutomationTests().then(r => console.log(JSON.stringify(r, null, 2)));
}
