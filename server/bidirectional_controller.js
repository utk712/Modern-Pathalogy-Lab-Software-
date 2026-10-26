// =========================================================================
// server/bidirectional_controller.js - ASTM 1394-97 & HL7 v2.5 Bi-Directional Query Engine
// =========================================================================

/**
 * Maps LIMS test titles and modalities to standard analyzer test battery codes.
 */
const TEST_CODE_MAP = {
  'complete blood count': '^^^CBC',
  'cbc': '^^^CBC',
  'hemogram': '^^^CBC',
  'haemoglobin': '^^^HGB',
  'liver function test': '^^^LFT',
  'lft': '^^^LFT',
  'kidney function test': '^^^KFT',
  'kft': '^^^KFT',
  'lipid profile': '^^^LIPID',
  'thyroid profile': '^^^THYROID',
  'blood sugar - fasting': '^^^GLU_FAST',
  'blood sugar - pp': '^^^GLU_PP',
  'random blood sugar': '^^^GLU_RAND',
  'glucose': '^^^GLU',
  'urine routine': '^^^URINE',
  'pt/inr': '^^^PT_INR',
  'hba1c': '^^^HBA1C'
};

function formatTestCodes(tests) {
  if (!Array.isArray(tests) || tests.length === 0) return '^^^CBC';
  
  const codes = [];
  for (const t of tests) {
    const name = (typeof t === 'string' ? t : (t.name || t.testName || '')).toLowerCase().trim();
    let mapped = null;
    for (const [key, code] of Object.entries(TEST_CODE_MAP)) {
      if (name.includes(key)) {
        mapped = code;
        break;
      }
    }
    codes.push(mapped || `^^^${name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 10)}`);
  }

  // Deduplicate and join with repetition separator \
  return Array.from(new Set(codes)).join('\\');
}

/**
 * Checks if raw text is an analyzer query (ASTM Q or HL7 QRY/QBP).
 */
function isAnalyzerQuery(rawText) {
  if (!rawText) return false;
  const isASTMQuery = /[\r\n]Q\|/.test(rawText) || rawText.startsWith('Q|');
  const isHL7Query = rawText.includes('QRY^') || rawText.includes('QBP^') || rawText.includes('|Q02|') || rawText.includes('|Q11|');
  return isASTMQuery || isHL7Query;
}

/**
 * Extracts queried barcode / sample ID from query frame.
 */
function extractQueryBarcode(rawText) {
  if (!rawText) return null;
  const clean = rawText.replace(/[\x00-\x09\x0b\x0c\x0e-\x1f]/g, '');
  const lines = clean.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // ASTM Q record: Q|1|^SMP-12345||ALL...
    if (line.startsWith('Q|')) {
      const parts = line.split('|');
      const rawBarcode = parts[2] || '';
      const token = rawBarcode.replace(/^\^+/, '').split('^')[0].trim();
      if (token) return token;
    }
    // HL7 QRD / QPD segment
    if (line.startsWith('QRD|') || line.startsWith('QPD|')) {
      const parts = line.split('|');
      for (const p of parts) {
        if (/^[A-Za-z0-9\-_]{4,}$/.test(p) && !p.includes('^')) {
          return p.trim();
        }
      }
    }
  }
  return null;
}

/**
 * Handles incoming query packet, looks up patient, and builds Order download response.
 */
