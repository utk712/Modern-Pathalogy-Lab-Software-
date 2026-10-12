// =========================================================================
// 16_installer_upgrade.test.js - Installer Build & Package Integrity Verification
// =========================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runInstallerUpgradeTests() {
  const results = [];

  // INST-001: Main Electron Process Entry File
  try {
    const mainJsPath = path.join(__dirname, '../main.js');
    assert(fs.existsSync(mainJsPath), 'main.js exists in root');
    const mainCode = fs.readFileSync(mainJsPath, 'utf8');
    assert(mainCode.includes('app.on') || mainCode.includes('BrowserWindow'), 'main.js contains valid Electron window management code');
    results.push({ id: 'INST-001', category: 'Installer & Build', name: 'Electron Main Process Entry Verification', status: 'PASSED', evidence: 'main.js verified with Electron BrowserWindow logic' });
  } catch (e) {
    results.push({ id: 'INST-001', category: 'Installer & Build', name: 'Electron Main Process Entry Verification', status: 'FAILED', evidence: e.message });
  }

  // INST-002: Production Dist Assets Verification
  try {
    const distPath = path.join(__dirname, '../dist');
    const distHtml = path.join(distPath, 'index.html');
    assert(fs.existsSync(distPath), 'dist/ directory exists');
    assert(fs.existsSync(distHtml), 'dist/index.html exists');
    results.push({ id: 'INST-002', category: 'Installer & Build', name: 'Production Vite Assets Verification', status: 'PASSED', evidence: 'dist/index.html bundle verified' });
  } catch (e) {
    results.push({ id: 'INST-002', category: 'Installer & Build', name: 'Production Vite Assets Verification', status: 'FAILED', evidence: e.message });
  }

  // INST-003: Compiled C# Windows Installer Executable Check
  try {
    const setupExePath = 'C:\\Users\\DELL\\OneDrive\\Desktop\\Modern_Diagnostic_LIMS_Setup.exe';
    assert(fs.existsSync(setupExePath), `Installer executable exists at ${setupExePath}`);
    const stats = fs.statSync(setupExePath);
    assert(stats.size > 1000000, `Installer executable size > 1MB (Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    results.push({ id: 'INST-003', category: 'Installer & Build', name: 'Compiled Windows Installer Executable Verification', status: 'PASSED', evidence: `Executable verified: ${(stats.size / 1024 / 1024).toFixed(2)} MB` });
  } catch (e) {
    results.push({ id: 'INST-003', category: 'Installer & Build', name: 'Compiled Windows Installer Executable Verification', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  console.log(runInstallerUpgradeTests());
}

module.exports = { runInstallerUpgradeTests };
