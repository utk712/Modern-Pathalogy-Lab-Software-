// =========================================================================
// server/backup_service.js - Automated Encrypted Backup Service
// Uses SQLite WAL online backup API + AES-256-GCM encryption.
// Safe point-in-time snapshots with zero locking, zero corruption risk.
// =========================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { db, SQLITE_FILE } = require('./sqlite_db.js');

// Master backup encryption key derivation salt
const BACKUP_ENCRYPTION_SECRET = process.env.LIMS_BACKUP_SECRET || 'PULSE_LIMS_BACKUP_SECURE_ENCRYPTION_KEY_2026';

/**
 * Derives a 32-byte AES key from the secret
 */
function getBackupKey() {
  return crypto.scryptSync(BACKUP_ENCRYPTION_SECRET, 'lims_backup_salt_2026', 32);
}

/**
 * Resolves safe backup destination directory
 * Priority: D:\LabBackups\ -> C:\ModernLIMS_Backups\ -> <server>/backups/
 */
function resolveBackupDirectory() {
  const preferredDirs = [
    path.join('D:', 'LabBackups'),
    path.join('C:', 'ModernLIMS_Backups'),
    path.join(__dirname, 'backups')
  ];

  for (const dir of preferredDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const testFile = path.join(dir, '.perm_test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return dir;
    } catch (_) {
      // Continue to next directory candidate
    }
  }

  const fallback = path.join(__dirname, 'backups');
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

const BACKUP_DIR = resolveBackupDirectory();

/**
 * Encrypts a buffer using AES-256-GCM
 */
function encryptBuffer(buffer) {
  const key = getBackupKey();
  const iv = crypto.randomBytes(12); // GCM recommended 96-bit IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16-byte authentication tag

  // Output format: [12 bytes IV] + [16 bytes Tag] + [Encrypted Payload]
  return Buffer.concat([iv, tag, encrypted]);
}

/**
 * Decrypts an AES-256-GCM encrypted backup buffer
 */
function decryptBuffer(encryptedBuffer) {
  const key = getBackupKey();
  const iv = encryptedBuffer.subarray(0, 12);
  const tag = encryptedBuffer.subarray(12, 28);
  const data = encryptedBuffer.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(data), decipher.final()]);
}

/**
 * Performs a point-in-time online SQLite backup, encrypts it, and saves to BACKUP_DIR
 */
async function performDailyBackup() {
  try {
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const tempSnapshot = path.join(BACKUP_DIR, `lims_temp_${Date.now()}.sqlite`);
    const finalEncryptedFile = path.join(BACKUP_DIR, `lims_backup_${dateStr}.sqlite.enc`);

    // 1. Safe SQLite online backup without blocking active transactions
    await db.backup(tempSnapshot);

    // 2. Read snapshot & Encrypt with AES-256-GCM
    const snapshotBytes = fs.readFileSync(tempSnapshot);
    const encryptedBytes = encryptBuffer(snapshotBytes);

    fs.writeFileSync(finalEncryptedFile, encryptedBytes);
    fs.unlinkSync(tempSnapshot); // Delete unencrypted temp snapshot

    console.log(`[Backup Service] Created AES-256-GCM encrypted snapshot: ${finalEncryptedFile} (${encryptedBytes.length} bytes)`);

    // 3. Prune backups older than 30 days
    pruneOldBackups();

    return {
      success: true,
      backupFile: finalEncryptedFile,
      filename: path.basename(finalEncryptedFile),
      sizeBytes: encryptedBytes.length,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('[Backup Service] Backup failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Deletes backups older than 30 days
 */
function pruneOldBackups(retentionDays = 30) {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

    for (const f of files) {
      if (f.endsWith('.sqlite.enc') || f.endsWith('.json')) {
        const fullPath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(fullPath);
          console.log(`[Backup Service] Pruned old backup: ${f}`);
        }
      }
    }
  } catch (err) {
    console.warn('[Backup Service] Prune warning:', err.message);
  }
}

/**
 * Lists all existing encrypted backups
 */
function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    return fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sqlite.enc') || f.endsWith('.json'))
      .map(f => {
        const full = path.join(BACKUP_DIR, f);
        const stat = fs.statSync(full);
        return {
          filename: f,
          path: full,
          sizeBytes: stat.size,
          encrypted: f.endsWith('.sqlite.enc'),
          createdAt: stat.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (err) {
    return [];
  }
}

/**
 * Restores and verifies a backup file (decrypts and runs integrity_check)
 */
function verifyBackupIntegrity(backupFilename) {
  try {
    const fullPath = path.join(BACKUP_DIR, backupFilename);
    if (!fs.existsSync(fullPath)) return { valid: false, error: 'File not found' };

    const encryptedData = fs.readFileSync(fullPath);
    const decryptedBytes = decryptBuffer(encryptedData);

    // Write to a temporary file to run SQLite integrity_check
    const testFile = path.join(BACKUP_DIR, `temp_verify_${Date.now()}.sqlite`);
    fs.writeFileSync(testFile, decryptedBytes);

    const testDb = new (require('better-sqlite3'))(testFile, { readonly: true });
    const check = testDb.pragma('integrity_check', { simple: true });
    testDb.close();
    fs.unlinkSync(testFile);

    return {
      valid: check === 'ok',
      status: check,
      sizeBytes: decryptedBytes.length
    };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

module.exports = {
  performDailyBackup,
  listBackups,
  verifyBackupIntegrity,
  pruneOldBackups,
  BACKUP_DIR
};
