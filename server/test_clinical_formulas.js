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

// Implementations for direct Node verification
function calculateLipidPanel({ totalCholesterol, hdl, triglycerides }) {
  const tc = parseFloat(totalCholesterol);
  const h = parseFloat(hdl);
  const tg = parseFloat(triglycerides);
  return {
    vldl: parseFloat((tg / 5).toFixed(2)),
    ldl: parseFloat((tc - h - (tg / 5)).toFixed(2)),
    nonHdl: parseFloat((tc - h).toFixed(2)),
    cholHdlRatio: parseFloat((tc / h).toFixed(2))
  };
}

function calculateLFT({ totalBilirubin, directBilirubin, totalProtein, albumin }) {
  const tb = parseFloat(totalBilirubin);
  const db = parseFloat(directBilirubin);
  const tp = parseFloat(totalProtein);
  const alb = parseFloat(albumin);
  const glob = Math.max(0, tp - alb);
  return {
    indirectBilirubin: parseFloat(Math.max(0, tb - db).toFixed(2)),
    globulin: parseFloat(glob.toFixed(2)),
    agRatio: parseFloat((alb / glob).toFixed(2))
  };
}

function calculateCBC({ hemoglobin, rbc, pcv, wbc, neutrophilPct }) {
  const hb = parseFloat(hemoglobin);
  const rbcVal = parseFloat(rbc);
  const pcvVal = parseFloat(pcv);
  const wbcVal = parseFloat(wbc);
  const neut = parseFloat(neutrophilPct);
  return {
    mcv: parseFloat(((pcvVal * 10) / rbcVal).toFixed(2)),
    mch: parseFloat(((hb * 10) / rbcVal).toFixed(2)),
    mchc: parseFloat(((hb * 100) / pcvVal).toFixed(2)),
    anc: Math.round(wbcVal * (neut / 100))
  };
}

function calculateRFT({ sodium, chloride, bicarbonate }) {
  const na = parseFloat(sodium);
  const cl = parseFloat(chloride);
  const hco3 = parseFloat(bicarbonate);
  return { anionGap: parseFloat((na - (cl + hco3)).toFixed(2)) };
}

function calculateHOMA_IR({ fastingGlucose, fastingInsulin }) {
  const glu = parseFloat(fastingGlucose);
  const ins = parseFloat(fastingInsulin);
  return parseFloat(((glu * ins) / 405).toFixed(2));
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
const cbc = calculateCBC({ hemoglobin: 14.0, rbc: 4.5, pcv: 42.0, wbc: 8000, neutrophilPct: 60 });
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

// 4. RFT ANION GAP
const rft = calculateRFT({ sodium: 140, chloride: 102, bicarbonate: 24 });
assertTest(
  'RFT Anion Gap Calculation',
  rft.anionGap === 14.00,
  `Expected Anion Gap 14.00, Got: ${rft.anionGap}`
);

// 5. HOMA-IR TEST
const homa = calculateHOMA_IR({ fastingGlucose: 100, fastingInsulin: 10 });
assertTest(
  'HOMA-IR Calculation',
  homa === 2.47,
  `Expected HOMA-IR 2.47, Got: ${homa}`
);

console.log('\n================================================================');
console.log(`📊 FORMULA ENGINE QA RESULTS: ${totalPassed} PASSED | ${totalFailed} FAILED`);
console.log('================================================================\n');
