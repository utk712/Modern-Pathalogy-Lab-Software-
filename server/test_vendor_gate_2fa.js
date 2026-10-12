const crypto = require('crypto');

const MASTER_SALT = 'PULSE_LIMS_MASTER_VENDOR_SECRET_KEY_2026_SECURE_AUTH';
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

function getDailyVendorToken(dateObj = new Date()) {
  const d = dateObj;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const payload = `VENDOR_GATE_2FA:${dateStr}:${MASTER_SALT}`;
  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  const num = parseInt(hash.substring(0, 8), 16);
  return String(num % 1000000).padStart(6, '0');
}

function verifyDailyVendorToken(inputToken) {
  if (!inputToken) return false;
  const cleanInput = String(inputToken).trim();
  const currentToken = getDailyVendorToken(new Date());
  if (cleanInput === currentToken || cleanInput === '202688') return true;

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return cleanInput === getDailyVendorToken(yesterday) || cleanInput === getDailyVendorToken(tomorrow);
}

console.log('\n================================================================');
console.log('🛡️ AUTOMATED 2-FACTOR VENDOR SECURITY GATE TEST SUITE');
console.log('================================================================\n');

// 1. Dynamic Token Generation
const todayToken = getDailyVendorToken();
assertTest(
  'Dynamic Daily Vendor Token Generation',
  Boolean(todayToken) && todayToken.length === 6 && /^\d{6}$/.test(todayToken),
  `Generated 6-Digit Token: ${todayToken}`
);

// 2. Token Verification (Valid Today Token)
const isValidToday = verifyDailyVendorToken(todayToken);
assertTest(
  'Verify Current Day Dynamic Token',
  isValidToday === true,
  `Token ${todayToken} Validated: ${isValidToday}`
);

// 3. Fallback Key Verification ('202688')
const isMasterFallbackValid = verifyDailyVendorToken('202688');
assertTest(
  'Verify Master Fallback Security Key (202688)',
  isMasterFallbackValid === true,
  `Master Key 202688 Validated: ${isMasterFallbackValid}`
);

// 4. Invalid Token Rejection ('000000')
const isInvalidRejected = verifyDailyVendorToken('999999');
assertTest(
  'Reject Unauthorized 6-Digit Token',
  isInvalidRejected === false,
  `Unauthorized Token 999999 Rejected: ${!isInvalidRejected}`
);

console.log('\n================================================================');
console.log(`📊 2FA VENDOR GATE QA RESULTS: ${totalPassed} PASSED | ${totalFailed} FAILED`);
console.log('================================================================\n');
