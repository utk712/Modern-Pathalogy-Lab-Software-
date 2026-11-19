/**
 * 🧮 Modern Diagnostic LIMS - Clinical Formula & Dynamic Parameter Engine
 * Evaluates standard NABL clinical pathology mathematical formulas and custom lab formulas.
 */

// 1. LIPID PROFILE PANEL FORMULAS (Friedewald Equation)
export function calculateLipidPanel({ totalCholesterol, hdl, triglycerides }) {
  const tc = parseFloat(totalCholesterol);
  const h = parseFloat(hdl);
  const tg = parseFloat(triglycerides);

  const result = {
    vldl: null,
    ldl: null,
    nonHdl: null,
    cholHdlRatio: null,
    warning: null
  };

  if (!isNaN(tg)) {
    result.vldl = parseFloat((tg / 5).toFixed(2));
    if (tg > 400) {
      result.warning = 'Triglycerides > 400 mg/dL: Friedewald equation for LDL is invalid. Direct LDL assay recommended.';
    }
  }

  if (!isNaN(tc) && !isNaN(h)) {
    result.nonHdl = parseFloat((tc - h).toFixed(2));
    if (h > 0) {
      result.cholHdlRatio = parseFloat((tc / h).toFixed(2));
    }
  }

  if (!isNaN(tc) && !isNaN(h) && !isNaN(tg)) {
    result.ldl = parseFloat((tc - h - (tg / 5)).toFixed(2));
  }

  return result;
}

// 2. LIVER FUNCTION TEST (LFT) FORMULAS
export function calculateLFT({ totalBilirubin, directBilirubin, totalProtein, albumin }) {
  const tb = parseFloat(totalBilirubin);
  const db = parseFloat(directBilirubin);
  const tp = parseFloat(totalProtein);
  const alb = parseFloat(albumin);

  const result = {
    indirectBilirubin: null,
    globulin: null,
    agRatio: null
  };

  if (!isNaN(tb) && !isNaN(db)) {
    result.indirectBilirubin = parseFloat(Math.max(0, tb - db).toFixed(2));
  }

  if (!isNaN(tp) && !isNaN(alb)) {
    const glob = Math.max(0, tp - alb);
    result.globulin = parseFloat(glob.toFixed(2));
    if (glob > 0) {
      result.agRatio = parseFloat((alb / glob).toFixed(2));
    }
  }

  return result;
}

// 3. COMPLETE BLOOD COUNT (CBC) & RED CELL INDICES
export function calculateCBC({ hemoglobin, rbc, pcv, wbc, neutrophilPct, lymphocytePct }) {
  const hb = parseFloat(hemoglobin);
  const rbcVal = parseFloat(rbc);
  const pcvVal = parseFloat(pcv);
  const wbcVal = parseFloat(wbc);
  const neut = parseFloat(neutrophilPct);
  const lymph = parseFloat(lymphocytePct);

  const result = {
    mcv: null,
    mch: null,
    mchc: null,
    anc: null,
    alc: null
  };

  if (!isNaN(pcvVal) && !isNaN(rbcVal) && rbcVal > 0) {
    result.mcv = parseFloat(((pcvVal * 10) / rbcVal).toFixed(2));
  }

  if (!isNaN(hb) && !isNaN(rbcVal) && rbcVal > 0) {
    result.mch = parseFloat(((hb * 10) / rbcVal).toFixed(2));
  }

  if (!isNaN(hb) && !isNaN(pcvVal) && pcvVal > 0) {
    result.mchc = parseFloat(((hb * 100) / pcvVal).toFixed(2));
  }

  if (!isNaN(wbcVal)) {
    if (!isNaN(neut)) {
      result.anc = Math.round(wbcVal * (neut / 100));
    }
    if (!isNaN(lymph)) {
      result.alc = Math.round(wbcVal * (lymph / 100));
    }
  }

  return result;
}

// 4. RENAL FUNCTION TEST (RFT) & ELECTROLYTE FORMULAS
export function calculateRFT({ sodium, chloride, bicarbonate, creatinine, age, gender }) {
  const na = parseFloat(sodium);
  const cl = parseFloat(chloride);
  const hco3 = parseFloat(bicarbonate);
  const cr = parseFloat(creatinine);
  const ageVal = parseFloat(age);

  const result = {
    anionGap: null,
    egfr: null
  };

  if (!isNaN(na) && !isNaN(cl) && !isNaN(hco3)) {
    result.anionGap = parseFloat((na - (cl + hco3)).toFixed(2));
  }

  if (!isNaN(cr) && cr > 0 && !isNaN(ageVal) && ageVal > 0) {
    const isFemale = (gender || '').toLowerCase() === 'female';
    const kappa = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.241 : -0.302;
    const genderMult = isFemale ? 1.012 : 1.0;

    const crRatio = cr / kappa;
    const minVal = Math.min(crRatio, 1);
    const maxVal = Math.max(crRatio, 1);

    const egfrVal = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, ageVal) * genderMult;
    result.egfr = Math.round(egfrVal);
  }

  return result;
}

