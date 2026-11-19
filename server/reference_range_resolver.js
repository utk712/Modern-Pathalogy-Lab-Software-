// =========================================================================
// server/reference_range_resolver.js - Age & Gender-Based Clinical Reference Range Engine
// Fully compliant with ISO 15189:2022 & NABL Biological Reference Interval standards
// =========================================================================

/**
 * Standardize any patient age and unit into total days
 */
function convertToDays(age, ageType = 'Years') {
  const numericAge = parseFloat(age) || 0;
  const unit = String(ageType).trim().toLowerCase();

  if (unit.startsWith('day')) {
    return Math.max(0, Math.round(numericAge));
  } else if (unit.startsWith('month')) {
    return Math.max(0, Math.round(numericAge * 30.4375));
  } else {
    // Years (default)
    return Math.max(0, Math.round(numericAge * 365.25));
  }
}

/**
 * Default Master Clinical Reference Intervals
 * Covers Neonates (0-28d), Infants (29d-1y), Children (1-12y),
 * Adolescents (12-18y), Adult Males/Females (18-60y), and Geriatric (>60y).
 */
const DEFAULT_REFERENCE_RANGES = [
  // ---------------- HEMOGLOBIN (Hb) ----------------
  {
    id: 'ref-hb-neonate',
    test_id: 'TEST_CBC',
    param_name: 'Hemoglobin',
    param_key: 'hemoglobin',
    gender: 'Both',
    min_age_days: 0,
    max_age_days: 28,
    normal_low: 14.5,
    normal_high: 22.5,
    panic_low: 10.0,
    panic_high: 24.0,
    display_text: '14.5 - 22.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-infant',
    test_id: 'TEST_CBC',
    param_name: 'Hemoglobin',
    param_key: 'hemoglobin',
    gender: 'Both',
    min_age_days: 29,
    max_age_days: 365,
    normal_low: 10.5,
    normal_high: 13.5,
    panic_low: 7.0,
    panic_high: 18.0,
    display_text: '10.5 - 13.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-child',
    test_id: 'TEST_CBC',
    param_name: 'Hemoglobin',
    param_key: 'hemoglobin',
    gender: 'Both',
    min_age_days: 366,
    max_age_days: 4383, // 1 to 12 years
    normal_low: 11.5,
    normal_high: 15.5,
    panic_low: 7.0,
    panic_high: 18.0,
    display_text: '11.5 - 15.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-adol-m',
    test_id: 'TEST_CBC',
    param_name: 'Hemoglobin',
    param_key: 'hemoglobin',
    gender: 'Male',
    min_age_days: 4384,
    max_age_days: 6574, // 12 to 18 years
    normal_low: 13.0,
    normal_high: 16.5,
    panic_low: 7.0,
    panic_high: 20.0,
    display_text: '13.0 - 16.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-adol-f',
    test_id: 'TEST_CBC',
    param_name: 'Hemoglobin',
    param_key: 'hemoglobin',
    gender: 'Female',
    min_age_days: 4384,
    max_age_days: 6574, // 12 to 18 years
    normal_low: 12.0,
    normal_high: 15.5,
    panic_low: 7.0,
    panic_high: 19.0,
    display_text: '12.0 - 15.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-adult-m',
    test_id: 'TEST_CBC',
    param_name: 'Hemoglobin',
    param_key: 'hemoglobin',
    gender: 'Male',
    min_age_days: 6575,
    max_age_days: 21915, // 18 to 60 years
    normal_low: 13.5,
    normal_high: 17.5,
    panic_low: 7.0,
    panic_high: 20.0,
    display_text: '13.5 - 17.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-adult-f',
    test_id: 'TEST_CBC',
    param_name: 'Hemoglobin',
    param_key: 'hemoglobin',
    gender: 'Female',
    min_age_days: 6575,
    max_age_days: 21915, // 18 to 60 years
    normal_low: 12.0,
    normal_high: 15.5,
    panic_low: 7.0,
    panic_high: 19.0,
    display_text: '12.0 - 15.5',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-geriatric-m',
    test_id: 'TEST_CBC',
    param_name: 'Hemoglobin',
    param_key: 'hemoglobin',
    gender: 'Male',
    min_age_days: 21916,
    max_age_days: 36500, // > 60 years
    normal_low: 12.5,
    normal_high: 17.0,
    panic_low: 7.0,
    panic_high: 20.0,
    display_text: '12.5 - 17.0',
    unit: 'g/dL'
  },
  {
    id: 'ref-hb-geriatric-f',
    test_id: 'TEST_CBC',
    param_name: 'Hemoglobin',
    param_key: 'hemoglobin',
    gender: 'Female',
    min_age_days: 21916,
    max_age_days: 36500, // > 60 years
    normal_low: 11.5,
    normal_high: 15.0,
    panic_low: 7.0,
    panic_high: 19.0,
    display_text: '11.5 - 15.0',
    unit: 'g/dL'
  },

  // ---------------- TOTAL WBC COUNT ----------------
  {
    id: 'ref-wbc-neonate',
    test_id: 'TEST_CBC',
    param_name: 'Total W.B.C Count',
    param_key: 'wbc',
    gender: 'Both',
    min_age_days: 0,
    max_age_days: 28,
    normal_low: 9000,
    normal_high: 30000,
    panic_low: 4000,
    panic_high: 35000,
    display_text: '9000 - 30000',
    unit: '/ cumm'
  },
  {
    id: 'ref-wbc-child',
    test_id: 'TEST_CBC',
    param_name: 'Total W.B.C Count',
    param_key: 'wbc',
    gender: 'Both',
    min_age_days: 29,
    max_age_days: 4383,
    normal_low: 5000,
    normal_high: 12000,
    panic_low: 2500,
    panic_high: 30000,
    display_text: '5000 - 12000',
    unit: '/ cumm'
  },
  {
    id: 'ref-wbc-adult',
    test_id: 'TEST_CBC',
    param_name: 'Total W.B.C Count',
    param_key: 'wbc',
    gender: 'Both',
    min_age_days: 4384,
    max_age_days: 36500,
    normal_low: 4000,
    normal_high: 11000,
    panic_low: 2000,
    panic_high: 30000,
    display_text: '4000 - 11000',
    unit: '/ cumm'
  },

  // ---------------- RBC COUNT ----------------
  {
    id: 'ref-rbc-child',
    test_id: 'TEST_CBC',
    param_name: 'R.B.C. Count',
    param_key: 'rbc',
    gender: 'Both',
    min_age_days: 0,
    max_age_days: 6574,
    normal_low: 4.0,
    normal_high: 5.2,
    panic_low: 2.0,
    panic_high: 7.0,
    display_text: '4.0 - 5.2',
    unit: 'mill/cumm'
  },
  {
    id: 'ref-rbc-adult-m',
    test_id: 'TEST_CBC',
    param_name: 'R.B.C. Count',
    param_key: 'rbc',
    gender: 'Male',
    min_age_days: 6575,
    max_age_days: 36500,
    normal_low: 4.5,
    normal_high: 5.9,
    panic_low: 2.5,
    panic_high: 7.5,
    display_text: '4.5 - 5.9',
    unit: 'mill/cumm'
  },
  {
    id: 'ref-rbc-adult-f',
    test_id: 'TEST_CBC',
    param_name: 'R.B.C. Count',
    param_key: 'rbc',
    gender: 'Female',
    min_age_days: 6575,
    max_age_days: 36500,
    normal_low: 4.0,
    normal_high: 5.2,
    panic_low: 2.0,
    panic_high: 7.0,
    display_text: '4.0 - 5.2',
    unit: 'mill/cumm'
  },

  // ---------------- PLATELET COUNT ----------------
  {
    id: 'ref-platelets-all',
    test_id: 'TEST_CBC',
    param_name: 'Platelet Count',
    param_key: 'platelets',
    gender: 'Both',
    min_age_days: 0,
    max_age_days: 36500,
    normal_low: 150000,
    normal_high: 450000,
    panic_low: 40000,
    panic_high: 1000000,
    display_text: '150000 - 450000',
    unit: '/ cumm'
  },

  // ---------------- SERUM CREATININE ----------------
  {
    id: 'ref-creat-child',
    test_id: 'TEST_KFT',
    param_name: 'Serum Creatinine',
    param_key: 'creatinine',
    gender: 'Both',
    min_age_days: 0,
    max_age_days: 4383,
    normal_low: 0.3,
    normal_high: 0.7,
    panic_low: null,
    panic_high: 2.5,
    display_text: '0.3 - 0.7',
    unit: 'mg/dL'
  },
  {
    id: 'ref-creat-adult-m',
    test_id: 'TEST_KFT',
    param_name: 'Serum Creatinine',
    param_key: 'creatinine',
    gender: 'Male',
    min_age_days: 4384,
    max_age_days: 21915,
    normal_low: 0.7,
    normal_high: 1.3,
    panic_low: null,
    panic_high: 4.0,
    display_text: '0.7 - 1.3',
    unit: 'mg/dL'
  },
  {
    id: 'ref-creat-adult-f',
    test_id: 'TEST_KFT',
    param_name: 'Serum Creatinine',
    param_key: 'creatinine',
    gender: 'Female',
    min_age_days: 4384,
    max_age_days: 21915,
    normal_low: 0.5,
    normal_high: 1.1,
    panic_low: null,
    panic_high: 3.5,
    display_text: '0.5 - 1.1',
    unit: 'mg/dL'
  },
  {
    id: 'ref-creat-geriatric-m',
    test_id: 'TEST_KFT',
    param_name: 'Serum Creatinine',
    param_key: 'creatinine',
    gender: 'Male',
    min_age_days: 21916,
    max_age_days: 36500,
    normal_low: 0.8,
    normal_high: 1.4,
    panic_low: null,
    panic_high: 4.0,
    display_text: '0.8 - 1.4',
    unit: 'mg/dL'
  },
  {
    id: 'ref-creat-geriatric-f',
    test_id: 'TEST_KFT',
    param_name: 'Serum Creatinine',
    param_key: 'creatinine',
    gender: 'Female',
    min_age_days: 21916,
    max_age_days: 36500,
    normal_low: 0.6,
    normal_high: 1.2,
    panic_low: null,
    panic_high: 3.5,
    display_text: '0.6 - 1.2',
    unit: 'mg/dL'
  },

  // ---------------- TOTAL BILIRUBIN ----------------
  {
    id: 'ref-bil-tot-neonate',
    test_id: 'TEST_LFT',
    param_name: 'Total Bilirubin',
    param_key: 'totalBilirubin',
    gender: 'Both',
    min_age_days: 0,
    max_age_days: 28,
    normal_low: 1.0,
    normal_high: 12.0,
    panic_low: null,
    panic_high: 15.0,
    display_text: '1.0 - 12.0',
    unit: 'mg/dL'
  },
  {
    id: 'ref-bil-tot-adult',
    test_id: 'TEST_LFT',
    param_name: 'Total Bilirubin',
    param_key: 'totalBilirubin',
    gender: 'Both',
    min_age_days: 29,
    max_age_days: 36500,
    normal_low: 0.2,
    normal_high: 1.2,
    panic_low: null,
    panic_high: 12.0,
    display_text: '0.2 - 1.2',
    unit: 'mg/dL'
  },

  // ---------------- DIRECT BILIRUBIN ----------------
  {
    id: 'ref-bil-dir-all',
    test_id: 'TEST_LFT',
    param_name: 'Direct Bilirubin',
    param_key: 'directBilirubin',
    gender: 'Both',
    min_age_days: 0,
    max_age_days: 36500,
    normal_low: 0.0,
    normal_high: 0.3,
    panic_low: null,
    panic_high: 5.0,
    display_text: '0.0 - 0.3',
    unit: 'mg/dL'
  },

  // ---------------- SGOT (AST) ----------------
  {
    id: 'ref-ast-m',
    test_id: 'TEST_LFT',
    param_name: 'SGOT (AST)',
    param_key: 'ast',
    gender: 'Male',
    min_age_days: 0,
    max_age_days: 36500,
    normal_low: 10,
    normal_high: 40,
    panic_low: null,
    panic_high: 300,
    display_text: '10 - 40',
    unit: 'U/L'
  },
  {
    id: 'ref-ast-f',
    test_id: 'TEST_LFT',
    param_name: 'SGOT (AST)',
    param_key: 'ast',
    gender: 'Female',
    min_age_days: 0,
    max_age_days: 36500,
    normal_low: 9,
    normal_high: 32,
    panic_low: null,
    panic_high: 300,
    display_text: '9 - 32',
    unit: 'U/L'
  },

  // ---------------- SGPT (ALT) ----------------
  {
    id: 'ref-alt-m',
    test_id: 'TEST_LFT',
    param_name: 'SGPT (ALT)',
    param_key: 'alt',
    gender: 'Male',
    min_age_days: 0,
    max_age_days: 36500,
    normal_low: 10,
    normal_high: 50,
    panic_low: null,
    panic_high: 300,
    display_text: '10 - 50',
    unit: 'U/L'
  },
  {
    id: 'ref-alt-f',
    test_id: 'TEST_LFT',
    param_name: 'SGPT (ALT)',
    param_key: 'alt',
    gender: 'Female',
    min_age_days: 0,
    max_age_days: 36500,
    normal_low: 7,
    normal_high: 35,
    panic_low: null,
    panic_high: 300,
    display_text: '7 - 35',
    unit: 'U/L'
  },

  // ---------------- ALKALINE PHOSPHATASE (ALP) ----------------
  {
    id: 'ref-alp-child',
    test_id: 'TEST_LFT',
    param_name: 'Alkaline Phosphatase',
    param_key: 'alp',
    gender: 'Both',
    min_age_days: 0,
    max_age_days: 5844, // 0 - 16 years (growing bones)
    normal_low: 100,
    normal_high: 350,
    panic_low: null,
    panic_high: 800,
    display_text: '100 - 350',
    unit: 'U/L'
  },
  {
    id: 'ref-alp-adult',
    test_id: 'TEST_LFT',
    param_name: 'Alkaline Phosphatase',
    param_key: 'alp',
    gender: 'Both',
    min_age_days: 5845,
    max_age_days: 36500,
    normal_low: 30,
    normal_high: 120,
    panic_low: null,
    panic_high: 500,
    display_text: '30 - 120',
    unit: 'U/L'
  },

  // ---------------- FASTING BLOOD GLUCOSE ----------------
  {
    id: 'ref-fbs-all',
    test_id: 'TEST_GLUCOSE_FBS',
    param_name: 'Fasting Blood Glucose',
    param_key: 'fastingGlucose',
    gender: 'Both',
    min_age_days: 0,
    max_age_days: 36500,
    normal_low: 70,
    normal_high: 100,
    panic_low: 50,
    panic_high: 400,
    display_text: '70 - 100',
    unit: 'mg/dL'
  },

  // ---------------- SERUM POTASSIUM ----------------
  {
    id: 'ref-k-all',
    test_id: 'TEST_ELECTROLYTES',
    param_name: 'Potassium (K+)',
    param_key: 'potassium',
    gender: 'Both',
    min_age_days: 0,
    max_age_days: 36500,
    normal_low: 3.5,
    normal_high: 5.1,
    panic_low: 2.8,
    panic_high: 6.2,
    display_text: '3.5 - 5.1',
    unit: 'mEq/L'
  },

  // ---------------- SERUM SODIUM ----------------
  {
    id: 'ref-na-all',
    test_id: 'TEST_ELECTROLYTES',
    param_name: 'Sodium (Na+)',
    param_key: 'sodium',
    gender: 'Both',
    min_age_days: 0,
    max_age_days: 36500,
    normal_low: 136,
    normal_high: 145,
    panic_low: 120,
    panic_high: 160,
    display_text: '136 - 145',
    unit: 'mEq/L'
  },

  // ---------------- SERUM URIC ACID ----------------
  {
    id: 'ref-uric-m',
    test_id: 'TEST_KFT',
    param_name: 'Serum Uric Acid',
    param_key: 'uricAcid',
    gender: 'Male',
    min_age_days: 0,
    max_age_days: 36500,
    normal_low: 3.5,
    normal_high: 7.2,
    panic_low: null,
    panic_high: 12.0,
    display_text: '3.5 - 7.2',
    unit: 'mg/dL'
  },
  {
    id: 'ref-uric-f',
    test_id: 'TEST_KFT',
    param_name: 'Serum Uric Acid',
    param_key: 'uricAcid',
    gender: 'Female',
    min_age_days: 0,
    max_age_days: 36500,
    normal_low: 2.6,
    normal_high: 6.0,
    panic_low: null,
    panic_high: 12.0,
    display_text: '2.6 - 6.0',
    unit: 'mg/dL'
  },

  // ---------------- TSH (THYROID STIMULATING HORMONE) ----------------
  {
    id: 'ref-tsh-adult',
    test_id: 'TEST_THYROID',
    param_name: 'TSH',
    param_key: 'tsh',
    gender: 'Both',
    min_age_days: 0,
    max_age_days: 36500,
    normal_low: 0.40,
    normal_high: 4.50,
    panic_low: 0.05,
    panic_high: 25.0,
    display_text: '0.40 - 4.50',
    unit: 'µIU/mL'
  }
];

