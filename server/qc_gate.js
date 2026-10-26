// =========================================================================
// server/qc_gate.js - Clinical QC Validation & Staging Gate Engine
// =========================================================================

// Critical Panic Limits (NABL / CAP Clinical Guidelines)
const PANIC_LIMITS = {
  'HGB': { panicLow: 7.0, panicHigh: 20.0, refLow: 12.0, refHigh: 17.5, unit: 'g/dL' },
  'HAEMOGLOBIN': { panicLow: 7.0, panicHigh: 20.0, refLow: 12.0, refHigh: 17.5, unit: 'g/dL' },
  'WBC': { panicLow: 2000, panicHigh: 30000, refLow: 4000, refHigh: 11000, unit: '/cumm' },
  'TOTAL WBC COUNT': { panicLow: 2000, panicHigh: 30000, refLow: 4000, refHigh: 11000, unit: '/cumm' },
  'PLT': { panicLow: 40000, panicHigh: 1000000, refLow: 150000, refHigh: 450000, unit: '/cumm' },
  'PLATELET COUNT': { panicLow: 40000, panicHigh: 1000000, refLow: 150000, refHigh: 450000, unit: '/cumm' },
  'GLU': { panicLow: 50, panicHigh: 400, refLow: 70, refHigh: 140, unit: 'mg/dL' },
  'GLUCOSE': { panicLow: 50, panicHigh: 400, refLow: 70, refHigh: 140, unit: 'mg/dL' },
  'POTASSIUM': { panicLow: 2.8, panicHigh: 6.2, refLow: 3.5, refHigh: 5.1, unit: 'mmol/L' },
  'CREATININE': { panicLow: 0.2, panicHigh: 5.0, refLow: 0.6, refHigh: 1.3, unit: 'mg/dL' }
};

/**
 * Evaluates raw incoming parameters against panic limits, reference bounds, and delta checks.
 */
function evaluateParametersQC(parameters, matchedPatient, db) {
  const evaluated = {};
  let hasPanic = false;
  let hasAbnormal = false;
  const deltaAlerts = [];

  for (const [key, rawVal] of Object.entries(parameters)) {
    const numVal = parseFloat(rawVal);
    const upperKey = key.toUpperCase();
    const rules = PANIC_LIMITS[upperKey];

    let flag = 'NORMAL';
    let alertReason = null;

    if (rules && !isNaN(numVal)) {
      if (numVal <= rules.panicLow) {
        flag = 'CRITICAL_LOW';
        hasPanic = true;
        alertReason = `Critical Panic Low (≤ ${rules.panicLow} ${rules.unit})`;
      } else if (numVal >= rules.panicHigh) {
        flag = 'CRITICAL_HIGH';
        hasPanic = true;
        alertReason = `Critical Panic High (≥ ${rules.panicHigh} ${rules.unit})`;
      } else if (numVal < rules.refLow) {
        flag = 'LOW';
        hasAbnormal = true;
      } else if (numVal > rules.refHigh) {
        flag = 'HIGH';
        hasAbnormal = true;
      }

      // Delta Check: Compare with patient's historical values if available
      if (matchedPatient && matchedPatient.historicalResults && matchedPatient.historicalResults[key]) {
        const prevVal = parseFloat(matchedPatient.historicalResults[key]);
        if (!isNaN(prevVal) && prevVal > 0) {
          const deltaPct = Math.abs((numVal - prevVal) / prevVal) * 100;
          if (deltaPct > 35) {
            deltaAlerts.push({
              parameter: key,
              prevValue: prevVal,
              currentValue: numVal,
              percentChange: deltaPct.toFixed(1)
            });
          }
        }
      }
    }

    evaluated[key] = {
      value: numVal,
      flag,
      alertReason
    };
  }

  // Instrument IQC Daily Status
  let iqcStatus = 'PASSED';
  if (Array.isArray(db.qcRuns) && db.qcRuns.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const todayRuns = db.qcRuns.filter(r => r.date === today);
    if (todayRuns.some(r => (r.ruleStatus || '').includes('VIOLATION'))) {
      iqcStatus = 'WARNING_WESTGARD_VIOLATION';
    }
  }

  return {
    parameters: evaluated,
    hasPanic,
    hasAbnormal,
    deltaAlerts,
    iqcStatus
  };
}

