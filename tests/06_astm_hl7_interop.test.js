// =========================================================================
// 06_astm_hl7_interop.test.js - Interoperability & Patient-Result Crossover Safety
// =========================================================================

const assert = require('assert');

// ASTM Frame Parser Simulation
function parseASTMMessage(rawASTM) {
  const lines = rawASTM.split('\r').filter(Boolean);
  const result = { patientId: null, sampleId: null, parameters: [] };

  lines.forEach(line => {
    const fields = line.split('|');
    const recordType = fields[0];

    if (recordType === 'P' || recordType.endsWith('P')) {
      result.patientId = fields[2] || fields[3];
    } else if (recordType === 'O' || recordType.endsWith('O')) {
      result.sampleId = fields[2] ? fields[2].split('^')[0] : null;
    } else if (recordType === 'R' || recordType.endsWith('R')) {
      const code = fields[2] ? fields[2].split('^')[3] || fields[2].split('^')[0] : '';
      const val = fields[3];
      const unit = fields[4];
      const flags = fields[6];
      result.parameters.push({ code, val, unit, flags });
    }
  });

  return result;
}

// HL7 v2.5 ORU^R01 Parser Simulation
function parseHL7Message(rawHL7) {
  const segments = rawHL7.split('\r').filter(Boolean);
  const result = { patientId: null, sampleId: null, parameters: [] };

  segments.forEach(seg => {
    const fields = seg.split('|');
    const segType = fields[0];

    if (segType === 'PID') {
      result.patientId = fields[3] || fields[2];
    } else if (segType === 'OBR') {
      result.sampleId = fields[2] || fields[3];
    } else if (segType === 'OBX') {
      const paramCode = fields[3] ? fields[3].split('^')[0] : '';
      const val = fields[5];
      const unit = fields[6];
      const abnFlag = fields[8];
      result.parameters.push({ code: paramCode, val, unit, flags: abnFlag });
    }
  });

  return result;
}

// Patient Result Routing Engine Simulation
function routeAnalyzerResult(database, sampleId, rawResults) {
  // Find sample in database
  const targetPatient = database.patients.find(p => p.samples && p.samples.some(s => s.barcode === sampleId));
  if (!targetPatient) {
    return { success: false, reason: 'Sample ID Not Found in Patient Database' };
  }

  // Ensure strict patient isolation
  return {
    success: true,
    patientId: targetPatient.id,
    patientName: targetPatient.name,
    assignedSampleId: sampleId,
    results: rawResults
  };
}

function runInteropTests() {
  const results = [];

  // ASTM-001: Standard ASTM 1394-97 Message Parsing
  try {
    const astmRaw = "H|\\^&|||Mindray^BC-5000|||||||P|1\rP|1||PT-1001||DOE^JOHN||19850512|M\rO|1|SMP-8801||^^^CBC|||||||N\rR|1|^^^WBC|7.5|10^3/uL|4.0-10.0|N||F\rR|2|^^^RBC|4.85|10^6/uL|4.5-5.5|N||F\rL|1|N\r";
    const parsed = parseASTMMessage(astmRaw);
    assert.strictEqual(parsed.sampleId, 'SMP-8801', 'Sample ID extracted');
    assert.strictEqual(parsed.parameters.length, 2, '2 parameters parsed');
    assert.strictEqual(parsed.parameters[0].code, 'WBC', 'WBC parameter code');
    assert.strictEqual(parsed.parameters[0].val, '7.5', 'WBC value');
    results.push({ id: 'ASTM-001', category: 'ASTM Interoperability', name: 'ASTM E1394-97 Frame Parsing', status: 'PASSED', evidence: `Sample: ${parsed.sampleId}, Params: ${parsed.parameters.length}` });
  } catch (e) {
    results.push({ id: 'ASTM-001', category: 'ASTM Interoperability', name: 'ASTM E1394-97 Frame Parsing', status: 'FAILED', evidence: e.message });
  }

  // HL7-001: HL7 v2.5 ORU^R01 Message Parsing
  try {
    const hl7Raw = "MSH|^~\\&|ERBA|LAB|LIMS|HOST|20260827103000||ORU^R01|MSG001|P|2.5\rPID|1||PT-2002||SMITH^ALICE||19900315|F\rOBR|1|SMP-9902||GLU^Glucose|||20260827102500\rOBX|1|NM|GLU^Fasting Glucose|1|98|mg/dL|70-99|N|||F\r";
    const parsed = parseHL7Message(hl7Raw);
    assert.strictEqual(parsed.sampleId, 'SMP-9902', 'Sample ID extracted');
    assert.strictEqual(parsed.parameters[0].code, 'GLU', 'GLU parameter code');
    assert.strictEqual(parsed.parameters[0].val, '98', 'Glucose value');
    results.push({ id: 'HL7-001', category: 'HL7 Interoperability', name: 'HL7 v2.5 Message Parsing', status: 'PASSED', evidence: `Sample: ${parsed.sampleId}, Val: ${parsed.parameters[0].val}` });
  } catch (e) {
    results.push({ id: 'HL7-001', category: 'HL7 Interoperability', name: 'HL7 v2.5 Message Parsing', status: 'FAILED', evidence: e.message });
  }

  // CROSSOVER-SAFETY-001: Patient-Result Crossover Detection (CRITICAL SAFETY TEST)
  try {
    const mockDB = {
      patients: [
        { id: 'PAT-A', name: 'Patient A', samples: [{ barcode: 'SMP-A' }] },
        { id: 'PAT-B', name: 'Patient B', samples: [{ barcode: 'SMP-B' }] }
      ]
    };

    // Route Result for Sample A
    const routeA = routeAnalyzerResult(mockDB, 'SMP-A', [{ code: 'HGB', val: '15.2' }]);
    assert.strictEqual(routeA.patientId, 'PAT-A', 'SMP-A assigned strictly to Patient A');
    assert.notStrictEqual(routeA.patientId, 'PAT-B', 'SMP-A NEVER assigned to Patient B');

    // Route Result for Sample B
    const routeB = routeAnalyzerResult(mockDB, 'SMP-B', [{ code: 'HGB', val: '9.1' }]);
    assert.strictEqual(routeB.patientId, 'PAT-B', 'SMP-B assigned strictly to Patient B');
    assert.notStrictEqual(routeB.patientId, 'PAT-A', 'SMP-B NEVER assigned to Patient A');

    // Route Unmatched Sample ID
    const routeUnknown = routeAnalyzerResult(mockDB, 'SMP-UNKNOWN', [{ code: 'HGB', val: '12.0' }]);
    assert.strictEqual(routeUnknown.success, false, 'Unmatched sample safely rejected without misassignment');

    results.push({ id: 'CROSSOVER-SAFETY-001', category: 'Patient Safety', name: 'Patient-Result Crossover Isolation', status: 'PASSED', evidence: 'Zero Crossover: SMP-A -> PAT-A, SMP-B -> PAT-B, Unmatched -> Rejected' });
  } catch (e) {
    results.push({ id: 'CROSSOVER-SAFETY-001', category: 'Patient Safety', name: 'Patient-Result Crossover Isolation', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  console.log(runInteropTests());
}

module.exports = { runInteropTests, parseASTMMessage, parseHL7Message, routeAnalyzerResult };
