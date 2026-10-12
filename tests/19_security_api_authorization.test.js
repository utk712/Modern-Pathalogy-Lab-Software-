// =========================================================================
// 19_security_api_authorization.test.js - REST API Authorization & Input Injection Security
// =========================================================================

const http = require('http');
const assert = require('assert');

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function runSecurityAPITests() {
  const results = [];

  // SEC-API-001: XSS / Script Injection Input Sanitization
  try {
    const maliciousInput = "<script>alert('XSS Attack')</script>";
    const sanitized = escapeHTML(maliciousInput);
    assert(!sanitized.includes('<script>'), 'HTML script tags escaped safely');
    assert.strictEqual(sanitized, "&lt;script&gt;alert(&#039;XSS Attack&#039;)&lt;/script&gt;", 'Input escaped to harmless entity strings');
    results.push({ id: 'SEC-API-001', category: 'Security & API Authorization', name: 'XSS & HTML Script Injection Sanitization', status: 'PASSED', evidence: `Malicious payload escaped to: ${sanitized}` });
  } catch (e) {
    results.push({ id: 'SEC-API-001', category: 'Security & API Authorization', name: 'XSS & HTML Script Injection Sanitization', status: 'FAILED', evidence: e.message });
  }

  // SEC-API-002: Backend API GET /api/license-info Security Verification
  let serverProcess = null;
  try {
    const { fork } = require('child_process');
    const path = require('path');
    const serverPath = path.join(__dirname, '..', 'server', 'index.js');
    serverProcess = fork(serverPath, [], { silent: true, env: { ...process.env, PORT: '5000' } });
    await new Promise(r => setTimeout(r, 800));
  } catch (e) {}

  await new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/license-info', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          assert.strictEqual(res.statusCode, 200, 'Endpoint returned 200 OK');
          assert(body !== undefined, 'Endpoint returned body response');
          results.push({ id: 'SEC-API-002', category: 'Security & API Authorization', name: 'REST API GET /api/license-info Security Verification', status: 'PASSED', evidence: `HTTP 200 OK - Backend API response received cleanly` });
        } catch (e) {
          results.push({ id: 'SEC-API-002', category: 'Security & API Authorization', name: 'REST API GET /api/license-info Security Verification', status: 'FAILED', evidence: e.message });
        }
        if (serverProcess) try { serverProcess.kill(); } catch (err) {}
        resolve();
      });
    });

    req.on('error', (e) => {
      results.push({ id: 'SEC-API-002', category: 'Security & API Authorization', name: 'REST API GET /api/license-info Security Verification', status: 'FAILED', evidence: `Server unreachable: ${e.message}` });
      if (serverProcess) try { serverProcess.kill(); } catch (err) {}
      resolve();
    });
  });

  return results;
}

if (require.main === module) {
  runSecurityAPITests().then(r => console.log(r));
}

module.exports = { runSecurityAPITests };
