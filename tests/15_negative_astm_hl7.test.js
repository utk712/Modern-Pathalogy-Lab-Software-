// =========================================================================
// 15_negative_astm_hl7.test.js - Negative ASTM / HL7 Robustness Tests
// =========================================================================

const assert = require('assert');
const { parseASTMMessage, parseHL7Message, routeAnalyzerResult } = require('./06_astm_hl7_interop.test.js');

function runNegativeASTMHL7Tests() {
  const results = [];

  // NEG-ASTM-001: Malformed ASTM Frame Graceful Handling
  try {
    const malformedASTM = "GARBAGE_LINE_WITHOUT_DELIMITERS\rUNKNOWN|FIELD\rR|||INVALID|||||";
    const parsed = parseASTMMessage(malformedASTM);
    assert(parsed !== null && typeof parsed === 'object', 'Parser handles malformed ASTM without crashing');
    assert.strictEqual(parsed.patientId, null, 'Patient ID is null');
    results.push({ id: 'NEG-ASTM-001', category: 'ASTM Interoperability', name: 'Malformed ASTM Frame Graceful Handling', status: 'PASSED', evidence: 'Malformed payload handled safely without process crash' });
  } catch (e) {
    results.push({ id: 'NEG-ASTM-001', category: 'ASTM Interoperability', name: 'Malformed ASTM Frame Graceful Handling', status: 'FAILED', evidence: e.message });
  }

  // NEG-HL7-001: Missing Mandatory Segments (Missing PID & OBR)
  try {
    const malformedHL7 = "MSH|^~\\&|ERBA|LAB\rOBX|1|NM|GLU^Fasting Glucose|1|150|mg/dL|70-99|H|||F\r";
    const parsed = parseHL7Message(malformedHL7);
    assert(parsed !== null, 'Parser handles missing segments safely');
    assert.strictEqual(parsed.patientId, null, 'Patient ID is null');
    assert.strictEqual(parsed.sampleId, null, 'Sample ID is null');
    assert.strictEqual(parsed.parameters.length, 1, 'Extracted OBX parameter');
    results.push({ id: 'NEG-HL7-001', category: 'HL7 Interoperability', name: 'Missing Mandatory HL7 Segments Handling', status: 'PASSED', evidence: 'Missing PID/OBR handled cleanly' });
  } catch (e) {
    results.push({ id: 'NEG-HL7-001', category: 'HL7 Interoperability', name: 'Missing Mandatory HL7 Segments Handling', status: 'FAILED', evidence: e.message });
  }

  // NEG-HL7-002: Unknown Sample Barcode Routing Safeguard
  try {
    const mockDB = { patients: [{ id: 'PT-101', name: 'John Doe', samples: [{ barcode: 'SMP-VALID' }] }] };
    const routeRes = routeAnalyzerResult(mockDB, 'SMP-NONEXISTENT', [{ code: 'WBC', val: '12.0' }]);

    assert.strictEqual(routeRes.success, false, 'Routing fails for non-existent sample');
    assert.strictEqual(routeRes.reason, 'Sample ID Not Found in Patient Database', 'Appropriate rejection reason');
    results.push({ id: 'NEG-HL7-002', category: 'Patient Safety', name: 'Unknown Sample Routing Safeguard', status: 'PASSED', evidence: 'Unknown sample barcode rejected safely without corrupting database' });
  } catch (e) {
    results.push({ id: 'NEG-HL7-002', category: 'Patient Safety', name: 'Unknown Sample Routing Safeguard', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  console.log(runNegativeASTMHL7Tests());
}

module.exports = { runNegativeASTMHL7Tests };
