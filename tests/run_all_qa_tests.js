// =========================================================================
// run_all_qa_tests.js - Master Test Automation Orchestrator
// Executes all test suites across Authentication, Clinical Calculations, 
// ASTM/HL7 Interoperability, Patient-Result Crossover Safety, Database Backup, 
// Licensing, and Performance.
// =========================================================================

const { runAuthenticationTests } = require('./01_authentication.test.js');
const { runClinicalCalculationTests } = require('./05_clinical_calculations.test.js');
const { runInteropTests } = require('./06_astm_hl7_interop.test.js');
const { runDatabaseBackupTests } = require('./08_database_integrity_backup.test.js');
const { runLicenseSecurityTests } = require('./09_license_security.test.js');
const { runPerformanceTests } = require('./10_performance_benchmark.test.js');

async function main() {
  console.log('========================================================================');
  console.log('🏥 MODERN DIAGNOSTIC LIMS - MASTER TEST AUTOMATION SUITE');
  console.log('========================================================================\n');

  let allResults = [];

  try {
    console.log('▶ Running Authentication & Security Tests...');
    allResults.push(...await runAuthenticationTests());

    console.log('▶ Running Clinical Calculation Verification Tests...');
    allResults.push(...runClinicalCalculationTests());

    console.log('▶ Running ASTM / HL7 Interoperability & Crossover Safety Tests...');
    allResults.push(...runInteropTests());

    console.log('▶ Running Database Integrity & Full Backup/Restore Cycle Tests...');
    allResults.push(...runDatabaseBackupTests());

    console.log('▶ Running Cryptographic Licensing & Lockout Tests...');
    allResults.push(...await runLicenseSecurityTests());

    console.log('▶ Running Performance & Scalability Benchmarking Tests...');
    allResults.push(...runPerformanceTests());

  } catch (err) {
    console.error('CRITICAL TEST RUNNER EXCEPTION:', err);
  }

  console.log('\n========================================================================');
  console.log('📊 DETAILED TEST EXECUTION RESULTS');
  console.log('========================================================================');

  let passedCount = 0;
  let failedCount = 0;

  allResults.forEach(r => {
    if (r.status === 'PASSED') {
      passedCount++;
      console.log(`  ✅ [${r.id}] ${r.category} -> ${r.name}: PASSED`);
      console.log(`     Evidence: ${r.evidence}`);
    } else {
      failedCount++;
      console.log(`  ❌ [${r.id}] ${r.category} -> ${r.name}: FAILED`);
      console.log(`     Evidence: ${r.evidence}`);
    }
  });

  console.log('\n========================================================================');
  console.log(`📈 FINAL AUTOMATION SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${allResults.length})`);
  console.log('========================================================================');

  if (failedCount === 0) {
    console.log('✨ ALL EXECUTED TEST SUITES PASSED CLEANLY WITH ZERO DEFECTS! 🚀\n');
  } else {
    console.error(`⚠️ ${failedCount} TESTS FAILED. PLEASE REVIEW EVIDENCE ABOVE.\n`);
    process.exit(1);
  }
}

main();
