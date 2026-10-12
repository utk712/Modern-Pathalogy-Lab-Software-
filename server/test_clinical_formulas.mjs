import clinicalFormulas from '../src/utils/clinicalFormulas.js';

const {
  calculateLipidPanel,
  calculateLFT,
  calculateCBC,
  calculateRFT,
  calculateHOMA_IR,
  evaluateCustomFormula
} = clinicalFormulas;

let totalPassed = 0;
let totalFailed = 0;

function assertTest(name, condition, details) {
  if (condition) {
    totalPassed++;
    console.log(`✅ [PASS] ${name} | ${details}`);
  } else {
    totalFailed++;
    console.error(`❌ [FAIL] ${name} | ${details}`);
  }
}

console.log('\n================================================================');
console.log('🧮 AUTOMATED CLINICAL FORMULA ENGINE TEST SUITE');
console.log('================================================================\n');

// 1. LIPID PANEL TEST
const lipid = calculateLipidPanel({ totalCholesterol: 210, hdl: 50, triglycerides: 150 });
assertTest(
  'Lipid Friedewald LDL',
  lipid.ldl === 130.00,
  `Expected LDL 130.00, Got: ${lipid.ldl}`
);
assertTest(
  'Lipid VLDL Calculation',
  lipid.vldl === 30.00,
  `Expected VLDL 30.00, Got: ${lipid.vldl}`
);
assertTest(
  'Lipid Non-HDL Calculation',
  lipid.nonHdl === 160.00,
  `Expected Non-HDL 160.00, Got: ${lipid.nonHdl}`
);
assertTest(
  'Lipid Chol/HDL Ratio',
  lipid.cholHdlRatio === 4.20,
  `Expected Ratio 4.20, Got: ${lipid.cholHdlRatio}`
);

// 2. LFT PANEL TEST
const lft = calculateLFT({ totalBilirubin: 2.4, directBilirubin: 0.8, totalProtein: 7.2, albumin: 4.2 });
assertTest(
  'LFT Indirect Bilirubin',
  lft.indirectBilirubin === 1.60,
  `Expected Indirect Bilirubin 1.60, Got: ${lft.indirectBilirubin}`
);
assertTest(
  'LFT Serum Globulin',
  lft.globulin === 3.00,
  `Expected Globulin 3.00, Got: ${lft.globulin}`
);
assertTest(
  'LFT A/G Ratio',
  lft.agRatio === 1.40,
  `Expected A/G Ratio 1.40, Got: ${lft.agRatio}`
);

// 3. CBC RED CELL INDICES & ANC
const cbc = calculateCBC({ hemoglobin: 14.0, rbc: 4.5, pcv: 42.0, wbc: 8000, neutrophilPct: 60, lymphocytePct: 30 });
assertTest(
  'CBC MCV Calculation',
  cbc.mcv === 93.33,
  `Expected MCV 93.33, Got: ${cbc.mcv}`
);
assertTest(
  'CBC MCH Calculation',
  cbc.mch === 31.11,
  `Expected MCH 31.11, Got: ${cbc.mch}`
);
assertTest(
  'CBC MCHC Calculation',
  cbc.mchc === 33.33,
  `Expected MCHC 33.33, Got: ${cbc.mchc}`
);
assertTest(
  'CBC ANC Calculation',
  cbc.anc === 4800,
  `Expected ANC 4800, Got: ${cbc.anc}`
);

// 4. RFT ANION GAP & eGFR
const rft = calculateRFT({ sodium: 140, chloride: 102, bicarbonate: 24, creatinine: 1.0, age: 50, gender: 'male' });
assertTest(
  'RFT Anion Gap Calculation',
  rft.anionGap === 14.00,
  `Expected Anion Gap 14.00, Got: ${rft.anionGap}`
);
assertTest(
  'RFT eGFR CKD-EPI Calculation',
  rft.egfr > 80 && rft.egfr < 105,
  `Expected Normal eGFR (~94-98), Got: ${rft.egfr}`
);

// 5. HOMA-IR TEST
const homa = calculateHOMA_IR({ fastingGlucose: 100, fastingInsulin: 10 });
assertTest(
  'HOMA-IR Calculation',
  homa === 2.47,
  `Expected HOMA-IR 2.47, Got: ${homa}`
);

// 6. DYNAMIC CUSTOM FORMULA TEST
const customVal = evaluateCustomFormula('{TC} - ({HDL} + ({TG} / 5))', { TC: 200, HDL: 45, TG: 125 });
assertTest(
  'Custom Expression Engine',
  customVal === 130.00,
  `Expected Custom Evaluation 130.00, Got: ${customVal}`
);

console.log('\n================================================================');
console.log(`📊 FORMULA ENGINE QA RESULTS: ${totalPassed} PASSED | ${totalFailed} FAILED`);
console.log('================================================================\n');
