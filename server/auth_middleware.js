// =========================================================================
// server/auth_middleware.js - Role-Based Access Control (RBAC) & Session Engine
// Enforces strict permissions across Receptionist, Phlebotomist,
// Lab Technician, Pathologist/Doctor, and System Administrator.
// =========================================================================

const { db, hashPassword, verifyPassword, logAudit } = require('./sqlite_db.js');

// Strict Role Hierarchy & Module Access Definition
const ROLE_PERMISSIONS = {
  admin: [
    'registration', 'billing', 'phlebotomy', 'worklist', 'doctor_review',
    'reports', 'report_designer', 'analyzers', 'qc', 'inventory',
    'b2b', 'settings', 'user_management', 'backups', 'audit_logs'
  ],
  pathologist: [
    'doctor_review', 'reports', 'report_designer', 'worklist',
    'qc', 'audit_logs', 'global_search'
  ],
  technician: [
    'worklist', 'analyzers', 'qc', 'inventory', 'global_search'
  ],
  phlebotomist: [
    'phlebotomy', 'barcode_print', 'sample_dispatch', 'global_search'
  ],
  receptionist: [
    'registration', 'billing', 'receipt_print', 'b2b', 'global_search'
  ]
};

/**
 * Validates whether a user's role is authorized to perform an action
 */
function isRoleAuthorized(role, permission) {
  if (!role) return false;
  const normalizedRole = role.toLowerCase().trim();
  if (normalizedRole === 'admin') return true;
  const allowed = ROLE_PERMISSIONS[normalizedRole] || [];
  return allowed.includes(permission);
}

/**
 * Authenticates user credentials against the SQLite `users` table
 */
function authenticateUser(username, password) {
  if (!username || !password) {
    return { success: false, error: 'Username and password are required.' };
  }

  const cleanUser = username.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = ? AND is_active = 1').get(cleanUser);

  if (!user) {
    return { success: false, error: 'Invalid username or account is deactivated.' };
  }

  const isMatch = verifyPassword(password.trim(), user.password_hash, user.salt);
  if (!isMatch) {
    return { success: false, error: 'Invalid password. Access denied.' };
  }

  // Generate safe session
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  // Record session
  db.prepare(`
    INSERT INTO sessions (session_id, user_id, username, login_time, last_heartbeat)
    VALUES (?, ?, ?, ?, ?)
  `).run(sessionId, user.id, user.username, now, Date.now());

  logAudit({
    userId: user.id,
    username: user.username,
    role: user.role,
    action: 'USER_LOGIN',
    entityType: 'session',
    entityId: sessionId,
    details: `User logged in successfully as role: ${user.role}`
  });

  return {
    success: true,
    sessionId,
    user: {
      id: user.id,
      username: user.username,
      name: user.full_name,
      role: user.role,
      signatureImage: user.signature_image || null,
      permissions: ROLE_PERMISSIONS[user.role] || []
    }
  };
}

/**
 * Resolves session from Authorization header or session cookie
 */
function getSessionFromRequest(req) {
  const authHeader = req.headers['authorization'] || '';
  let sessionId = null;

  if (authHeader.startsWith('Bearer ')) {
    sessionId = authHeader.substring(7).trim();
  } else if (req.headers['x-session-id']) {
    sessionId = req.headers['x-session-id'].trim();
  }

  if (!sessionId) return null;

  const session = db.prepare(`
    SELECT s.*, u.full_name, u.role, u.is_active, u.signature_image
    FROM sessions s
    JOIN users u ON s.username = u.username
    WHERE s.session_id = ? AND u.is_active = 1
  `).get(sessionId);

  if (session) {
    // Update heartbeat
    db.prepare('UPDATE sessions SET last_heartbeat = ? WHERE session_id = ?').run(Date.now(), sessionId);
  }

  return session || null;
}

/**
 * Creates a new staff user (Admin only)
 */
function createUser({ username, password, fullName, role, phone, signatureImage }) {
  const cleanUser = username.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(cleanUser);
  if (existing) {
    return { success: false, error: `Username "${cleanUser}" already exists.` };
  }

  const validRoles = ['admin', 'pathologist', 'technician', 'receptionist', 'phlebotomist'];
  if (!validRoles.includes(role.toLowerCase())) {
    return { success: false, error: `Invalid role. Allowed roles: ${validRoles.join(', ')}` };
  }

  const { hash, salt } = hashPassword(password);
  const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, username, password_hash, salt, full_name, role, phone, signature_image, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(userId, cleanUser, hash, salt, fullName || cleanUser, role.toLowerCase(), phone || '', signatureImage || null, now, now);

  return {
    success: true,
    user: { id: userId, username: cleanUser, fullName, role: role.toLowerCase() }
  };
}

/**
 * Lists all staff users (sanitized, no password hashes)
 */
function listUsers() {
  return db.prepare(`
    SELECT id, username, full_name, role, phone, signature_image, is_active, created_at, updated_at
    FROM users
    ORDER BY created_at ASC
  `).all();
}

/**
 * Updates a user's password or role
 */
function updateUser(userId, { password, fullName, role, isActive, signatureImage }) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return { success: false, error: 'User not found.' };

  const updates = [];
  const params = [];

  if (password && password.trim()) {
    const { hash, salt } = hashPassword(password.trim());
    updates.push('password_hash = ?, salt = ?');
    params.push(hash, salt);
  }
  if (fullName !== undefined) {
    updates.push('full_name = ?');
    params.push(fullName);
  }
  if (role !== undefined) {
    updates.push('role = ?');
    params.push(role.toLowerCase());
  }
  if (isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(isActive ? 1 : 0);
  }
  if (signatureImage !== undefined) {
    updates.push('signature_image = ?');
    params.push(signatureImage);
  }

  updates.push('updated_at = ?');
  params.push(new Date().toISOString());

  params.push(userId);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  return { success: true };
}

module.exports = {
  ROLE_PERMISSIONS,
  isRoleAuthorized,
  authenticateUser,
  getSessionFromRequest,
  createUser,
  listUsers,
  updateUser
};
