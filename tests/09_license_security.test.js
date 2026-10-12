// =========================================================================
// 09_license_security.test.js - Security & Cryptographic Licensing Tests
// =========================================================================

const assert = require('assert');

async function runLicenseSecurityTests() {
  const { generateLicenseKey, verifyLicenseKey } = await import('../src/utils/licenseCrypto.js');
  const results = [];

  // SEC-001: 30-Day Commercial License Verification
  try {
    const lic = generateLicenseKey('Diagnostic Lab', 30);
    const ver = verifyLicenseKey('Diagnostic Lab', lic.licenseKey);
    assert.strictEqual(ver.valid, true, 'Valid 30-Day key should verify');
    assert(ver.daysRemaining >= 29, 'Days remaining should be ~30');
    results.push({ id: 'SEC-001', category: 'Security & Licensing', name: '30-Day Commercial Key Cryptographic Signature', status: 'PASSED', evidence: `Key: ${lic.licenseKey}, Days: ${ver.daysRemaining}` });
  } catch (e) {
    results.push({ id: 'SEC-001', category: 'Security & Licensing', name: '30-Day Commercial Key Cryptographic Signature', status: 'FAILED', evidence: e.message });
  }

  // SEC-002: 2-Minute Rapid Test License Verification & Fast Lockout
  try {
    const lic = generateLicenseKey('Diagnostic Lab', 2, 'minutes');
    const ver = verifyLicenseKey('Diagnostic Lab', lic.licenseKey);
    assert.strictEqual(ver.valid, true, 'Valid 2M key should verify');
    assert(ver.totalSecondsRemaining <= 120, 'Seconds remaining should be <= 120s');
    results.push({ id: 'SEC-002', category: 'Security & Licensing', name: '2-Minute Fast Test License Verification', status: 'PASSED', evidence: `Key: ${lic.licenseKey}, Seconds: ${ver.totalSecondsRemaining}s` });
  } catch (e) {
    results.push({ id: 'SEC-002', category: 'Security & Licensing', name: '2-Minute Fast Test License Verification', status: 'FAILED', evidence: e.message });
  }

  // SEC-003: Expired License Detection & Instant Lockout Trigger
  try {
    const pastTimestamp = Date.now() - 60000; // 1 min ago
    const lic = generateLicenseKey('Diagnostic Lab', 1, 'minutes', pastTimestamp);
    const ver = verifyLicenseKey('Diagnostic Lab', lic.licenseKey);
    assert.strictEqual(ver.valid, false, 'Expired key must return valid: false');
    assert.strictEqual(ver.isExpired, true, 'Expired key must set isExpired: true');
    results.push({ id: 'SEC-003', category: 'Security & Licensing', name: 'Expired License Lockout Enforcement', status: 'PASSED', evidence: 'Expired key rejected safely with isExpired: true' });
  } catch (e) {
    results.push({ id: 'SEC-003', category: 'Security & Licensing', name: 'Expired License Lockout Enforcement', status: 'FAILED', evidence: e.message });
  }

  // SEC-004: Tampered Cryptographic Signature Rejection
  try {
    const lic = generateLicenseKey('Diagnostic Lab', 30);
    const keyParts = lic.licenseKey.split('-');
    keyParts[6] = '9999'; // Tamper signature part 3
    const tamperedKey = keyParts.join('-');
    const ver = verifyLicenseKey('Diagnostic Lab', tamperedKey);
    assert.strictEqual(ver.valid, false, 'Tampered signature key must return valid: false');
    results.push({ id: 'SEC-004', category: 'Security & Licensing', name: 'Tampered Signature Rejection Safety', status: 'PASSED', evidence: 'Tampered HMAC signature rejected safely' });
  } catch (e) {
    results.push({ id: 'SEC-004', category: 'Security & Licensing', name: 'Tampered Signature Rejection Safety', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  runLicenseSecurityTests().then(r => console.log(r));
}

module.exports = { runLicenseSecurityTests };