// 5. METABOLIC FORMULAS (HOMA-IR)
export function calculateHOMA_IR({ fastingGlucose, fastingInsulin }) {
  const glu = parseFloat(fastingGlucose);
  const ins = parseFloat(fastingInsulin);

  if (!isNaN(glu) && !isNaN(ins) && glu > 0 && ins > 0) {
    return parseFloat(((glu * ins) / 405).toFixed(2));
  }
  return null;
}

// 6. DYNAMIC FORMULA EVALUATOR FOR CUSTOM LAB FORMULAS
export function evaluateCustomFormula(formulaStr, valuesMap) {
  try {
    if (!formulaStr || typeof formulaStr !== 'string') return null;

    let expr = formulaStr;
    for (const [key, val] of Object.entries(valuesMap)) {
      const numVal = parseFloat(val);
      if (isNaN(numVal)) return null;
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      expr = expr.replace(regex, numVal);
    }

    if (/[^0-9\.\+\-\*\/\(\)\s]/.test(expr)) {
      return null;
    }

    const evalFn = new Function(`return (${expr});`);
    const val = evalFn();
    return (isNaN(val) || !isFinite(val)) ? null : parseFloat(val.toFixed(2));
  } catch (err) {
    return null;
  }
}

/**
 * 7. AUTOMATIC PARAMETER CALCULATION PIPELINE
 * Evaluates pending patient inputs and calculates all dependent formulas (Lipid, LFT, CBC, RFT).
 * Returns an object with updated values and any clinical warnings.
 */
