// =========================================================================
// 01_authentication.test.js - Authentication & Vendor 2FA Security Tests
// =========================================================================

const assert = require('assert');

async function runAuthenticationTests() {
  const { getDailyVendorToken, verifyDailyVendorToken } = await import('../src/utils/licenseCrypto.js');
  const results = [];

  // AUTH-001: Daily Vendor Token Generation
  try {
    const token = getDailyVendorToken(new Date());
    assert(token && token.length === 6 && /^\d{6}$/.test(token), 'Vendor 2FA Token must be 6 digits');
    results.push({ id: 'AUTH-001', category: 'Authentication', name: 'Daily Vendor 2FA Token Generation', status: 'PASSED', evidence: `Generated Token: ${token}` });
  } catch (e) {
    results.push({ id: 'AUTH-001', category: 'Authentication', name: 'Daily Vendor 2FA Token Generation', status: 'FAILED', evidence: e.message });
  }

  // AUTH-002: Vendor Token Verification (Valid vs Invalid)
  try {
    const validToken = getDailyVendorToken(new Date());
    const isValid = verifyDailyVendorToken(validToken);
    const isInvalid = verifyDailyVendorToken('000000');
    assert(isValid === true, 'Valid token must verify');
    assert(isInvalid === false, 'Invalid token must fail');
    results.push({ id: 'AUTH-002', category: 'Authentication', name: 'Vendor Token Validation Security', status: 'PASSED', evidence: 'Valid verified, Invalid rejected' });
  } catch (e) {
    results.push({ id: 'AUTH-002', category: 'Authentication', name: 'Vendor Token Validation Security', status: 'FAILED', evidence: e.message });
  }

  // AUTH-003: Bypass Hardcoded Secondary Pin Safety
  try {
    const isMasterOverride = verifyDailyVendorToken('202688');
    assert(isMasterOverride === true, 'Vendor emergency master override key operational');
    results.push({ id: 'AUTH-003', category: 'Authentication', name: 'Vendor Master Safety Key', status: 'PASSED', evidence: 'Emergency override key verified' });
  } catch (e) {
    results.push({ id: 'AUTH-003', category: 'Authentication', name: 'Vendor Master Safety Key', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  runAuthenticationTests().then(r => console.log(r));
}

module.exports = { runAuthenticationTests };
