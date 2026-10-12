// =========================================================================
// 14_analyzer_disconnect_reconnect.test.js - Analyzer Disconnection & Reconnection
// =========================================================================

const assert = require('assert');

class AnalyzerSocketManager {
  constructor(machineId, name) {
    this.machineId = machineId;
    this.name = name;
    this.status = 'OFFLINE';
    this.buffer = [];
    this.receivedCount = 0;
  }

  connect() {
    this.status = 'ONLINE';
    this.flushBuffer();
  }

  disconnect() {
    this.status = 'OFFLINE';
  }

  sendData(astmPayload) {
    if (this.status === 'ONLINE') {
      this.processData(astmPayload);
    } else {
      this.buffer.push(astmPayload);
    }
  }

  flushBuffer() {
    while (this.buffer.length > 0) {
      const payload = this.buffer.shift();
      this.processData(payload);
    }
  }

  processData(payload) {
    this.receivedCount++;
  }
}

function runDisconnectReconnectTests() {
  const results = [];
  const mindray = new AnalyzerSocketManager('M-01', 'Mindray BC-5000');

  // DISCONNECT-001: Machine Offline Message Buffering
  try {
    mindray.disconnect();
    assert.strictEqual(mindray.status, 'OFFLINE', 'Machine marked OFFLINE');

    mindray.sendData('R|1|^^^WBC|7.5|10^3/uL');
    mindray.sendData('R|2|^^^RBC|4.85|10^6/uL');

    assert.strictEqual(mindray.buffer.length, 2, '2 test messages buffered during disconnection');
    assert.strictEqual(mindray.receivedCount, 0, 'No data processed while offline');
    results.push({ id: 'DISCONNECT-001', category: 'Analyzer Interoperability', name: 'Machine Disconnection Message Buffering', status: 'PASSED', evidence: '2 messages buffered safely while machine offline' });
  } catch (e) {
    results.push({ id: 'DISCONNECT-001', category: 'Analyzer Interoperability', name: 'Machine Disconnection Message Buffering', status: 'FAILED', evidence: e.message });
  }

  // RECONNECT-001: Automatic Reconnection & Buffer Flushing
  try {
    mindray.connect();
    assert.strictEqual(mindray.status, 'ONLINE', 'Machine reconnected to ONLINE state');
    assert.strictEqual(mindray.buffer.length, 0, 'Buffer flushed completely');
    assert.strictEqual(mindray.receivedCount, 2, 'Buffered messages processed post-reconnect');
    results.push({ id: 'RECONNECT-001', category: 'Analyzer Interoperability', name: 'Machine Reconnection & Buffer Resync', status: 'PASSED', evidence: 'All 2 buffered messages auto-flushed and processed upon reconnect' });
  } catch (e) {
    results.push({ id: 'RECONNECT-001', category: 'Analyzer Interoperability', name: 'Machine Reconnection & Buffer Resync', status: 'FAILED', evidence: e.message });
  }

  return results;
}

if (require.main === module) {
  console.log(runDisconnectReconnectTests());
}

module.exports = { runDisconnectReconnectTests, AnalyzerSocketManager };
