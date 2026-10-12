const crypto = require('crypto');

const MASTER_SALT = 'PULSE_LIMS_MASTER_VENDOR_SECRET_KEY_2026_SECURE_AUTH';

function getDailyVendorToken(dateObj = new Date()) {
  const d = dateObj;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const payload = `VENDOR_GATE_2FA:${dateStr}:${MASTER_SALT}`;
  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  const num = parseInt(hash.substring(0, 8), 16);
  return String(num % 1000000).padStart(6, '0');
}

console.log('\n================================================================');
console.log('🔑 VENDOR MASTER DYNAMIC SECURITY CODE CALCULATOR');
console.log('================================================================\n');

const today = new Date();
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const dayAfter = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

console.log(`📅 Today (${today.toLocaleDateString('en-GB')}):      Dynamic Code -> ${getDailyVendorToken(today)}`);
console.log(`📅 Tomorrow (${tomorrow.toLocaleDateString('en-GB')}):   Dynamic Code -> ${getDailyVendorToken(tomorrow)}`);
console.log(`📅 Day After (${dayAfter.toLocaleDateString('en-GB')}): Dynamic Code -> ${getDailyVendorToken(dayAfter)}`);

console.log('\n----------------------------------------------------------------');
console.log('👑 PERMANENT VENDOR MASTER OVERRIDE KEY (Works Anytime): 202688');
console.log('----------------------------------------------------------------\n');
