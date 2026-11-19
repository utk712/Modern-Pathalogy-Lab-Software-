// =========================================================================
// 09_license_security.test.js - Backend Cryptographic Licensing & Lockout Tests
// =========================================================================

const assert = require('assert');
const { verifyLicenseKey } = require('../server/license_engine.js');

async function runLicenseSecurityTests() {
  const results = [];

  // SEC-001: Commercial 180-Day Key Verification
  try {
    const validKey = 'LIMS-180D-MODERN-6B7DC6DD-7211-0949-CAB6';
    const ver = verifyLicenseKey('Modern Diagnostic Pathology Lab', validKey);
    assert.strictEqual(ver.valid, true, 'Valid 180-Day key should verify');
    assert(ver.daysRemaining >= 60, 'Days remaining should be positive');
    results.push({
      id: 'SEC-001',
      category: 'Security & Licensing',
      name: 'Commercial Key Backend Cryptographic Verification',
      status: 'PASSED',
      evidence: `Key: ${validKey}, Days: ${ver.daysRemaining}, Expiry: ${ver.formattedExpiry}`
    });
  } catch (e) {
    results.push({ id: 'SEC-001', category: 'Security & Licensing', name: 'Commercial Key Backend Cryptographic Verification', status: 'FAILED', evidence: e.message });
  }

  // SEC-002: Expired License Detection & Instant Lockout Trigger
  try {
    // 60000000 hex is year 2021 (expired)
    const expiredKey = 'LIMS-030D-MODERN-60000000-0000-0000-0000';
    const ver = verifyLicenseKey('Modern Diagnostic Pathology Lab', expiredKey);
    assert.strictEqual(ver.valid, false, 'Expired or invalid key must return valid: false');
    results.push({
      id: 'SEC-002',
      category: 'Security & Licensing',
      name: 'Expired License Lockout Enforcement',
      status: 'PASSED',
      evidence: 'Expired license rejected safely with access denied'
    });
  } catch (e) {
    results.push({ id: 'SEC-002', category: 'Security & Licensing', name: 'Expired License Lockout Enforcement', status: 'FAILED', evidence: e.message });
  }

  // SEC-003: Tampered Cryptographic Signature Rejection
  try {
    const tamperedKey = 'LIMS-180D-MODERN-6B7DC6DD-7211-0949-XXXX';
    const ver = verifyLicenseKey('Modern Diagnostic Pathology Lab', tamperedKey);
    assert.strictEqual(ver.valid, false, 'Tampered signature key must return valid: false');
    assert(ver.error.includes('signature verification failed'), 'Error message must cite signature failure');
    results.push({
      id: 'SEC-003',
      category: 'Security & Licensing',
      name: 'Tampered Signature Rejection Safety',
      status: 'PASSED',
      evidence: 'Tampered HMAC signature rejected safely: ' + ver.error
    });
  } catch (e) {
    results.push({ id: 'SEC-003', category: 'Security & Licensing', name: 'Tampered Signature Rejection Safety', status: 'FAILED', evidence: e.message });
  }

  // SEC-004: Client-Side Bundle Secret Isolation Check
  try {
    const clientUtils = await import('../src/utils/licenseCrypto.js');
    assert.strictEqual(clientUtils.generateLicenseKey, undefined, 'generateLicenseKey must NOT be in client bundle');
    assert.strictEqual(clientUtils.MASTER_SALT, undefined, 'MASTER_SALT must NOT be in client bundle');
    assert.strictEqual(clientUtils.verifyDailyVendorToken, undefined, 'verifyDailyVendorToken backdoor must NOT be in client bundle');
    results.push({
      id: 'SEC-004',
      category: 'Security & Licensing',
      name: 'Client-Side Bundle Secret Isolation',
      status: 'PASSED',
      evidence: 'All key generation and vendor backdoor functions completely removed from client build'
    });
  } catch (e) {
    results.push({ id: 'SEC-004', category: 'Security & Licensing', name: 'Client-Side Bundle Secret Isolation', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  runLicenseSecurityTests().then(r => console.log(r));
}

module.exports = { runLicenseSecurityTests };
