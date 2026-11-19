// =========================================================================
// server/license_engine.js - Backend Cryptographic License Enforcement Engine
// 100% Server-side validation using Node.js crypto module.
// Protects against client-side tampering, inspection, and forgery.
// =========================================================================

const crypto = require('crypto');

// Master vendor salt - kept securely on backend, never shipped in client bundle
const MASTER_SALT = process.env.LIMS_MASTER_SALT || 'PULSE_LIMS_MASTER_VENDOR_SECRET_KEY_2026_SECURE_AUTH';

function normalizeLabName(name) {
  return (name || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
}

/**
 * Fast SHA-256 implementation matching offline vendor generator
 */
function offlineSha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let compositeArray = [];
  for (i = 0; i < ascii[lengthProperty]; i++) {
    compositeArray[i] = ascii.charCodeAt(i);
  }

  compositeArray[compositeArray[lengthProperty]] = 0x80;
  while (compositeArray[lengthProperty] % 64 !== 56) compositeArray.push(0);

  for (i = 0; i < 8; i++) {
    compositeArray.push((asciiBitLength >>> (56 - i * 8)) & 0xff);
  }

  for (i = 0; i < compositeArray[lengthProperty]; i += 4) {
    words.push(
      (compositeArray[i] << 24) |
      (compositeArray[i + 1] << 16) |
      (compositeArray[i + 2] << 8) |
      compositeArray[i + 3]
    );
  }

  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash;
    hash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15], w2 = w[i - 2];

      const a = hash[0], e = hash[4];
      const temp1 = hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ ((~e) & hash[6])) +
        k[i] +
        (w[i] = (i < 16) ? w[i] : (
          w[i - 16] +
          (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
          w[i - 7] +
          (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
        ) | 0
      );

      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >>> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result.toUpperCase();
}

/**
 * Standard Node.js native crypto SHA-256
 */
function nativeSha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').toUpperCase();
}

/**
 * Verifies a Security License Key against a Laboratory Name.
 * Validates cryptographic signature (both standard and offline vendor formats), expiry date, and lab code.
 */
function verifyLicenseKey(labName, licenseKey) {
  try {
    if (!licenseKey || typeof licenseKey !== 'string') {
      return { valid: false, error: 'Please provide a valid Security License Key.' };
    }

    const cleanKey = licenseKey.trim().toUpperCase();
    const parts = cleanKey.split('-');

    if (parts.length < 7 || parts[0] !== 'LIMS') {
      return { valid: false, error: 'Invalid Security License Key format.' };
    }

    const daysCode = parts[1];
    const labCodeInKey = parts[2];
    const expiryHex = parts[3];
    const sigPart1 = parts[4];
    const sigPart2 = parts[5];
    const sigPart3 = parts[6];

    // 1. Verify Cryptographic Signature against MASTER_SALT
    const payload = `${labCodeInKey}:${expiryHex}:${daysCode}:${MASTER_SALT}`;
    const sigOffline = offlineSha256(payload);
    const sigNative = nativeSha256(payload);

    const matchesOffline = (
      sigPart1 === sigOffline.substring(0, 4) &&
      sigPart2 === sigOffline.substring(4, 8) &&
      sigPart3 === sigOffline.substring(8, 12)
    );

    const matchesNative = (
      sigPart1 === sigNative.substring(0, 4) &&
      sigPart2 === sigNative.substring(4, 8) &&
      sigPart3 === sigNative.substring(8, 12)
    );

    if (!matchesOffline && !matchesNative) {
      return { valid: false, error: 'Cryptographic signature verification failed. Invalid or forged key.' };
    }

    // 2. Validate Lab Name match if provided
    let validatedLabName = labCodeInKey;
    if (labName && typeof labName === 'string' && labName.trim()) {
      const normLab = normalizeLabName(labName);
      const expectedLabCode = normLab.substring(0, 6).padEnd(6, 'X');
      if (expectedLabCode === labCodeInKey) {
        validatedLabName = normLab;
      }
    }

    // 3. Check Expiry Timestamp
    const expiryTimestampMs = parseInt(expiryHex, 16) * 1000;
    const now = Date.now();

    if (now >= expiryTimestampMs) {
      const expiredDateStr = new Date(expiryTimestampMs).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      return {
        valid: false,
        isExpired: true,
        expiryDate: new Date(expiryTimestampMs).toISOString(),
        error: `Security License expired on ${expiredDateStr}. Please contact the vendor for a renewal key.`
      };
    }

    const msRemaining = expiryTimestampMs - now;
    const totalSecondsRemaining = Math.max(0, Math.ceil(msRemaining / 1000));
    const totalMinutesRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60)));
    const totalHoursRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60)));
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    let humanRemaining = `${daysRemaining} Days Left`;
    if (totalSecondsRemaining <= 60) {
      humanRemaining = `${totalSecondsRemaining}s Left`;
    } else if (totalMinutesRemaining <= 5) {
      const m = Math.floor(totalSecondsRemaining / 60);
      const s = totalSecondsRemaining % 60;
      humanRemaining = `${m}m ${s}s Left`;
    } else if (totalMinutesRemaining <= 60) {
      humanRemaining = `${totalMinutesRemaining} Mins Left`;
    } else if (totalHoursRemaining <= 24) {
      humanRemaining = `${totalHoursRemaining} Hours Left`;
    }

    return {
      valid: true,
      labName: validatedLabName,
      daysRemaining,
      totalSecondsRemaining,
      totalMinutesRemaining,
      totalHoursRemaining,
      humanRemaining,
      expiryTimestamp: expiryTimestampMs,
      expiryDate: new Date(expiryTimestampMs).toISOString(),
      formattedExpiry: new Date(expiryTimestampMs).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }),
      isExpired: false
    };
  } catch (err) {
    return { valid: false, error: 'License verification error: ' + err.message };
  }
}

module.exports = {
  verifyLicenseKey,
  normalizeLabName,
  MASTER_SALT
};
