// =========================================================================
// tests/20_hardware_interop_upgrade.test.js - Verification of Upgraded Hardware & LIS Components
// =========================================================================

const assert = require('assert');
const { isAnalyzerQuery, extractQueryBarcode, handleAnalyzerQuery, formatTestCodes } = require('../server/bidirectional_controller.js');
const { evaluateParametersQC, processThroughQCGate, commitStagedRecord, rejectStagedRecord, PANIC_LIMITS } = require('../server/qc_gate.js');
const { scanAvailableCOMPorts, getSerialStatus } = require('../server/serial_driver.js');
const { getConnectedClientsCount, broadcastLiveSync } = require('../server/websocket_server.js');

async function runTests() {
  console.log('🧪 Starting Verification of Upgraded Hardware & LIS Architecture...\n');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ✕ ${name}:`, e.message);
    }
  }

  // Mock Database
  const mockDb = {
    patients: [
      {
        id: 'PT-1001',
        uhid: 'UHID-8801',
        name: 'Utkarsh Rahangdale',
        gender: 'Male',
        barcode: 'SMP-951143-1',
        status: 'Sample Collected',
        tests: [{ name: 'Complete Blood Count' }, { name: 'Lipid Profile' }],
        historicalResults: { 'HGB': 14.5 }
      }
    ],
    qcRuns: [
      { date: new Date().toISOString().split('T')[0], parameter: 'Glucose', ruleStatus: 'PASSED' }
    ],
    machine_staged_queue: [],
    universal_raw_buffer_queue: [],
    bidirectional_query_logs: []
  };

  // Test 1: Bi-Directional Query Detection
  test('Bi-Directional Controller: Detects ASTM Q record', () => {
    const rawASTM = 'H|\\^&|||SYSMEX|||||||P|1\rQ|1|^SMP-951143-1||ALL||||||||O\rL|1|N\r';
    assert.strictEqual(isAnalyzerQuery(rawASTM), true);
    assert.strictEqual(extractQueryBarcode(rawASTM), 'SMP-951143-1');
  });

  // Test 2: Bi-Directional Order Dispatch
  test('Bi-Directional Controller: Dispatches matched patient test orders in ASTM format', () => {
    const rawASTM = 'Q|1|^SMP-951143-1||ALL||||||||O\r';
    const result = handleAnalyzerQuery(rawASTM, mockDb, 'TCP_192.168.1.100');
    assert.strictEqual(result.isQuery, true);
    assert.strictEqual(result.found, true);
    assert.strictEqual(result.patient.name, 'Utkarsh Rahangdale');
    assert.strictEqual(result.testCodes.includes('^^^CBC'), true);
    assert.strictEqual(result.responsePayload.includes('O|1|SMP-951143-1||^^^CBC\\^^^LIPID'), true);
  });

  // Test 3: Bi-Directional Query with Unknown Barcode
  test('Bi-Directional Controller: Returns termination frame for unknown barcode', () => {
    const rawASTM = 'Q|1|^UNKNOWN-999||ALL||||||||O\r';
    const result = handleAnalyzerQuery(rawASTM, mockDb, 'TCP_192.168.1.100');
    assert.strictEqual(result.isQuery, true);
    assert.strictEqual(result.found, false);
    assert.strictEqual(result.responsePayload.includes('||||||||X'), true); // Termination X
  });

  // Test 4: QC Gate Critical Panic Evaluation
  test('QC Validation Gate: Detects critical panic thresholds', () => {
    const params = { 'HGB': 5.2, 'WBC': 8500, 'PLT': 250000 };
    const evalResult = evaluateParametersQC(params, mockDb.patients[0], mockDb);
    assert.strictEqual(evalResult.hasPanic, true);
    assert.strictEqual(evalResult.parameters['HGB'].flag, 'CRITICAL_LOW');
    assert.strictEqual(evalResult.parameters['WBC'].flag, 'NORMAL');
  });

  // Test 5: QC Gate Historical Delta Alert
  test('QC Validation Gate: Flags historical delta shift (> 35% difference)', () => {
    // Previous HGB was 14.5. New is 8.0 (> 40% drop)
    const params = { 'HGB': 8.0 };
    const evalResult = evaluateParametersQC(params, mockDb.patients[0], mockDb);
    assert.strictEqual(evalResult.deltaAlerts.length, 1);
    assert.strictEqual(evalResult.deltaAlerts[0].parameter, 'HGB');
  });

  // Test 6: QC Gate Staging and Approval Lifecycle
  test('QC Validation Gate: Holds results in staging until technical approval', () => {
    const staged = processThroughQCGate('SMP-951143-1', { 'HGB': 13.5, 'WBC': 6500 }, mockDb.patients[0], mockDb, 'TCP');
    assert.strictEqual(staged.status, 'PENDING_REVIEW');
    assert.strictEqual(mockDb.machine_staged_queue.length, 1);

    // Approve & Commit
    const commitResult = commitStagedRecord(staged.stagedId, mockDb, 'Technologist Utkarsh');
    assert.strictEqual(commitResult.success, true);
    assert.strictEqual(commitResult.record.status, 'COMMITTED');
    assert.strictEqual(mockDb.patients[0].results['HGB'], 13.5);
    assert.strictEqual(mockDb.patients[0].status, 'Results Entered');
  });

  // Test 7: Serial COM Port Enumeration
  await new Promise(r => {
    test('RS-232 Serial Driver: Scans and reports COM ports cleanly', () => {
      scanAvailableCOMPorts().then(res => {
        assert.strictEqual(Array.isArray(res.availablePorts), true);
        assert.strictEqual(typeof getSerialStatus().status, 'string');
        r();
      });
    });
  });

  // Test 8: WebSocket Real-Time Broadcast Interface
  test('WebSocket Hub: Broadcast channel interface functions cleanly', () => {
    assert.strictEqual(typeof getConnectedClientsCount(), 'number');
    assert.doesNotThrow(() => {
      broadcastLiveSync('TEST_BROADCAST', { ping: true });
    });
  });

  console.log(`\n======================================================`);
  console.log(`🏆 UPGRADE VERIFICATION RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log(`======================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
