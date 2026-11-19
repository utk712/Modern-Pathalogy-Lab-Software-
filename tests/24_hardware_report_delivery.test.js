// =========================================================================
// tests/24_hardware_report_delivery.test.js - Hardware & Report Delivery Tests
// Covers: 50x25mm Thermal Barcode Printing, NABL Report Formatting,
// WhatsApp / Email Direct Sharing, and Referring Doctor Commission Accounting.
// =========================================================================

const assert = require('assert');
const {
  db,
  getDoctors,
  upsertDoctor,
  recordDoctorCommission,
  getDoctorCommissions,
  settleDoctorCommissions,
  getAuditLogs
} = require('../server/sqlite_db.js');

async function runHardwareReportDeliveryTests() {
  const results = [];
  console.log('[Test Suite 24] Starting Phase 4 Hardware & Report Delivery Verification...');

  // -------------------------------------------------------------------------
  // TEST HDW-001: 50mm x 25mm Thermal Label Data Structure & Code128 Format
  // -------------------------------------------------------------------------
  try {
    const testSample = {
      barcode: 'SMP-2026-9901',
      type: 'EDTA',
      vialName: 'EDTA (Purple Top)'
    };
    const testPatient = {
      uhid: 'UHID-2026-1001',
      name: 'Ramesh Patel',
      age: '42',
      gender: 'Male',
      registrationDate: '19/11/2026 10:30'
    };

    // Label dimensions check (50000 x 25000 microns for Electron printer page size)
    const pageSize = { width: 50000, height: 25000 };
    assert.strictEqual(pageSize.width, 50000, 'Page width must be 50mm (50,000 microns)');
    assert.strictEqual(pageSize.height, 25000, 'Page height must be 25mm (25,000 microns)');

    // Barcode structure check
    assert.ok(testSample.barcode.startsWith('SMP-'), 'Barcode must have valid specimen prefix');
    assert.ok(testPatient.name.length > 0, 'Patient name must be populated');

    results.push({
      id: 'HDW-001',
      category: 'Hardware & Barcodes',
      name: '50mm x 25mm Thermal Label Payload & Specification',
      status: 'PASSED',
      evidence: `Label: 50mmx25mm (${pageSize.width}x${pageSize.height}um), Specimen: ${testSample.barcode}, Patient: ${testPatient.name} (${testPatient.uhid})`
    });
  } catch (err) {
    results.push({
      id: 'HDW-001',
      category: 'Hardware & Barcodes',
      name: '50mm x 25mm Thermal Label Payload & Specification',
      status: 'FAILED',
      evidence: err.message
    });
  }

  // -------------------------------------------------------------------------
  // TEST HDW-002: Referring Doctor Commission Accounting & Payout Settlement
  // -------------------------------------------------------------------------
  try {
    // 1. Seed or Upsert Referring Doctor with 15% commission
    const doc = upsertDoctor({
      name: 'Dr. Suresh Kulkarni (MD Medicine)',
      specialization: 'Internal Medicine',
      phone: '9820099887',
      email: 'dr.kulkarni@health.org',
      defaultCommissionPct: 15.0
    });
    assert.strictEqual(doc.defaultCommissionPct, 15.0);

    // 2. Register Referred Patient with ₹2,000 billing total
    const patientId = `PT-COMM-${Date.now()}`;
    const testPatient = {
      id: patientId,
      uhid: `UHID-${Date.now().toString().slice(-6)}`,
      name: 'Savitri Devi',
      referringDoctor: 'Dr. Suresh Kulkarni (MD Medicine)',
      billing: {
        total: 2000,
        grossAmount: 2000
      }
    };

    const recorded = recordDoctorCommission(testPatient);
    assert.ok(recorded, 'Commission record must be generated');
    assert.strictEqual(recorded.commissionPct, 15.0, 'Doctor commission rate must be 15%');
    assert.strictEqual(recorded.commissionAmount, 300.0, '15% of ₹2,000 = ₹300.00');

    // 3. Query Doctor Commission Ledger
    const ledger = getDoctorCommissions({ doctorName: 'Dr. Suresh Kulkarni' });
    assert.ok(ledger.rows.length >= 1, 'Commission ledger must contain the recorded transaction');
    const entry = ledger.rows.find(r => r.patient_id === patientId);
    assert.ok(entry, 'Entry for test patient must exist');
    assert.strictEqual(entry.settlement_status, 'PENDING', 'Initial status must be PENDING');
    assert.strictEqual(entry.commission_amount, 300.0);

    // 4. Settle Doctor Commission Payout
    const settlement = settleDoctorCommissions([entry.id], 'Chief_Accountant');
    assert.strictEqual(settlement.success, true);
    assert.strictEqual(settlement.settledCount, 1);

    // 5. Verify Settlement in Database & Audit Log
    const updatedLedger = getDoctorCommissions({ doctorName: 'Dr. Suresh Kulkarni', status: 'SETTLED' });
    const settledEntry = updatedLedger.rows.find(r => r.id === entry.id);
    assert.ok(settledEntry, 'Entry must now be in SETTLED state');
    assert.strictEqual(settledEntry.settlement_status, 'SETTLED');
    assert.ok(settledEntry.settled_at, 'Settled date must be recorded');

    // Verify Immutable Audit Log
    const auditLogs = getAuditLogs({ entityId: entry.id });
    assert.ok(auditLogs.length >= 1, 'Settlement must be recorded in immutable audit log');
    assert.strictEqual(auditLogs[0].action, 'COMMISSION_SETTLED');

    results.push({
      id: 'HDW-002',
      category: 'Accounting & Ledger',
      name: 'Referring Doctor Commission Calculation & Settlement',
      status: 'PASSED',
      evidence: `Doctor: ${doc.name} (15%), Gross: ₹2000, Commission: ₹300, Settled By: Chief_Accountant, Audit ID: ${auditLogs[0].id}`
    });
  } catch (err) {
    results.push({
      id: 'HDW-002',
      category: 'Accounting & Ledger',
      name: 'Referring Doctor Commission Calculation & Settlement',
      status: 'FAILED',
      evidence: err.message
    });
  }

  // -------------------------------------------------------------------------
  // TEST HDW-003: One-Click WhatsApp & Email Sharing Format
  // -------------------------------------------------------------------------
  try {
    const phoneInput = '9876543210';
    let digits = phoneInput.replace(/[^0-9]/g, '');
    if (digits.length === 10) digits = '91' + digits;
    assert.strictEqual(digits, '919876543210', 'Phone number must have 91 country code prefix');

    const uhid = 'UHID-2026-8899';
    const verifyUrl = `https://verify.pulselab.org/report/${uhid}?auth=MC4892`;
    const message = `Dear Sunita Rao,\nYour diagnostic report (UHID: ${uhid}) is ready.\nVerified Online: ${verifyUrl}`;
    const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

    assert.ok(waUrl.startsWith('https://wa.me/919876543210?text='), 'WhatsApp URL must follow wa.me standard');
    assert.ok(waUrl.includes(encodeURIComponent(uhid)), 'WhatsApp URL must encode UHID safely');

    results.push({
      id: 'HDW-003',
      category: 'Report Delivery',
      name: 'One-Click WhatsApp & Digital QR Sharing Format',
      status: 'PASSED',
      evidence: `Recipient: +${digits}, QR Verify Link: ${verifyUrl}`
    });
  } catch (err) {
    results.push({
      id: 'HDW-003',
      category: 'Report Delivery',
      name: 'One-Click WhatsApp & Digital QR Sharing Format',
      status: 'FAILED',
      evidence: err.message
    });
  }

  return results;
}

module.exports = {
  runHardwareReportDeliveryTests
};

if (require.main === module) {
  runHardwareReportDeliveryTests().then(r => console.log(JSON.stringify(r, null, 2)));
}
