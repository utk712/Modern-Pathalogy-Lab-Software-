// =========================================================================
// licenseCrypto.js - Client-Side License Helper
// Secure client-side bridge. All cryptographic verification is enforced
// strictly on the backend Node.js engine and Electron main process.
// =========================================================================

export function normalizeLabName(name) {
  return (name || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
}

/**
 * Validates license format on client before dispatching to backend
 */
export function checkLicenseFormat(licenseKey) {
  if (!licenseKey || typeof licenseKey !== 'string') return false;
  const parts = licenseKey.trim().toUpperCase().split('-');
  return parts.length >= 7 && parts[0] === 'LIMS';
}

/**
 * Client-side format-only check for initial fast UI rendering
 * Complete cryptographic HMAC signature check is enforced by /api/license-verify
 */
export function verifyLicenseKey(labName, licenseKey) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return { valid: false, error: 'Please enter a valid Security License Key.' };
  }

  const cleanKey = licenseKey.trim().toUpperCase();
  const parts = cleanKey.split('-');

  if (parts.length < 7 || parts[0] !== 'LIMS') {
    return { valid: false, error: 'Invalid Security Key format. Please verify your key.' };
  }

  try {
    const expiryHex = parts[3];
    const expiryTimestampMs = parseInt(expiryHex, 16) * 1000;
    const now = Date.now();

    if (isNaN(expiryTimestampMs) || now >= expiryTimestampMs) {
      return {
        valid: false,
        isExpired: true,
        expiryDate: new Date(expiryTimestampMs || 0).toISOString(),
        error: 'Security License has expired. Please contact vendor for renewal key.'
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
      labName: parts[2] || labName,
      daysRemaining,
      totalSecondsRemaining,
      totalMinutesRemaining,
      totalHoursRemaining,
      humanRemaining,
      expiryTimestamp: expiryTimestampMs,
      expiryDate: new Date(expiryTimestampMs).toISOString(),
      formattedExpiry: new Date(expiryTimestampMs).toLocaleString('en-GB'),
      isExpired: false
    };
  } catch (err) {
    return { valid: false, error: 'License verification error: ' + err.message };
  }
}
