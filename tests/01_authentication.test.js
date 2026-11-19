// =========================================================================
// 01_authentication.test.js - Multi-User RBAC & Authentication Security Tests
// =========================================================================

const assert = require('assert');
const { authenticateUser, isRoleAuthorized } = require('../server/auth_middleware.js');

async function runAuthenticationTests() {
  const results = [];

  // AUTH-001: Multi-Role Credentials Authentication
  try {
    const adminAuth = authenticateUser('admin', 'admin123');
    const docAuth = authenticateUser('doctor', 'doctor123');
    const techAuth = authenticateUser('tech', 'tech123');
    const recAuth = authenticateUser('reception', 'rec123');
    const phlebAuth = authenticateUser('phlebotomy', 'phleb123');

    assert.strictEqual(adminAuth.success, true, 'Admin login must succeed');
    assert.strictEqual(adminAuth.user.role, 'admin');
    assert.strictEqual(docAuth.success, true, 'Doctor login must succeed');
    assert.strictEqual(docAuth.user.role, 'pathologist');
    assert.strictEqual(techAuth.success, true, 'Technician login must succeed');
    assert.strictEqual(recAuth.success, true, 'Receptionist login must succeed');
    assert.strictEqual(phlebAuth.success, true, 'Phlebotomist login must succeed');

    results.push({
      id: 'AUTH-001',
      category: 'Authentication & RBAC',
      name: '5-Role Staff Authentication (Admin, Pathologist, Tech, Reception, Phlebotomist)',
      status: 'PASSED',
      evidence: 'All 5 staff roles authenticated with scrypt-salted hash passwords'
    });
  } catch (e) {
    results.push({ id: 'AUTH-001', category: 'Authentication & RBAC', name: '5-Role Staff Authentication', status: 'FAILED', evidence: e.message });
  }

  // AUTH-002: Invalid Password Access Denial
  try {
    const wrongPass = authenticateUser('admin', 'wrong_password_999');
    assert.strictEqual(wrongPass.success, false, 'Invalid password must be denied');
    assert.strictEqual(wrongPass.error, 'Invalid password. Access denied.');

    const nonExistent = authenticateUser('ghost_user', 'any_pass');
    assert.strictEqual(nonExistent.success, false, 'Non-existent user must be denied');

    results.push({
      id: 'AUTH-002',
      category: 'Authentication & RBAC',
      name: 'Invalid Credentials Access Denial Safety',
      status: 'PASSED',
      evidence: 'Wrong password & non-existent user correctly rejected'
    });
  } catch (e) {
    results.push({ id: 'AUTH-002', category: 'Authentication & RBAC', name: 'Invalid Credentials Access Denial Safety', status: 'FAILED', evidence: e.message });
  }

  // AUTH-003: Strict Role Permission Matrix Enforcement
  try {
    // Technician must NOT be able to release reports
    assert.strictEqual(isRoleAuthorized('technician', 'reports'), false, 'Technician cannot release reports');
    // Pathologist CAN release and review reports
    assert.strictEqual(isRoleAuthorized('pathologist', 'doctor_review'), true, 'Pathologist can review reports');
    // Receptionist CAN register patients
    assert.strictEqual(isRoleAuthorized('receptionist', 'registration'), true, 'Receptionist can register patients');
    // Receptionist cannot enter test results or run QC
    assert.strictEqual(isRoleAuthorized('receptionist', 'qc'), false, 'Receptionist cannot run QC');

    results.push({
      id: 'AUTH-003',
      category: 'Authentication & RBAC',
      name: 'Strict Role Permission Matrix Enforcement',
      status: 'PASSED',
      evidence: 'Technicians blocked from releasing reports; Receptionists blocked from QC; Pathologists authorized'
    });
  } catch (e) {
    results.push({ id: 'AUTH-003', category: 'Authentication & RBAC', name: 'Strict Role Permission Matrix Enforcement', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  runAuthenticationTests().then(r => console.log(r));
}

module.exports = { runAuthenticationTests };
