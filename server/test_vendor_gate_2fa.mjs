import licenseCrypto from '../src/utils/licenseCrypto.js';

const { getDailyVendorToken, verifyDailyVendorToken } = licenseCrypto;

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
