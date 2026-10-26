// =========================================================================
// server/bidirectional_controller.js - ASTM 1381/1394 & HL7 v2.5 Bi-Directional Controller
// Full Outbound Reverse Query Handler (Transmits Patient Test Orders Down the Wire)
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

  return Array.from(new Set(codes)).join('\\');
}

/**
 * Calculates official ASTM E1381 modulo 256 frame checksum.
 */
function calculateASTMChecksum(frameContent) {
  let sum = 0;
  for (let i = 0; i < frameContent.length; i++) {
    sum = (sum + frameContent.charCodeAt(i)) % 256;
  }
  return sum.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Creates an ASTM E1381 compliant frame with <STX>, frame number, content, <ETX>, checksum, and <CR><LF>.
 */
function makeASTMFrame(frameNum, text, isLast = true) {
  const endChar = isLast ? '\x03' : '\x17'; // ETX or ETB
  const payload = `${frameNum % 8}${text}${endChar}`;
  const checksum = calculateASTMChecksum(payload);
  return `\x02${payload}${checksum}\r\n`;
}

/**
 * Checks if raw text is an analyzer query (ASTM Q or HL7 QRY/QBP).
 */
function isAnalyzerQuery(rawText) {
  if (!rawText) return false;
  const isASTMQuery = /[\r\n]Q\|/.test(rawText) || rawText.startsWith('Q|') || rawText.includes('Q|1|');
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

  for (let line of lines) {
    // Strip leading frame sequence number if present (e.g. "2Q|1|..." -> "Q|1|...")
    line = line.replace(/^\d+/, '');

    if (line.startsWith('Q|') || line.includes('|Q|')) {
      const parts = line.split('|');
      const qIdx = parts[0] === 'Q' ? 0 : parts.indexOf('Q');
      const rawBarcode = parts[qIdx + 2] || parts[qIdx + 1] || '';
      const token = rawBarcode.replace(/^\^+/, '').split('^')[0].trim();
      if (token && token.toUpperCase() !== 'ALL') return token;

      for (let i = 1; i < parts.length; i++) {
        const candidate = parts[i].replace(/^\^+/, '').split('^')[0].trim();
        if (candidate && candidate.toUpperCase() !== 'ALL' && candidate.length > 2) {
          return candidate;
        }
      }
      if (token) return token;
    }
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
 * Builds ASTM E1394-97 order download frames.
 */
function buildASTMOrderFrames(patient, barcode) {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
  const safeName = (patient?.name || 'PATIENT').replace(/\s+/g, '^');
  const gender = (patient?.gender || '').toLowerCase().startsWith('f') ? 'F' : 'M';
  const uhid = patient?.uhid || patient?.id || 'UHID-001';
  const testListString = formatTestCodes(patient?.tests || patient?.selectedTests || []);

  const header = `H|\\^&|||LIMS_HOST|||||||P|1|${timestamp}`;
  const pRecord = `P|1||${uhid}||${safeName}|||${gender}|||||${patient?.referringDoctor || 'DIRECT'}`;
  const oRecord = `O|1|${barcode || uhid}||${testListString}|R|${timestamp}|||||A||||||||||||||Q`;
  const lRecord = `L|1|N`;

  const frames = [
    makeASTMFrame(1, header, true),
    makeASTMFrame(2, pRecord, true),
    makeASTMFrame(3, oRecord, true),
    makeASTMFrame(4, lRecord, true)
  ];

  return {
    rawRecords: [header, pRecord, oRecord, lRecord].join('\r\n'),
    frames,
    testCodes: testListString
  };
}

/**
 * Builds HL7 v2.3.1 / v2.5 DSR^Q03 outbound order response frame.
 */
function buildHL7OrderMessage(patient, barcode, originalMsgId = 'MSG001') {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
  const safeName = (patient?.name || 'PATIENT').replace(/\s+/g, '^');
  const gender = (patient?.gender || '').toLowerCase().startsWith('f') ? 'F' : 'M';
  const uhid = patient?.uhid || patient?.id || 'UHID-001';
  const testListString = formatTestCodes(patient?.tests || patient?.selectedTests || []);
  const respMsgId = `RESP${Date.now()}`;

  const segments = [
    `MSH|^~\\&|LIMS|HOST|ANALYZER|LAB|${timestamp}||DSR^Q03|${respMsgId}|P|2.3.1`,
    `MSA|AA|${originalMsgId}|Patient Order Found and Dispatched`,
    `QAK|SR|OK`,
    `PID|1||${uhid}||${safeName}|||${gender}`,
    `OBR|1|${barcode || uhid}||${testListString}|||${timestamp}|||||||||||||||||O`
  ];

  const mllpFrame = `\x0b${segments.join('\r')}\x1c\r`;
  return {
    rawSegments: segments.join('\r'),
    mllpFrame,
    testCodes: testListString
  };
}

/**
 * Core reverse query dispatcher: Transmits outbound test orders down the wire to the analyzer socket.
 */
function dispatchOutboundOrderDownTheWire(socket, patient, barcode, isHL7 = false, originalMsgId = 'MSG001') {
  if (!socket || !socket.writable) {
    console.warn('[BI-DIRECTIONAL CONTROLLER] Socket not writable for outbound dispatch');
    return false;
  }

  if (isHL7) {
    // HL7 Outbound Transmission over MLLP
    const { mllpFrame, testCodes } = buildHL7OrderMessage(patient, barcode, originalMsgId);
    socket.write(mllpFrame);
    console.log(`[BI-DIRECTIONAL CONTROLLER] -> Outbound HL7 DSR^Q03 dispatched for ${barcode} (${testCodes}) down the wire!`);
    return true;
  }

  // ASTM Outbound Transmission (ASTM E1381 / E1394 session)
  const { frames, rawRecords, testCodes } = buildASTMOrderFrames(patient, barcode);
  
  // Transmit ENQ session header
  socket.write('\x05');

  // Transmit frames down the wire
  setTimeout(() => {
    for (const frame of frames) {
      socket.write(frame);
    }
    // Final EOT to close outbound transmission
    socket.write('\x04');
    console.log(`[BI-DIRECTIONAL CONTROLLER] -> Outbound ASTM Orders dispatched for ${barcode} (${testCodes}) down the wire!`);
  }, 100);

  return true;
}

/**
 * Handles incoming query packet, looks up patient, and builds Order download response.
 */
function handleAnalyzerQuery(rawText, db, remoteChannel = 'TCP', socket = null) {
  if (!isAnalyzerQuery(rawText)) return null;

  const barcode = extractQueryBarcode(rawText);
  const isHL7 = rawText.includes('MSH');

  console.log(`[BI-DIRECTIONAL CONTROLLER] Analyzer query received from ${remoteChannel} for Barcode: ${barcode || 'ALL'}`);

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
    const testListString = formatTestCodes(matchedPatient.tests || matchedPatient.selectedTests || []);
    let responsePayload;

    if (isHL7) {
      const hl7Data = buildHL7OrderMessage(matchedPatient, barcode);
      responsePayload = hl7Data.mllpFrame;
    } else {
      const astmData = buildASTMOrderFrames(matchedPatient, barcode);
      responsePayload = `\x05` + astmData.frames.join('') + `\x04`;
    }

    // Transmit down the physical wire if socket provided
    if (socket) {
      dispatchOutboundOrderDownTheWire(socket, matchedPatient, barcode, isHL7);
    }

    const logEntry = {
      queryId: `QRY-${Date.now()}`,
      timestamp: new Date().toISOString(),
      channel: remoteChannel,
      barcode,
      status: 'ORDER_DISPATCHED_DOWN_THE_WIRE',
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
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    cancelResponse = `\x0bMSH|^~\\&|LIMS|HOST|ANALYZER|LAB|${timestamp}||DSR^Q03|${msgId}|P|2.3.1\rMSA|AE|${msgId}|Specimen barcode not found in active worklist\rQAK|NF|NF\r\x1c\r`;
  } else {
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    const hFrame = makeASTMFrame(1, `H|\\^&|||LIMS_HOST|||||||P|1|${timestamp}`);
    const qFrame = makeASTMFrame(2, `Q|1|^${barcode || 'UNKNOWN'}||ALL||||||||X`);
    const lFrame = makeASTMFrame(3, `L|1|N`);
    cancelResponse = `\x05${hFrame}${qFrame}${lFrame}\x04`;
  }

  if (socket && socket.writable) {
    socket.write(cancelResponse);
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
  formatTestCodes,
  makeASTMFrame,
  calculateASTMChecksum,
  buildASTMOrderFrames,
  buildHL7OrderMessage,
  dispatchOutboundOrderDownTheWire
};
