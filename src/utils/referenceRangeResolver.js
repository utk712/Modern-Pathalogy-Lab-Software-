/**
 * 🏥 Modern Diagnostic LIMS - Biological Reference Range Resolver (Client)
 * NABL & ISO 15189:2022 Biological Reference Interval Dynamic Engine
 * Resolves age and gender-adjusted normal and critical (panic) intervals.
 */

export function convertToDays(age, ageType = 'Years') {
  const numericAge = parseFloat(age) || 0;
  const unit = String(ageType || '').trim().toLowerCase();

  if (unit.startsWith('day')) {
    return Math.max(0, Math.round(numericAge));
  } else if (unit.startsWith('month')) {
    return Math.max(0, Math.round(numericAge * 30.4375));
  } else {
    // Years
    return Math.max(0, Math.round(numericAge * 365.25));
  }
}

export function normalizeParamKey(keyOrName) {
  if (!keyOrName) return '';
  return String(keyOrName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export const CLIENT_REFERENCE_RANGES = [
  // ---------------- HEMOGLOBIN (Hb) ----------------
  {
    id: 'ref-hb-neonate',
    testId: 'TEST_CBC',
    paramName: 'Hemoglobin',
    paramKeys: ['hemoglobin', 'hb', 'hgb', 'test_cbc_hemoglobin', 'test_cbc_hb'],
    gender: 'Both',
    minAgeDays: 0,
    maxAgeDays: 28,
    normalLow: 14.5,
    normalHigh: 22.5,
    panicLow: 10.0,
    panicHigh: 24.0,
    displayText: '14.5 - 22.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-infant',
    testId: 'TEST_CBC',
    paramName: 'Hemoglobin',
    paramKeys: ['hemoglobin', 'hb', 'hgb', 'test_cbc_hemoglobin', 'test_cbc_hb'],
    gender: 'Both',
    minAgeDays: 29,
    maxAgeDays: 365,
    normalLow: 10.5,
    normalHigh: 13.5,
    panicLow: 7.0,
    panicHigh: 18.0,
    displayText: '10.5 - 13.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-child',
    testId: 'TEST_CBC',
    paramName: 'Hemoglobin',
    paramKeys: ['hemoglobin', 'hb', 'hgb', 'test_cbc_hemoglobin', 'test_cbc_hb'],
    gender: 'Both',
    minAgeDays: 366,
    maxAgeDays: 4383, // 1 to 12 y
    normalLow: 11.5,
    normalHigh: 15.5,
    panicLow: 7.0,
    panicHigh: 18.0,
    displayText: '11.5 - 15.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-adol-m',
    testId: 'TEST_CBC',
    paramName: 'Hemoglobin',
    paramKeys: ['hemoglobin', 'hb', 'hgb', 'test_cbc_hemoglobin', 'test_cbc_hb'],
    gender: 'Male',
    minAgeDays: 4384,
    maxAgeDays: 6574, // 12 to 18 y
    normalLow: 13.0,
    normalHigh: 16.5,
    panicLow: 7.0,
    panicHigh: 20.0,
    displayText: '13.0 - 16.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-adol-f',
    testId: 'TEST_CBC',
    paramName: 'Hemoglobin',
    paramKeys: ['hemoglobin', 'hb', 'hgb', 'test_cbc_hemoglobin', 'test_cbc_hb'],
    gender: 'Female',
    minAgeDays: 4384,
    maxAgeDays: 6574,
    normalLow: 12.0,
    normalHigh: 15.5,
    panicLow: 7.0,
    panicHigh: 19.0,
    displayText: '12.0 - 15.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-adult-m',
    testId: 'TEST_CBC',
    paramName: 'Hemoglobin',
    paramKeys: ['hemoglobin', 'hb', 'hgb', 'test_cbc_hemoglobin', 'test_cbc_hb'],
    gender: 'Male',
    minAgeDays: 6575,
    maxAgeDays: 21915, // 18 to 60 y
    normalLow: 13.5,
    normalHigh: 17.5,
    panicLow: 7.0,
    panicHigh: 20.0,
    displayText: '13.5 - 17.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-adult-f',
    testId: 'TEST_CBC',
    paramName: 'Hemoglobin',
    paramKeys: ['hemoglobin', 'hb', 'hgb', 'test_cbc_hemoglobin', 'test_cbc_hb'],
    gender: 'Female',
    minAgeDays: 6575,
    maxAgeDays: 21915,
    normalLow: 12.0,
    normalHigh: 15.5,
    panicLow: 7.0,
    panicHigh: 19.0,
    displayText: '12.0 - 15.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-geriatric-m',
    testId: 'TEST_CBC',
    paramName: 'Hemoglobin',
    paramKeys: ['hemoglobin', 'hb', 'hgb', 'test_cbc_hemoglobin', 'test_cbc_hb'],
    gender: 'Male',
    minAgeDays: 21916,
    maxAgeDays: 36500, // > 60 y
    normalLow: 12.5,
    normalHigh: 17.0,
    panicLow: 7.0,
    panicHigh: 20.0,
    displayText: '12.5 - 17.0',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-geriatric-f',
    testId: 'TEST_CBC',
    paramName: 'Hemoglobin',
    paramKeys: ['hemoglobin', 'hb', 'hgb', 'test_cbc_hemoglobin', 'test_cbc_hb'],
    gender: 'Female',
    minAgeDays: 21916,
    maxAgeDays: 36500,
    normalLow: 11.5,
    normalHigh: 15.0,
    panicLow: 7.0,
    panicHigh: 19.0,
    displayText: '11.5 - 15.0',
    unit: 'g/dL'
  },

  // ---------------- TOTAL WBC COUNT ----------------
  {
    id: 'ref-wbc-neonate',
    testId: 'TEST_CBC',
    paramName: 'Total W.B.C Count',
    paramKeys: ['totalwbccount', 'wbc', 'totalwbc', 'test_cbc_wbc', 'test_cbc_total_wbc_count'],
    gender: 'Both',
    minAgeDays: 0,
    maxAgeDays: 28,
    normalLow: 9000,
    normalHigh: 30000,
    panicLow: 4000,
    panicHigh: 35000,
    displayText: '9000 - 30000',
    unit: '/ cumm'
  },
  {
    id: 'ref-wbc-child',
    testId: 'TEST_CBC',
    paramName: 'Total W.B.C Count',
    paramKeys: ['totalwbccount', 'wbc', 'totalwbc', 'test_cbc_wbc', 'test_cbc_total_wbc_count'],
    gender: 'Both',
    minAgeDays: 29,
    maxAgeDays: 4383,
    normalLow: 5000,
    normalHigh: 12000,
    panicLow: 2500,
    panicHigh: 30000,
    displayText: '5000 - 12000',
    unit: '/ cumm'
  },
  {
    id: 'ref-wbc-adult',
    testId: 'TEST_CBC',
    paramName: 'Total W.B.C Count',
    paramKeys: ['totalwbccount', 'wbc', 'totalwbc', 'test_cbc_wbc', 'test_cbc_total_wbc_count'],
    gender: 'Both',
    minAgeDays: 4384,
    maxAgeDays: 36500,
    normalLow: 4000,
    normalHigh: 11000,
    panicLow: 2000,
    panicHigh: 30000,
    displayText: '4000 - 11000',
    unit: '/ cumm'
  },

  // ---------------- RBC COUNT ----------------
  {
    id: 'ref-rbc-child',
    testId: 'TEST_CBC',
    paramName: 'R.B.C. Count',
    paramKeys: ['rbccount', 'rbc', 'test_cbc_rbc', 'test_cbc_r_b_c_count'],
    gender: 'Both',
    minAgeDays: 0,
    maxAgeDays: 6574,
    normalLow: 4.0,
    normalHigh: 5.2,
    panicLow: 2.0,
    panicHigh: 7.0,
    displayText: '4.0 - 5.2',
    unit: 'mill/cumm'
  },
  {
    id: 'ref-rbc-adult-m',
    testId: 'TEST_CBC',
    paramName: 'R.B.C. Count',
    paramKeys: ['rbccount', 'rbc', 'test_cbc_rbc', 'test_cbc_r_b_c_count'],
    gender: 'Male',
    minAgeDays: 6575,
    maxAgeDays: 36500,
    normalLow: 4.5,
    normalHigh: 5.9,
    panicLow: 2.5,
    panicHigh: 7.5,
    displayText: '4.5 - 5.9',
    unit: 'mill/cumm'
  },
  {
    id: 'ref-rbc-adult-f',
    testId: 'TEST_CBC',
    paramName: 'R.B.C. Count',
    paramKeys: ['rbccount', 'rbc', 'test_cbc_rbc', 'test_cbc_r_b_c_count'],
    gender: 'Female',
    minAgeDays: 6575,
    maxAgeDays: 36500,
    normalLow: 4.0,
    normalHigh: 5.2,
    panicLow: 2.0,
    panicHigh: 7.0,
    displayText: '4.0 - 5.2',
    unit: 'mill/cumm'
  },

  // ---------------- PLATELET COUNT ----------------
  {
    id: 'ref-platelets-all',
    testId: 'TEST_CBC',
    paramName: 'Platelet Count',
    paramKeys: ['plateletcount', 'platelets', 'plt', 'test_cbc_platelets', 'test_cbc_platelet_count'],
    gender: 'Both',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 150000,
    normalHigh: 450000,
    panicLow: 40000,
    panicHigh: 1000000,
    displayText: '150000 - 450000',
    unit: '/ cumm'
  },

  // ---------------- SERUM CREATININE ----------------
  {
    id: 'ref-creat-child',
    testId: 'TEST_KFT',
    paramName: 'Serum Creatinine',
    paramKeys: ['serumcreatinine', 'creatinine', 'cr', 'test_kft_creatinine', 'test_kft_serum_creatinine'],
    gender: 'Both',
    minAgeDays: 0,
    maxAgeDays: 4383,
    normalLow: 0.3,
    normalHigh: 0.7,
    panicLow: null,
    panicHigh: 2.5,
    displayText: '0.3 - 0.7',
    unit: 'mg/dL'
  },
  {
    id: 'ref-creat-adult-m',
    testId: 'TEST_KFT',
    paramName: 'Serum Creatinine',
    paramKeys: ['serumcreatinine', 'creatinine', 'cr', 'test_kft_creatinine', 'test_kft_serum_creatinine'],
    gender: 'Male',
    minAgeDays: 4384,
    maxAgeDays: 21915,
    normalLow: 0.7,
    normalHigh: 1.3,
    panicLow: null,
    panicHigh: 4.0,
    displayText: '0.7 - 1.3',
    unit: 'mg/dL'
  },
  {
    id: 'ref-creat-adult-f',
    testId: 'TEST_KFT',
    paramName: 'Serum Creatinine',
    paramKeys: ['serumcreatinine', 'creatinine', 'cr', 'test_kft_creatinine', 'test_kft_serum_creatinine'],
    gender: 'Female',
    minAgeDays: 4384,
    maxAgeDays: 21915,
    normalLow: 0.5,
    normalHigh: 1.1,
    panicLow: null,
    panicHigh: 3.5,
    displayText: '0.5 - 1.1',
    unit: 'mg/dL'
  },
  {
    id: 'ref-creat-geriatric-m',
    testId: 'TEST_KFT',
    paramName: 'Serum Creatinine',
    paramKeys: ['serumcreatinine', 'creatinine', 'cr', 'test_kft_creatinine', 'test_kft_serum_creatinine'],
    gender: 'Male',
    minAgeDays: 21916,
    maxAgeDays: 36500,
    normalLow: 0.8,
    normalHigh: 1.4,
    panicLow: null,
    panicHigh: 4.0,
    displayText: '0.8 - 1.4',
    unit: 'mg/dL'
  },
  {
    id: 'ref-creat-geriatric-f',
    testId: 'TEST_KFT',
    paramName: 'Serum Creatinine',
    paramKeys: ['serumcreatinine', 'creatinine', 'cr', 'test_kft_creatinine', 'test_kft_serum_creatinine'],
    gender: 'Female',
    minAgeDays: 21916,
    maxAgeDays: 36500,
    normalLow: 0.6,
    normalHigh: 1.2,
    panicLow: null,
    panicHigh: 3.5,
    displayText: '0.6 - 1.2',
    unit: 'mg/dL'
  },

  // ---------------- TOTAL BILIRUBIN ----------------
  {
    id: 'ref-bil-tot-neonate',
    testId: 'TEST_LFT',
    paramName: 'Total Bilirubin',
    paramKeys: ['totalbilirubin', 'bilirubintotal', 'test_lft_total_bilirubin', 'test_lft_bilirubin_total'],
    gender: 'Both',
    minAgeDays: 0,
    maxAgeDays: 28,
    normalLow: 1.0,
    normalHigh: 12.0,
    panicLow: null,
    panicHigh: 15.0,
    displayText: '1.0 - 12.0',
    unit: 'mg/dL'
  },
  {
    id: 'ref-bil-tot-adult',
    testId: 'TEST_LFT',
    paramName: 'Total Bilirubin',
    paramKeys: ['totalbilirubin', 'bilirubintotal', 'test_lft_total_bilirubin', 'test_lft_bilirubin_total'],
    gender: 'Both',
    minAgeDays: 29,
    maxAgeDays: 36500,
    normalLow: 0.2,
    normalHigh: 1.2,
    panicLow: null,
    panicHigh: 12.0,
    displayText: '0.2 - 1.2',
    unit: 'mg/dL'
  },

  // ---------------- DIRECT BILIRUBIN ----------------
  {
    id: 'ref-bil-dir-all',
    testId: 'TEST_LFT',
    paramName: 'Direct Bilirubin',
    paramKeys: ['directbilirubin', 'bilirubindirect', 'test_lft_direct_bilirubin', 'test_lft_bilirubin_direct'],
    gender: 'Both',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 0.0,
    normalHigh: 0.3,
    panicLow: null,
    panicHigh: 5.0,
    displayText: '0.0 - 0.3',
    unit: 'mg/dL'
  },

  // ---------------- SGOT (AST) ----------------
  {
    id: 'ref-ast-m',
    testId: 'TEST_LFT',
    paramName: 'SGOT (AST)',
    paramKeys: ['sgot', 'ast', 'sgotast', 'test_lft_sgot', 'test_lft_ast'],
    gender: 'Male',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 10,
    normalHigh: 40,
    panicLow: null,
    panicHigh: 300,
    displayText: '10 - 40',
    unit: 'U/L'
  },
  {
    id: 'ref-ast-f',
    testId: 'TEST_LFT',
    paramName: 'SGOT (AST)',
    paramKeys: ['sgot', 'ast', 'sgotast', 'test_lft_sgot', 'test_lft_ast'],
    gender: 'Female',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 9,
    normalHigh: 32,
    panicLow: null,
    panicHigh: 300,
    displayText: '9 - 32',
    unit: 'U/L'
  },

  // ---------------- SGPT (ALT) ----------------
  {
    id: 'ref-alt-m',
    testId: 'TEST_LFT',
    paramName: 'SGPT (ALT)',
    paramKeys: ['sgpt', 'alt', 'sgptalt', 'test_lft_sgpt', 'test_lft_alt'],
    gender: 'Male',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 10,
    normalHigh: 50,
    panicLow: null,
    panicHigh: 300,
    displayText: '10 - 50',
    unit: 'U/L'
  },
  {
    id: 'ref-alt-f',
    testId: 'TEST_LFT',
    paramName: 'SGPT (ALT)',
    paramKeys: ['sgpt', 'alt', 'sgptalt', 'test_lft_sgpt', 'test_lft_alt'],
    gender: 'Female',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 7,
    normalHigh: 35,
    panicLow: null,
    panicHigh: 300,
    displayText: '7 - 35',
    unit: 'U/L'
  },

  // ---------------- FASTING BLOOD GLUCOSE ----------------
  {
    id: 'ref-fbs-all',
    testId: 'TEST_GLUCOSE_FBS',
    paramName: 'Fasting Blood Glucose',
    paramKeys: ['fastingbloodglucose', 'fastingglucose', 'fbs', 'glucosefasting', 'test_glucose_fbs_val'],
    gender: 'Both',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 70,
    normalHigh: 100,
    panicLow: 50,
    panicHigh: 400,
    displayText: '70 - 100',
    unit: 'mg/dL'
  },

  // ---------------- POTASSIUM (K+) ----------------
  {
    id: 'ref-k-all',
    testId: 'TEST_ELECTROLYTES',
    paramName: 'Potassium (K+)',
    paramKeys: ['potassium', 'k', 'serumpotassium'],
    gender: 'Both',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 3.5,
    normalHigh: 5.1,
    panicLow: 2.8,
    panicHigh: 6.2,
    displayText: '3.5 - 5.1',
    unit: 'mEq/L'
  },

  // ---------------- SODIUM (Na+) ----------------
  {
    id: 'ref-na-all',
    testId: 'TEST_ELECTROLYTES',
    paramName: 'Sodium (Na+)',
    paramKeys: ['sodium', 'na', 'serumsodium'],
    gender: 'Both',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 136,
    normalHigh: 145,
    panicLow: 120,
    panicHigh: 160,
    displayText: '136 - 145',
    unit: 'mEq/L'
  },

  // ---------------- TOTAL CHOLESTEROL ----------------
  {
    id: 'ref-tc-all',
    testId: 'TEST_LIPID',
    paramName: 'Total Cholesterol',
    paramKeys: ['totalcholesterol', 'cholesterol', 'test_lipid_total_cholesterol'],
    gender: 'Both',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 125,
    normalHigh: 200,
    panicLow: null,
    panicHigh: 400,
    displayText: '125 - 200',
    unit: 'mg/dL'
  },

  // ---------------- TRIGLYCERIDES ----------------
  {
    id: 'ref-tg-all',
    testId: 'TEST_LIPID',
    paramName: 'Triglycerides',
    paramKeys: ['triglycerides', 'tg', 'test_lipid_triglycerides'],
    gender: 'Both',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 50,
    normalHigh: 150,
    panicLow: null,
    panicHigh: 500,
    displayText: '50 - 150',
    unit: 'mg/dL'
  },

  // ---------------- HDL CHOLESTEROL ----------------
  {
    id: 'ref-hdl-m',
    testId: 'TEST_LIPID',
    paramName: 'HDL Cholesterol',
    paramKeys: ['hdlcholesterol', 'hdl', 'test_lipid_hdl_cholesterol'],
    gender: 'Male',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 40,
    normalHigh: 60,
    panicLow: 20,
    panicHigh: null,
    displayText: '40 - 60',
    unit: 'mg/dL'
  },
  {
    id: 'ref-hdl-f',
    testId: 'TEST_LIPID',
    paramName: 'HDL Cholesterol',
    paramKeys: ['hdlcholesterol', 'hdl', 'test_lipid_hdl_cholesterol'],
    gender: 'Female',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 50,
    normalHigh: 70,
    panicLow: 25,
    panicHigh: null,
    displayText: '50 - 70',
    unit: 'mg/dL'
  },

  // ---------------- LDL CHOLESTEROL ----------------
  {
    id: 'ref-ldl-all',
    testId: 'TEST_LIPID',
    paramName: 'LDL Cholesterol',
    paramKeys: ['ldlcholesterol', 'ldl', 'test_lipid_ldl_cholesterol'],
    gender: 'Both',
    minAgeDays: 0,
    maxAgeDays: 36500,
    normalLow: 0,
    normalHigh: 100,
    panicLow: null,
    panicHigh: 190,
    displayText: '< 100',
    unit: 'mg/dL'
  }
];

/**
 * Resolves the biological reference range matching a parameter, patient gender, and age
 */
export function resolveClientReferenceRange({ paramKey, paramName, gender = 'Both', age = 30, ageType = 'Years' }) {
  const ageDays = convertToDays(age, ageType);
  const normalizedGender = String(gender || '').trim().toLowerCase().startsWith('f')
    ? 'Female'
    : (String(gender || '').trim().toLowerCase().startsWith('m') ? 'Male' : 'Both');

  const pKey = normalizeParamKey(paramKey);
  const pName = normalizeParamKey(paramName);

  // Filter candidates matching key or name
  const candidates = CLIENT_REFERENCE_RANGES.filter(r => {
    const keyMatch = r.paramKeys.some(k => normalizeParamKey(k) === pKey || normalizeParamKey(k) === pName) ||
                     normalizeParamKey(r.paramName) === pName ||
                     normalizeParamKey(r.paramName) === pKey;
    const genderMatch = r.gender === 'Both' || r.gender === normalizedGender;
    const ageMatch = ageDays >= r.minAgeDays && ageDays <= r.maxAgeDays;
    return keyMatch && genderMatch && ageMatch;
  });

  if (candidates.length === 0) return null;

  // Prefer exact gender match over 'Both'
  candidates.sort((a, b) => {
    if (a.gender === normalizedGender && b.gender !== normalizedGender) return -1;
    if (b.gender === normalizedGender && a.gender !== normalizedGender) return 1;
    return (a.maxAgeDays - a.minAgeDays) - (b.maxAgeDays - b.minAgeDays);
  });

  return candidates[0];
}

/**
 * Evaluates a numeric or string test result against a reference range
 */
export function evaluateClientResultValue(value, refRange) {
  if (value === null || value === undefined || value === '') {
    return { flag: 'NORMAL', isAbnormal: false, isPanic: false, panicType: null, flagLabel: '' };
  }

  const num = parseFloat(value);
  if (isNaN(num) || !refRange) {
    return { flag: 'NORMAL', isAbnormal: false, isPanic: false, panicType: null, flagLabel: '' };
  }

  const low = refRange.normalLow !== undefined ? refRange.normalLow : refRange.normal_low;
  const high = refRange.normalHigh !== undefined ? refRange.normalHigh : refRange.normal_high;
  const pLow = refRange.panicLow !== undefined ? refRange.panicLow : refRange.panic_low;
  const pHigh = refRange.panicHigh !== undefined ? refRange.panicHigh : refRange.panic_high;

  let isPanic = false;
  let panicType = null;

  if (pHigh !== null && pHigh !== undefined && num >= pHigh) {
    isPanic = true;
    panicType = 'PANIC_HIGH';
  } else if (pLow !== null && pLow !== undefined && num <= pLow) {
    isPanic = true;
    panicType = 'PANIC_LOW';
  }

  if (high !== null && high !== undefined && num > high) {
    return {
      flag: 'HIGH',
      isAbnormal: true,
      isPanic,
      panicType,
      flagLabel: isPanic ? '🚨 CRITICAL HIGH' : 'HIGH ▲'
    };
  }

  if (low !== null && low !== undefined && num < low) {
    return {
      flag: 'LOW',
      isAbnormal: true,
      isPanic,
      panicType,
      flagLabel: isPanic ? '🚨 CRITICAL LOW' : 'LOW ▼'
    };
  }

  return {
    flag: 'NORMAL',
    isAbnormal: false,
    isPanic: false,
    panicType: null,
    flagLabel: 'NORMAL'
  };
}