export function applyAutoCalculations(resultsMap = {}, patientMeta = {}) {
  const updated = { ...resultsMap };
  const warnings = [];

  // Helper to extract value by multiple possible candidate keys
  const getVal = (...keys) => {
    for (const k of keys) {
      if (updated[k] !== undefined && updated[k] !== null && String(updated[k]).trim() !== '') {
        const num = parseFloat(updated[k]);
        if (!isNaN(num)) return num;
      }
    }
    // Try normalized match
    for (const [existingKey, val] of Object.entries(updated)) {
      if (val === undefined || val === null || String(val).trim() === '') continue;
      const cleanKey = existingKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const k of keys) {
        const cleanTarget = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKey.includes(cleanTarget) || cleanTarget.includes(cleanKey)) {
          const num = parseFloat(val);
          if (!isNaN(num)) return num;
        }
      }
    }
    return null;
  };

  // Helper to safely set calculated value in all matching target keys present in results
  const setCalc = (targetKeys, calculatedValue) => {
    if (calculatedValue === null || calculatedValue === undefined || isNaN(calculatedValue)) return;
    const strVal = String(calculatedValue);

    // If any target key already exists in resultsMap, update it
    let matchedAny = false;
    for (const tk of targetKeys) {
      const cleanTarget = tk.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const existingKey of Object.keys(updated)) {
        const cleanExisting = existingKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanTarget === 'ldl' && cleanExisting.includes('vldl')) {
          continue; // Guard against matching ldl inside vldl
        }
        if (cleanExisting === cleanTarget || 
            cleanExisting === `test_${cleanTarget}` ||
            cleanExisting.endsWith(`_${cleanTarget}`) ||
            (cleanTarget.length > 4 && cleanExisting.includes(cleanTarget))) {
          updated[existingKey] = strVal;
          matchedAny = true;
        }
      }
    }

    // Always ensure the canonical short key is present
    if (!matchedAny && targetKeys.length > 0) {
      updated[targetKeys[0]] = strVal;
    }
  };

  // A. LIPID PROFILE
  const tc = getVal('totalCholesterol', 'cholesterol', 'total_cholesterol', 'test_lipid_total_cholesterol');
  const tg = getVal('triglycerides', 'tg', 'test_lipid_triglycerides');
  const hdl = getVal('hdl', 'hdlCholesterol', 'hdl_cholesterol', 'test_lipid_hdl_cholesterol');

  if (tc !== null || tg !== null || hdl !== null) {
    const lipid = calculateLipidPanel({ totalCholesterol: tc, hdl, triglycerides: tg });
    if (lipid.vldl !== null) {
      setCalc(['vldl', 'vldlCholesterol', 'test_lipid_vldl_cholesterol'], lipid.vldl);
    }
    if (lipid.ldl !== null) {
      setCalc(['ldl', 'ldlCholesterol', 'test_lipid_ldl_cholesterol'], lipid.ldl);
    }
    if (lipid.nonHdl !== null) {
      setCalc(['nonHdl', 'non_hdl', 'test_lipid_non_hdl_cholesterol'], lipid.nonHdl);
    }
    if (lipid.cholHdlRatio !== null) {
      setCalc(['cholHdlRatio', 'chol_hdl_ratio', 'test_lipid_total_cholesterol___hdl_ratio'], lipid.cholHdlRatio);
    }
    if (lipid.warning) {
      warnings.push(lipid.warning);
    }
  }

  // B. LIVER FUNCTION TEST (LFT)
  const tb = getVal('totalBilirubin', 'total_bilirubin', 'bilirubin_total', 'test_lft_total_bilirubin');
  const db = getVal('directBilirubin', 'direct_bilirubin', 'bilirubin_direct', 'test_lft_direct_bilirubin');
  const tp = getVal('totalProtein', 'total_protein', 'protein_total', 'test_lft_total_protein');
  const alb = getVal('albumin', 'test_lft_albumin');

  if (tb !== null || db !== null || tp !== null || alb !== null) {
    const lft = calculateLFT({ totalBilirubin: tb, directBilirubin: db, totalProtein: tp, albumin: alb });
    if (lft.indirectBilirubin !== null) {
      setCalc(['indirectBilirubin', 'indirect_bilirubin', 'test_lft_indirect_bilirubin'], lft.indirectBilirubin);
    }
    if (lft.globulin !== null) {
      setCalc(['globulin', 'test_lft_globulin'], lft.globulin);
    }
    if (lft.agRatio !== null) {
      setCalc(['agRatio', 'ag_ratio', 'test_lft_a_g_ratio', 'test_lft_albumin___globulin_ratio'], lft.agRatio);
    }
  }

  // C. COMPLETE BLOOD COUNT (CBC) & INDICES
  const hb = getVal('hemoglobin', 'hb', 'hgb', 'test_cbc_hemoglobin');
  const rbc = getVal('rbc', 'rbcCount', 'r_b_c_count', 'test_cbc_r_b_c_count', 'test_cbc_rbc');
  const pcv = getVal('pcv', 'hct', 'hematocrit', 'test_cbc_hct', 'test_cbc_pcv');
  const wbc = getVal('wbc', 'totalWbc', 'total_wbc', 'test_cbc_total_wbc_count', 'test_cbc_wbc');
  const neut = getVal('neutrophils', 'neutrophil', 'neutrophil_pct', 'test_cbc_neutrophils');
  const lymph = getVal('lymphocytes', 'lymphocyte', 'lymphocyte_pct', 'test_cbc_lymphocytes');

  if (hb !== null || rbc !== null || pcv !== null || wbc !== null) {
    const cbc = calculateCBC({
      hemoglobin: hb,
      rbc,
      pcv,
      wbc,
      neutrophilPct: neut,
      lymphocytePct: lymph
    });

    if (cbc.mcv !== null) setCalc(['mcv', 'test_cbc_mcv'], cbc.mcv);
    if (cbc.mch !== null) setCalc(['mch', 'test_cbc_mch'], cbc.mch);
    if (cbc.mchc !== null) setCalc(['mchc', 'test_cbc_mchc'], cbc.mchc);
    if (cbc.anc !== null) setCalc(['anc', 'test_cbc_absolute_neutrophils_count', 'absolute_neutrophils_count'], cbc.anc);
    if (cbc.alc !== null) setCalc(['alc', 'test_cbc_absolute_lymphocytes_count', 'absolute_lymphocytes_count'], cbc.alc);
  }

  // D. RENAL FUNCTION TEST (RFT / KFT)
  const na = getVal('sodium', 'na', 'serum_sodium');
  const cl = getVal('chloride', 'cl', 'serum_chloride');
  const hco3 = getVal('bicarbonate', 'hco3', 'bicarbonate_hco3');
  const cr = getVal('creatinine', 'serum_creatinine', 'test_kft_serum_creatinine', 'test_kft_creatinine');

  if (na !== null || cl !== null || hco3 !== null || cr !== null) {
    const rft = calculateRFT({
      sodium: na,
      chloride: cl,
      bicarbonate: hco3,
      creatinine: cr,
      age: patientMeta.age || 30,
      gender: patientMeta.gender || 'Male'
    });

    if (rft.anionGap !== null) setCalc(['anionGap', 'anion_gap'], rft.anionGap);
    if (rft.egfr !== null) setCalc(['egfr', 'test_kft_egfr'], rft.egfr);
  }

  return { updated, warnings };
}