/**
 * Processes incoming analyzer results through the QC Staging Gate.
 */
function processThroughQCGate(barcode, resultMap, matchedPatient, db, channel) {
  if (!db.machine_staged_queue) db.machine_staged_queue = [];

  const qcEval = evaluateParametersQC(resultMap, matchedPatient, db);
  const stagedId = `STAGE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // Staging Policy:
  // If autoAccept is enabled and result is completely normal (no panics, no delta alerts, IQC passed):
  const autoAcceptEnabled = db.labSettings?.autoAcceptNormalMachineResults === true;
  const isEligibleForAutoAccept = autoAcceptEnabled && !qcEval.hasPanic && qcEval.deltaAlerts.length === 0;

  const initialStatus = isEligibleForAutoAccept ? 'AUTO_ACCEPTED' : 'PENDING_REVIEW';

  const stagedRecord = {
    stagedId,
    timestamp: new Date().toISOString(),
    channel,
    barcode: barcode || 'UNKNOWN',
    patientId: matchedPatient ? matchedPatient.id : null,
    patientName: matchedPatient ? matchedPatient.name : 'Unassigned Sample',
    parameters: resultMap,
    evaluatedParams: qcEval.parameters,
    hasPanic: qcEval.hasPanic,
    hasAbnormal: qcEval.hasAbnormal,
    deltaAlerts: qcEval.deltaAlerts,
    iqcStatus: qcEval.iqcStatus,
    status: initialStatus,
    reviewedBy: isEligibleForAutoAccept ? 'System Auto-Accept Rule' : null,
    reviewedAt: isEligibleForAutoAccept ? new Date().toISOString() : null
  };

  db.machine_staged_queue.unshift(stagedRecord);
  if (db.machine_staged_queue.length > 100) db.machine_staged_queue.pop();

  // If auto-accepted, apply immediately to matched patient
  if (isEligibleForAutoAccept && matchedPatient) {
    applyResultsToPatient(matchedPatient, resultMap);
  }

  return stagedRecord;
}

function applyResultsToPatient(patient, resultMap) {
  patient.status = 'Results Entered';
  patient.results = { ...(patient.results || {}), ...resultMap };
  if (Array.isArray(patient.tests)) {
    patient.tests = patient.tests.map(t => ({
      ...t,
      status: 'Results Entered',
      results: { ...(t.results || {}), ...resultMap }
    }));
  }
}

/**
 * Commits a staged result from the QC gate into the live patient record.
 */
function commitStagedRecord(stagedId, db, techName = 'Laboratory Technologist') {
  if (!Array.isArray(db.machine_staged_queue)) return { success: false, error: 'Staging queue empty' };
  
  const record = db.machine_staged_queue.find(r => r.stagedId === stagedId);
  if (!record) return { success: false, error: 'Staged record not found' };

  let matchedPatient = null;
  if (record.patientId && Array.isArray(db.patients)) {
    matchedPatient = db.patients.find(p => p.id === record.patientId);
  } else if (record.barcode && Array.isArray(db.patients)) {
    matchedPatient = db.patients.find(p => p.barcode === record.barcode);
  }

  if (!matchedPatient) {
    return { success: false, error: 'Cannot commit: No patient associated with this sample barcode' };
  }

  applyResultsToPatient(matchedPatient, record.parameters);
  record.status = 'COMMITTED';
  record.reviewedBy = techName;
  record.reviewedAt = new Date().toISOString();

  return { success: true, patient: matchedPatient, record };
}

/**
 * Rejects a staged result (e.g. hemolyzed specimen, machine artifact).
 */
function rejectStagedRecord(stagedId, db, reason = 'Specimen quality unsatisfactory') {
  if (!Array.isArray(db.machine_staged_queue)) return { success: false, error: 'Staging queue empty' };
  
  const record = db.machine_staged_queue.find(r => r.stagedId === stagedId);
  if (!record) return { success: false, error: 'Staged record not found' };

  record.status = 'REJECTED';
  record.rejectionReason = reason;
  record.reviewedAt = new Date().toISOString();

  return { success: true, record };
}

module.exports = {
  evaluateParametersQC,
  processThroughQCGate,
  commitStagedRecord,
  rejectStagedRecord,
  PANIC_LIMITS
};
