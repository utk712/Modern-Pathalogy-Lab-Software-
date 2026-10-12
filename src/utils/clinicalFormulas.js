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
