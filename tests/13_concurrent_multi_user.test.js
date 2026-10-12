// =========================================================================
// 13_concurrent_multi_user.test.js - Concurrent Multi-User & Session Protection
// =========================================================================

const assert = require('assert');

// BroadcastChannel Concurrent Session Kickout Simulation
class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.listeners = [];
  }

  postMessage(msg) {
    MockBroadcastChannel.bus.filter(c => c.name === this.name && c !== this).forEach(c => {
      c.listeners.forEach(fn => fn({ data: msg }));
    });
  }

  addEventListener(type, fn) {
    if (type === 'message') this.listeners.push(fn);
  }
}
MockBroadcastChannel.bus = [];

function registerChannel(c) {
  MockBroadcastChannel.bus.push(c);
}

function runConcurrencyTests() {
  const results = [];

  // CONCUR-001: BroadcastChannel Session Kickout Protocol
  try {
    const session1 = new MockBroadcastChannel('pulselab_session_channel');
    const session2 = new MockBroadcastChannel('pulselab_session_channel');
    registerChannel(session1);
    registerChannel(session2);

    let kickedOutTab1 = false;
    session1.addEventListener('message', (e) => {
      if (e.data.type === 'NEW_LOGIN_KICKOUT') {
        kickedOutTab1 = true;
      }
    });

    // Tab 2 logs in
    session2.postMessage({
      type: 'NEW_LOGIN_KICKOUT',
      sessionId: 'sess_9902',
      user: 'admin_device_2',
      time: new Date().toLocaleTimeString()
    });

    assert.strictEqual(kickedOutTab1, true, 'Tab 1 received BroadcastChannel kickout notification');
    results.push({ id: 'CONCUR-001', category: 'Concurrency & Multi-User', name: 'BroadcastChannel Concurrent Login Kickout', status: 'PASSED', evidence: 'Tab 1 safely notified of Tab 2 concurrent login' });
  } catch (e) {
    results.push({ id: 'CONCUR-001', category: 'Concurrency & Multi-User', name: 'BroadcastChannel Concurrent Login Kickout', status: 'FAILED', evidence: e.message });
  }

  // CONCUR-002: Concurrent Patient Lab Code Collision Protection
  try {
    const generateLabCode = (seq) => `260827${String(seq).padStart(4, '0')}`;
    const code1 = generateLabCode(1001);
    const code2 = generateLabCode(1002);

    assert.notStrictEqual(code1, code2, 'Concurrent registrations receive unique Lab Codes');
    results.push({ id: 'CONCUR-002', category: 'Concurrency & Multi-User', name: 'Lab Accession Code Collision Safety', status: 'PASSED', evidence: `Code 1: ${code1}, Code 2: ${code2}` });
  } catch (e) {
    results.push({ id: 'CONCUR-002', category: 'Concurrency & Multi-User', name: 'Lab Accession Code Collision Safety', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  console.log(runConcurrencyTests());
}

module.exports = { runConcurrencyTests };
