// =========================================================================
// server/db.js - Database Facade
// Re-exports the production SQLite WAL database engine (server/sqlite_db.js)
// for seamless backward compatibility across all server controllers.
// =========================================================================

const sqliteDb = require('./sqlite_db.js');
const rangeResolver = require('./reference_range_resolver.js');

module.exports = {
  db: sqliteDb.db,
  getDb: sqliteDb.getDb,
  saveDb: sqliteDb.saveDb,
  saveDbAsync: sqliteDb.saveDbAsync,
  read: sqliteDb.read,
  write: sqliteDb.write,
  logAudit: sqliteDb.logAudit,
  getAuditLogs: sqliteDb.getAuditLogs,
  hashPassword: sqliteDb.hashPassword,
  verifyPassword: sqliteDb.verifyPassword,
  resolveReferenceRange: (params) => rangeResolver.resolveReferenceRange(sqliteDb.db, params),
  evaluateResultValue: rangeResolver.evaluateResultValue,
  seedReferenceRanges: () => rangeResolver.seedReferenceRanges(sqliteDb.db),
  convertToDays: rangeResolver.convertToDays,
  getDoctors: sqliteDb.getDoctors,
  upsertDoctor: sqliteDb.upsertDoctor,
  recordDoctorCommission: sqliteDb.recordDoctorCommission,
  getDoctorCommissions: sqliteDb.getDoctorCommissions,
  settleDoctorCommissions: sqliteDb.settleDoctorCommissions,
  DB_FILE: sqliteDb.SQLITE_FILE,
  LIMS_DATA_DIR: sqliteDb.LIMS_DATA_DIR
};