function handleAnalyzerQuery(rawText, db, remoteChannel = 'TCP') {
  if (!isAnalyzerQuery(rawText)) return null;

  const barcode = extractQueryBarcode(rawText);
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
  const isHL7 = rawText.includes('MSH');

  console.log(`[BI-DIRECTIONAL CONTROLLER] Analyzer query received from ${remoteChannel} for Barcode: ${barcode || 'ALL'}`);

  // Find patient in database
  let matchedPatient = null;
  if (barcode && Array.isArray(db.patients)) {
    const target = barcode.toLowerCase().trim();
    const normTarget = target.replace(/[^a-z0-9]/g, '');

    matchedPatient = db.patients.find(p => {
      const pBarcode = (p.barcode || '').toLowerCase().trim();
      const pLabCode = (p.labCode || '').toLowerCase().trim();
      const pUhid = (p.uhid || '').toLowerCase().trim();
      const normBarcode = pBarcode.replace(/[^a-z0-9]/g, '');
      return (
        pBarcode === target ||
        normBarcode === normTarget ||
        (normTarget && normBarcode && (normTarget.includes(normBarcode) || normBarcode.includes(normTarget))) ||
        pLabCode === target ||
        pUhid === target
      );
    });
  }

  // Case 1: Patient Found with Valid Orders
  if (matchedPatient) {
    const patientTests = matchedPatient.tests || matchedPatient.selectedTests || [];
    const testListString = formatTestCodes(patientTests);
    const safeName = (matchedPatient.name || 'PATIENT').replace(/\s+/g, '^');
    const gender = (matchedPatient.gender || '').toLowerCase().startsWith('f') ? 'F' : 'M';
    const uhid = matchedPatient.uhid || matchedPatient.id || 'UHID-001';

    let responsePayload;
    if (isHL7) {
      // HL7 v2.3.1 / v2.5 DSR^Q03 Response Frame
      const msgId = `MSG${Date.now()}`;
      responsePayload = [
        `\x0bMSH|^~\\&|LIMS|HOST|ANALYZER|LAB|${timestamp}||DSR^Q03|${msgId}|P|2.3.1`,
        `MSA|AA|${msgId}|Query Order Processed Successfully`,
        `QAK|SR|OK`,
        `PID|1||${uhid}||${safeName}|||${gender}`,
        `OBR|1|${barcode || uhid}||${testListString}|||${timestamp}|||||||||||||||||O`,
        `\x1c\r`
      ].join('\r');
    } else {
      // ASTM E1394-97 Bi-directional Order Frame
      responsePayload = [
        `\x05`, // ENQ handshake init if needed
        `H|\\^&|||LIMS_HOST|||||||P|1|${timestamp}`,
        `P|1||${uhid}||${safeName}|||${gender}|||||${matchedPatient.referringDoctor || 'DIRECT'}`,
        `O|1|${barcode || uhid}||${testListString}|R|${timestamp}|||||A||||||||||||||Q`,
        `L|1|N`,
        `\x04` // EOT
      ].join('\r\n');
    }

    const logEntry = {
      queryId: `QRY-${Date.now()}`,
      timestamp: new Date().toISOString(),
      channel: remoteChannel,
      barcode,
      status: 'ORDER_DISPATCHED',
      patientId: matchedPatient.id,
      patientName: matchedPatient.name,
      tests: testListString
    };

    if (!db.bidirectional_query_logs) db.bidirectional_query_logs = [];
    db.bidirectional_query_logs.unshift(logEntry);
    if (db.bidirectional_query_logs.length > 50) db.bidirectional_query_logs.pop();

    return {
      isQuery: true,
      found: true,
      barcode,
      patient: matchedPatient,
      testCodes: testListString,
      responsePayload,
      logEntry
    };
  }

  // Case 2: Patient Not Found (Cancel / No Order)
  let cancelResponse;
  if (isHL7) {
    const msgId = `MSG${Date.now()}`;
    cancelResponse = [
      `\x0bMSH|^~\\&|LIMS|HOST|ANALYZER|LAB|${timestamp}||DSR^Q03|${msgId}|P|2.3.1`,
      `MSA|AE|${msgId}|Specimen barcode not found in active worklist`,
      `QAK|NF|NF`,
      `\x1c\r`
    ].join('\r');
  } else {
    // ASTM Q with Termination 'X' (Request cannot be done)
    cancelResponse = [
      `H|\\^&|||LIMS_HOST|||||||P|1|${timestamp}`,
      `Q|1|^${barcode || 'UNKNOWN'}||ALL||||||||X`,
      `L|1|N`,
      `\x04`
    ].join('\r\n');
  }

  return {
    isQuery: true,
    found: false,
    barcode,
    responsePayload: cancelResponse,
    reason: 'Sample barcode not found in active laboratory worklist'
  };
}

module.exports = {
  isAnalyzerQuery,
  extractQueryBarcode,
  handleAnalyzerQuery,
  formatTestCodes
};