/**
 * Seed Default Reference Ranges into SQLite database if empty or missing
 */
function seedReferenceRanges(database) {
  try {
    const count = database.prepare('SELECT COUNT(*) as count FROM reference_ranges').get().count;
    if (count === 0) {
      const insert = database.prepare(`
        INSERT OR REPLACE INTO reference_ranges (
          id, test_id, param_name, param_key, gender, min_age_days, max_age_days,
          normal_low, normal_high, panic_low, panic_high, display_text, unit
        ) VALUES (
          @id, @test_id, @param_name, @param_key, @gender, @min_age_days, @max_age_days,
          @normal_low, @normal_high, @panic_low, @panic_high, @display_text, @unit
        )
      `);

      const insertMany = database.transaction((ranges) => {
        for (const r of ranges) {
          insert.run(r);
        }
      });

      insertMany(DEFAULT_REFERENCE_RANGES);
      console.log(`[Reference Ranges] Successfully seeded ${DEFAULT_REFERENCE_RANGES.length} clinical reference intervals.`);
    }
  } catch (err) {
    console.error('[Reference Ranges] Error seeding ranges:', err.message);
  }
}

/**
 * Normalize parameter identifier for lookup
 */
function normalizeParamKey(keyOrName) {
  if (!keyOrName) return '';
  return String(keyOrName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Resolve matching biological reference interval for a given parameter, patient gender, and age
 */
function resolveReferenceRange(database, { paramKey, paramName, gender = 'Both', age = 30, ageType = 'Years' }) {
  const ageDays = convertToDays(age, ageType);
  const normalizedGender = String(gender).trim().toLowerCase().startsWith('f')
    ? 'Female'
    : (String(gender).trim().toLowerCase().startsWith('m') ? 'Male' : 'Both');

  const pKey = String(paramKey || '').trim().toLowerCase();
  const pName = String(paramName || '').trim().toLowerCase();

  // Query database for matching ranges sorted by gender specificity (exact gender > Both)
  // and tightest age bracket
  try {
    const rows = database.prepare(`
      SELECT * FROM reference_ranges
      WHERE (
        LOWER(param_key) = ? OR LOWER(param_name) = ? OR
        LOWER(param_key) LIKE ? OR LOWER(param_name) LIKE ?
      )
      AND (gender = ? OR gender = 'Both')
      AND (? BETWEEN min_age_days AND max_age_days)
      ORDER BY 
        CASE WHEN gender = ? THEN 0 ELSE 1 END,
        (max_age_days - min_age_days) ASC
    `).all(
      pKey, pName,
      `%${pKey}%`, `%${pName}%`,
      normalizedGender,
      ageDays,
      normalizedGender
    );

    if (rows && rows.length > 0) {
      return rows[0];
    }
  } catch (err) {
    console.warn('[Reference Ranges] Query error:', err.message);
  }

  // Fallback to in-memory lookup if db query returns no match
  const match = DEFAULT_REFERENCE_RANGES.find(r => {
    const matchKey = normalizeParamKey(r.param_key) === normalizeParamKey(pKey) ||
                     normalizeParamKey(r.param_name) === normalizeParamKey(pName);
    const matchGender = r.gender === 'Both' || r.gender === normalizedGender;
    const matchAge = ageDays >= r.min_age_days && ageDays <= r.max_age_days;
    return matchKey && matchGender && matchAge;
  });

  return match || null;
}

/**
 * Evaluate observed test result value against biological reference range
 * Returns: { flag: 'NORMAL'|'HIGH'|'LOW', isAbnormal: boolean, isPanic: boolean, panicType: 'PANIC_HIGH'|'PANIC_LOW'|null }
 */
function evaluateResultValue(value, refRange) {
  if (value === null || value === undefined || value === '') {
    return { flag: 'NORMAL', isAbnormal: false, isPanic: false, panicType: null };
  }

  const numVal = parseFloat(value);
  if (isNaN(numVal) || !refRange) {
    return { flag: 'NORMAL', isAbnormal: false, isPanic: false, panicType: null };
  }

  let isPanic = false;
  let panicType = null;

  if (refRange.panic_high !== null && refRange.panic_high !== undefined && numVal >= refRange.panic_high) {
    isPanic = true;
    panicType = 'PANIC_HIGH';
  } else if (refRange.panic_low !== null && refRange.panic_low !== undefined && numVal <= refRange.panic_low) {
    isPanic = true;
    panicType = 'PANIC_LOW';
  }

  if (refRange.normal_high !== null && refRange.normal_high !== undefined && numVal > refRange.normal_high) {
    return { flag: 'HIGH', isAbnormal: true, isPanic, panicType };
  } else if (refRange.normal_low !== null && refRange.normal_low !== undefined && numVal < refRange.normal_low) {
    return { flag: 'LOW', isAbnormal: true, isPanic, panicType };
  }

  return { flag: 'NORMAL', isAbnormal: false, isPanic, panicType };
}

module.exports = {
  convertToDays,
  DEFAULT_REFERENCE_RANGES,
  seedReferenceRanges,
  resolveReferenceRange,
  evaluateResultValue,
  normalizeParamKey
};
