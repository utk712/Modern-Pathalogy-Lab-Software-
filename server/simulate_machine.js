// ========================================================
// simulate_machine.js - ASTM 1394 / HL7 Machine Simulation Tool
// ========================================================

const http = require('http');

const samplePayload = JSON.stringify({
  machineName: 'Mindray BC-5000 5-Part Auto Hematology Analyzer',
  barcode: 'LAB-2026-0801'
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/machines/simulate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(samplePayload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n======================================================');
    console.log('🤖 ASTM 1394-97 Machine Data Transmission Simulated!');
    console.log('======================================================\n');
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (err) => {
  console.error('❌ Machine Simulation failed:', err.message);
});

req.write(samplePayload);
req.end();
