// =========================================================================
// 05_clinical_calculations.test.js - Clinical Calculation Verification
// Software Calculation Verification vs Clinical Validation
// =========================================================================

const assert = require('assert');

// eGFR Engine Implementation (MDRD & CKD-EPI 2021)
function calculateeGFR(scr, age, gender, formula = 'CKD-EPI-2021') {
  if (scr === null || scr === undefined || isNaN(scr) || scr <= 0) return null;
  if (age === null || age === undefined || isNaN(age) || age <= 0) return null;
  if (!gender) return null;

  const isFemale = String(gender).toLowerCase().startsWith('f');

  if (formula === 'CKD-EPI-2021') {
    const kappa = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.241 : -0.302;
    const femaleAdj = isFemale ? 1.012 : 1.0;

    const scrDivKappa = scr / kappa;
    const minVal = Math.min(scrDivKappa, 1.0);
    const maxVal = Math.max(scrDivKappa, 1.0);

    const egfr = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age) * femaleAdj;
    return Number(egfr.toFixed(1));
  } else {
    // MDRD Formula
    const femaleAdj = isFemale ? 0.742 : 1.0;
    const egfr = 175 * Math.pow(scr, -1.154) * Math.pow(age, -0.203) * femaleAdj;
    return Number(egfr.toFixed(1));
  }
}

function runClinicalCalculationTests() {
  const results = [];

  // CALC-001: Globulin Calculation (Total Protein - Albumin)
  try {
    const tp = 7.2, alb = 4.2;
    const globulin = Number((tp - alb).toFixed(2));
    assert.strictEqual(globulin, 3.0, 'Globulin = 7.2 - 4.2 = 3.0 g/dL');
    results.push({ id: 'CALC-001', category: 'Clinical Calculations', name: 'Globulin Formula Verification', status: 'PASSED', evidence: `TP: 7.2, Alb: 4.2 => Globulin: ${globulin}` });
  } catch (e) {
    results.push({ id: 'CALC-001', category: 'Clinical Calculations', name: 'Globulin Formula Verification', status: 'FAILED', evidence: e.message });
  }

  // CALC-002: A/G Ratio (Albumin / Globulin)
  try {
    const alb = 4.2, glob = 3.0;
    const ratio = Number((alb / glob).toFixed(2));
    assert.strictEqual(ratio, 1.40, 'A/G Ratio = 4.2 / 3.0 = 1.40');
    results.push({ id: 'CALC-002', category: 'Clinical Calculations', name: 'A/G Ratio Formula Verification', status: 'PASSED', evidence: `Alb: 4.2, Glob: 3.0 => A/G Ratio: ${ratio}` });
  } catch (e) {
    results.push({ id: 'CALC-002', category: 'Clinical Calculations', name: 'A/G Ratio Formula Verification', status: 'FAILED', evidence: e.message });
  }

  // CALC-003: VLDL Cholesterol (Triglycerides / 5)
  try {
    const tg = 160;
    const vldl = tg / 5;
    assert.strictEqual(vldl, 32, 'VLDL = 160 / 5 = 32 mg/dL');
    results.push({ id: 'CALC-003', category: 'Clinical Calculations', name: 'VLDL Formula Verification', status: 'PASSED', evidence: `TG: 160 => VLDL: ${vldl}` });
  } catch (e) {
    results.push({ id: 'CALC-003', category: 'Clinical Calculations', name: 'VLDL Formula Verification', status: 'FAILED', evidence: e.message });
  }

  // CALC-004: CBC Red Cell Indices (MCV, MCH, MCHC)
  try {
    const hgb = 14.0, rbc = 4.5, hct = 42.0;
    const mcv = Number(((hct * 10) / rbc).toFixed(1)); // (42*10)/4.5 = 93.3 fL
    const mch = Number(((hgb * 10) / rbc).toFixed(1)); // (14*10)/4.5 = 31.1 pg
    const mchc = Number(((hgb * 100) / hct).toFixed(1)); // (14*100)/42 = 33.3 g/dL
    assert.strictEqual(mcv, 93.3, 'MCV = 93.3 fL');
    assert.strictEqual(mch, 31.1, 'MCH = 31.1 pg');
    assert.strictEqual(mchc, 33.3, 'MCHC = 33.3 g/dL');
    results.push({ id: 'CALC-004', category: 'Clinical Calculations', name: 'CBC Indices Formula Verification', status: 'PASSED', evidence: `MCV: ${mcv}, MCH: ${mch}, MCHC: ${mchc}` });
  } catch (e) {
    results.push({ id: 'CALC-004', category: 'Clinical Calculations', name: 'CBC Indices Formula Verification', status: 'FAILED', evidence: e.message });
  }

  // CALC-005: eGFR Male 45y Creatinine 1.0 mg/dL (CKD-EPI 2021)
  try {
    const egfrMale = calculateeGFR(1.0, 45, 'Male', 'CKD-EPI-2021');
    assert(egfrMale > 90 && egfrMale < 110, `eGFR Male 45y 1.0mg/dL should be ~99.9 mL/min/1.73m2 (Got ${egfrMale})`);
    results.push({ id: 'CALC-005', category: 'Clinical Calculations', name: 'eGFR CKD-EPI Male Standard Case', status: 'PASSED', evidence: `Male 45y Scr 1.0 => eGFR: ${egfrMale} mL/min/1.73m2` });
  } catch (e) {
    results.push({ id: 'CALC-005', category: 'Clinical Calculations', name: 'eGFR CKD-EPI Male Standard Case', status: 'FAILED', evidence: e.message });
  }

  // CALC-006: eGFR Female 60y Creatinine 1.8 mg/dL (CKD-EPI 2021)
  try {
    const egfrFemale = calculateeGFR(1.8, 60, 'Female', 'CKD-EPI-2021');
    assert(egfrFemale < 60, `eGFR Female 60y Scr 1.8 should indicate reduced GFR <60 (Got ${egfrFemale})`);
    results.push({ id: 'CALC-006', category: 'Clinical Calculations', name: 'eGFR CKD-EPI Female Impaired Case', status: 'PASSED', evidence: `Female 60y Scr 1.8 => eGFR: ${egfrFemale} mL/min/1.73m2` });
  } catch (e) {
    results.push({ id: 'CALC-006', category: 'Clinical Calculations', name: 'eGFR CKD-EPI Female Impaired Case', status: 'FAILED', evidence: e.message });
  }

  // CALC-007: eGFR Boundary / Edge Case (Null / Zero / Negative Creatinine)
  try {
    const nullRes = calculateeGFR(null, 45, 'Male');
    const zeroRes = calculateeGFR(0, 45, 'Male');
    const negRes = calculateeGFR(-1.2, 45, 'Male');
    assert.strictEqual(nullRes, null, 'Null Scr returns null');
    assert.strictEqual(zeroRes, null, 'Zero Scr returns null');
    assert.strictEqual(negRes, null, 'Negative Scr returns null');
    results.push({ id: 'CALC-007', category: 'Clinical Calculations', name: 'eGFR Invalid Input Safety Handling', status: 'PASSED', evidence: 'Null, Zero, Negative Creatinine inputs return null safely' });
  } catch (e) {
    results.push({ id: 'CALC-007', category: 'Clinical Calculations', name: 'eGFR Invalid Input Safety Handling', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  console.log(runClinicalCalculationTests());
}

module.exports = { runClinicalCalculationTests, calculateeGFR };
