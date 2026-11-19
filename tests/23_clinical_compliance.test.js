// =========================================================================
// tests/23_clinical_compliance.test.js - Clinical & NABL Compliance Verification
// Covers: Age & Gender Biological Reference Intervals, Auto-Flagging H/L,
// Blocking Critical (Panic) Alerts, and Test Math Formulas (Lipid, LFT, CBC, eGFR).
// =========================================================================

const assert = require('assert');
const path = require('path');
const {
  convertToDays,
  resolveReferenceRange,
  evaluateResultValue,
  seedReferenceRanges
} = require('../server/reference_range_resolver.js');
const {
  calculateLipidPanel,
  calculateLFT,
  calculateCBC,
  calculateRFT,
  applyAutoCalculations
} = require('../src/utils/clinicalFormulas.js');
const { db, logAudit, getAuditLogs } = require('../server/sqlite_db.js');

async function runClinicalComplianceTests() {
  const results = [];

  console.log('[Test Suite 23] Starting Phase 3 Clinical & NABL Compliance Verification...');

  // Ensure reference ranges are seeded in SQLite
  seedReferenceRanges(db);

  // -------------------------------------------------------------------------
  // TEST CLI-001: Age & Gender-Based Reference Range Resolution
  // -------------------------------------------------------------------------
  try {
    // 1. Neonate (10 days old)
    const neonateRange = resolveReferenceRange(db, {
      paramKey: 'hemoglobin',
      paramName: 'Hemoglobin',
      gender: 'Both',
      age: 10,
      ageType: 'Days'
    });
    assert.ok(neonateRange, 'Neonate Hb range must be found');
    assert.strictEqual(neonateRange.normal_low, 14.5, 'Neonate Hb normal_low must be 14.5');
    assert.strictEqual(neonateRange.normal_high, 22.5, 'Neonate Hb normal_high must be 22.5');

    // 2. Child (5 years old)
    const childRange = resolveReferenceRange(db, {
      paramKey: 'hemoglobin',
      paramName: 'Hemoglobin',
      gender: 'Both',
      age: 5,
      ageType: 'Years'
    });
    assert.ok(childRange, 'Child Hb range must be found');
    assert.strictEqual(childRange.normal_low, 11.5, 'Child Hb normal_low must be 11.5');
    assert.strictEqual(childRange.normal_high, 15.5, 'Child Hb normal_high must be 15.5');

    // 3. Adult Male (35 years old)
    const adultMaleRange = resolveReferenceRange(db, {
      paramKey: 'hemoglobin',
      paramName: 'Hemoglobin',
      gender: 'Male',
      age: 35,
      ageType: 'Years'
    });
    assert.ok(adultMaleRange, 'Adult Male Hb range must be found');
    assert.strictEqual(adultMaleRange.normal_low, 13.5, 'Adult Male Hb normal_low must be 13.5');
    assert.strictEqual(adultMaleRange.normal_high, 17.5, 'Adult Male Hb normal_high must be 17.5');

    // 4. Adult Female (35 years old)
    const adultFemaleRange = resolveReferenceRange(db, {
      paramKey: 'hemoglobin',
      paramName: 'Hemoglobin',
      gender: 'Female',
      age: 35,
      ageType: 'Years'
    });
    assert.ok(adultFemaleRange, 'Adult Female Hb range must be found');
    assert.strictEqual(adultFemaleRange.normal_low, 12.0, 'Adult Female Hb normal_low must be 12.0');
    assert.strictEqual(adultFemaleRange.normal_high, 15.5, 'Adult Female Hb normal_high must be 15.5');

    // 5. Gender-Differentiated Serum Creatinine
    const maleCreat = resolveReferenceRange(db, {
      paramKey: 'creatinine',
      paramName: 'Serum Creatinine',
      gender: 'Male',
      age: 40,
      ageType: 'Years'
    });
    const femaleCreat = resolveReferenceRange(db, {
      paramKey: 'creatinine',
      paramName: 'Serum Creatinine',
      gender: 'Female',
      age: 40,
      ageType: 'Years'
    });
    assert.strictEqual(maleCreat.normal_high, 1.3, 'Adult Male Creatinine upper limit is 1.3');
    assert.strictEqual(femaleCreat.normal_high, 1.1, 'Adult Female Creatinine upper limit is 1.1');

    results.push({
      id: 'CLI-001',
      category: 'Clinical Compliance',
      name: 'Age & Gender Biological Interval Resolution',
      status: 'PASSED',
      evidence: `Neonate Hb: ${neonateRange.display_text}, Child Hb: ${childRange.display_text}, Adult Male Hb: ${adultMaleRange.display_text}, Adult Female Hb: ${adultFemaleRange.display_text}, Male Creatinine: ${maleCreat.display_text}, Female Creatinine: ${femaleCreat.display_text}`
    });
  } catch (err) {
    results.push({
      id: 'CLI-001',
      category: 'Clinical Compliance',
      name: 'Age & Gender Biological Interval Resolution',
      status: 'FAILED',
      evidence: err.message
    });
  }

  // -------------------------------------------------------------------------
  // TEST CLI-002: Auto-Flagging H/L & Critical Panic Alerts
  // -------------------------------------------------------------------------
  try {
    const adultFemaleHb = resolveReferenceRange(db, {
      paramKey: 'hemoglobin',
      paramName: 'Hemoglobin',
      gender: 'Female',
      age: 30,
      ageType: 'Years'
    });

    // 1. Normal value
    const normalEval = evaluateResultValue(13.2, adultFemaleHb);
    assert.strictEqual(normalEval.flag, 'NORMAL', '13.2 g/dL should be NORMAL for Adult Female');
    assert.strictEqual(normalEval.isAbnormal, false);
    assert.strictEqual(normalEval.isPanic, false);

    // 2. High value (non-panic)
    const highEval = evaluateResultValue(16.5, adultFemaleHb);
    assert.strictEqual(highEval.flag, 'HIGH', '16.5 g/dL should be HIGH for Adult Female');
    assert.strictEqual(highEval.isAbnormal, true);
    assert.strictEqual(highEval.isPanic, false);

    // 3. Life-Threatening Critical Panic Low (Hb < 7.0)
    const panicLowEval = evaluateResultValue(5.8, adultFemaleHb);
    assert.strictEqual(panicLowEval.flag, 'LOW', '5.8 g/dL should be LOW');
    assert.strictEqual(panicLowEval.isPanic, true, '5.8 g/dL must trigger PANIC flag');
    assert.strictEqual(panicLowEval.panicType, 'PANIC_LOW');

    // 4. Critical Panic Potassium (K+ > 6.2 mEq/L)
    const potassiumRange = resolveReferenceRange(db, {
      paramKey: 'potassium',
      paramName: 'Potassium (K+)',
      gender: 'Both',
      age: 50,
      ageType: 'Years'
    });
    const kPanic = evaluateResultValue(6.8, potassiumRange);
    assert.strictEqual(kPanic.isPanic, true, 'Potassium 6.8 mEq/L must trigger critical panic alert');
    assert.strictEqual(kPanic.panicType, 'PANIC_HIGH');

    // 5. Critical Panic Platelet Count (< 40,000 /cumm)
    const plateletRange = resolveReferenceRange(db, {
      paramKey: 'platelets',
      paramName: 'Platelet Count',
      gender: 'Both',
      age: 25,
      ageType: 'Years'
    });
    const pltPanic = evaluateResultValue(28000, plateletRange);
    assert.strictEqual(pltPanic.isPanic, true, 'Platelets 28,000 /cumm must trigger PANIC_LOW');

    results.push({
      id: 'CLI-002',
      category: 'Clinical Compliance',
      name: 'Auto-Flagging & Life-Threatening Critical (Panic) Detection',
      status: 'PASSED',
      evidence: `Normal: 13.2 => NORMAL, High: 16.5 => HIGH, Panic Low: 5.8 => PANIC_LOW, Panic K+: 6.8 => PANIC_HIGH, Panic Plt: 28k => PANIC_LOW`
    });
  } catch (err) {
    results.push({
      id: 'CLI-002',
      category: 'Clinical Compliance',
      name: 'Auto-Flagging & Life-Threatening Critical (Panic) Detection',
      status: 'FAILED',
      evidence: err.message
    });
  }

  // -------------------------------------------------------------------------
  // TEST CLI-003: Clinical Mathematical Formulas & Parameter Auto-Population
  // -------------------------------------------------------------------------
  try {
    // 1. Lipid Panel (Friedewald)
    const lipidInput = {
      totalCholesterol: '210',
      hdl: '45',
      triglycerides: '150'
    };
    const lipidRes = calculateLipidPanel(lipidInput);
    assert.strictEqual(lipidRes.vldl, 30.0, 'VLDL = 150 / 5 = 30.0');
    assert.strictEqual(lipidRes.ldl, 135.0, 'LDL = 210 - 45 - 30 = 135.0');
    assert.strictEqual(lipidRes.nonHdl, 165.0, 'Non-HDL = 210 - 45 = 165.0');
    assert.strictEqual(lipidRes.cholHdlRatio, 4.67, 'Chol/HDL = 210 / 45 = 4.67');
    assert.strictEqual(lipidRes.warning, null, 'No warning for TG <= 400');

    // 2. Lipid Panel Boundary: TG > 400
    const lipidHighTg = calculateLipidPanel({ totalCholesterol: 260, hdl: 35, triglycerides: 480 });
    assert.ok(lipidHighTg.warning && lipidHighTg.warning.includes('invalid'), 'Must warn when TG > 400 mg/dL');

    // 3. LFT Formulas
    const lftRes = calculateLFT({
      totalBilirubin: '2.5',
      directBilirubin: '0.8',
      totalProtein: '7.4',
      albumin: '4.2'
    });
    assert.strictEqual(lftRes.indirectBilirubin, 1.70, 'Indirect Bilirubin = 2.5 - 0.8 = 1.70');
    assert.strictEqual(lftRes.globulin, 3.20, 'Globulin = 7.4 - 4.2 = 3.20');
    assert.strictEqual(lftRes.agRatio, 1.31, 'A/G Ratio = 4.2 / 3.2 = 1.31');

    // 4. CBC Indices
    const cbcRes = calculateCBC({
      hemoglobin: '14.5',
      rbc: '4.80',
      pcv: '42.0',
      wbc: '8500',
      neutrophilPct: '60',
      lymphocytePct: '30'
    });
    assert.strictEqual(cbcRes.mcv, 87.50, 'MCV = 42 * 10 / 4.80 = 87.50 fl');
    assert.strictEqual(cbcRes.mch, 30.21, 'MCH = 14.5 * 10 / 4.80 = 30.21 pg');
    assert.strictEqual(cbcRes.mchc, 34.52, 'MCHC = 14.5 * 100 / 42.0 = 34.52 g/dL');
    assert.strictEqual(cbcRes.anc, 5100, 'ANC = 8500 * 0.60 = 5100 /cumm');
    assert.strictEqual(cbcRes.alc, 2550, 'ALC = 8500 * 0.30 = 2550 /cumm');

    // 5. Renal eGFR (CKD-EPI) & Anion Gap
    const rftRes = calculateRFT({
      sodium: '142',
      chloride: '104',
      bicarbonate: '24',
      creatinine: '1.0',
      age: 45,
      gender: 'Male'
    });
    assert.strictEqual(rftRes.anionGap, 14.0, 'Anion Gap = 142 - (104 + 24) = 14.0');
    assert.ok(rftRes.egfr >= 90 && rftRes.egfr <= 100, `eGFR should be ~96 mL/min/1.73m2, got ${rftRes.egfr}`);

    // 6. Comprehensive Auto-Calculation Pipeline Pipeline
    const rawFormInputs = {
      totalCholesterol: '200',
      triglycerides: '100',
      hdl: '50',
      totalBilirubin: '1.5',
      directBilirubin: '0.3',
      hemoglobin: '15.0',
      rbc: '5.0',
      pcv: '45.0'
    };
    const { updated } = applyAutoCalculations(rawFormInputs, { age: 35, gender: 'Male' });
    assert.strictEqual(updated.vldl, '20');
    assert.strictEqual(updated.ldl, '130');
    assert.strictEqual(updated.nonHdl, '150');
    assert.strictEqual(updated.indirectBilirubin, '1.2');
    assert.strictEqual(updated.mcv, '90');
    assert.strictEqual(updated.mch, '30');
    assert.strictEqual(updated.mchc, '33.33');

    results.push({
      id: 'CLI-003',
      category: 'Clinical Compliance',
      name: 'Calculated Formulas & Dynamic Parameter Pipeline',
      status: 'PASSED',
      evidence: `Lipid (VLDL: ${lipidRes.vldl}, LDL: ${lipidRes.ldl}), LFT (Indirect: ${lftRes.indirectBilirubin}, Glob: ${lftRes.globulin}, A/G: ${lftRes.agRatio}), CBC (MCV: ${cbcRes.mcv}, MCH: ${cbcRes.mch}, MCHC: ${cbcRes.mchc}), eGFR: ${rftRes.egfr}`
    });
  } catch (err) {
    results.push({
      id: 'CLI-003',
      category: 'Clinical Compliance',
      name: 'Calculated Formulas & Dynamic Parameter Pipeline',
      status: 'FAILED',
      evidence: err.message
    });
  }

  // -------------------------------------------------------------------------
  // TEST CLI-004: Critical Panic Value Clinician Notification Audit Trail
  // -------------------------------------------------------------------------
  try {
    const testPatientId = `PT-PANIC-TEST-${Date.now()}`;
    const logged = logAudit({
      userId: 'usr-tech-01',
      username: 'senior_technician',
      role: 'technician',
      action: 'PANIC_VALUE_ACKNOWLEDGED',
      entityType: 'patient_result',
      entityId: testPatientId,
      testId: 'TEST_CBC',
      paramKey: 'hemoglobin',
      oldValue: null,
      newValue: '5.4',
      details: JSON.stringify({
        parameter: 'Hemoglobin',
        value: 5.4,
        unit: 'g/dL',
        panicRange: 'PANIC_LOW: 7.0',
        clinicianNotified: 'Dr. Ramesh Sharma (Attending Physician)',
        notificationMethod: 'Immediate Phone Call',
        acknowledgedBy: 'senior_technician',
        remarks: 'Doctor acknowledged critical anemia, ordered urgent transfusion.'
      })
    });

    assert.strictEqual(logged, true, 'Audit log entry must be successfully created');

    const logs = getAuditLogs({ entityId: testPatientId });
    assert.strictEqual(logs.length, 1, 'Audit log entry must be retrieved from SQLite');
    assert.strictEqual(logs[0].action, 'PANIC_VALUE_ACKNOWLEDGED');
    assert.ok(logs[0].details.includes('Dr. Ramesh Sharma'), 'Audit log must record notified clinician');

    // Verify Immutability: SQLite trigger prevents UPDATE or DELETE
    let updateBlocked = false;
    try {
      db.prepare('UPDATE audit_logs SET details = ? WHERE id = ?').run('MODIFIED', logs[0].id);
    } catch (triggerErr) {
      updateBlocked = true;
    }
    assert.strictEqual(updateBlocked, true, 'SQLite trigger must block update of panic audit record');

    results.push({
      id: 'CLI-004',
      category: 'Clinical Compliance',
      name: 'Critical Panic Clinician Notification Audit Logging',
      status: 'PASSED',
      evidence: `Audit record ID: ${logs[0].id}, Action: ${logs[0].action}, Immutability Protected: ${updateBlocked}`
    });
  } catch (err) {
    results.push({
      id: 'CLI-004',
      category: 'Clinical Compliance',
      name: 'Critical Panic Clinician Notification Audit Logging',
      status: 'FAILED',
      evidence: err.message
    });
  }

  return results;
}

module.exports = {
  runClinicalComplianceTests
};

if (require.main === module) {
  runClinicalComplianceTests().then(results => {
    console.log(JSON.stringify(results, null, 2));
  });
}
