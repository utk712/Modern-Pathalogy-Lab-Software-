// Firebase Config & Cloud License Telemetry Service
// Project: lims-licencekey-tracker

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lims-licencekey-tracker.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lims-licencekey-tracker",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lims-licencekey-tracker.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "624695989606",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:624695989606:web:c6625665d5106eeba1e4a7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-H96L3M3NK8"
};

const FIRESTORE_REST_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

// Helper: Convert JS Value to Firestore REST field format
const toFirestoreValue = (val) => {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  return { stringValue: String(val) };
};

// Helper: Parse Firestore REST Document into JS Object
const parseFirestoreDocument = (doc) => {
  if (!doc || !doc.fields) return null;
  const obj = {};
  for (const [key, fieldObj] of Object.entries(doc.fields)) {
    if ('stringValue' in fieldObj) obj[key] = fieldObj.stringValue;
    else if ('integerValue' in fieldObj) obj[key] = Number(fieldObj.integerValue);
    else if ('doubleValue' in fieldObj) obj[key] = Number(fieldObj.doubleValue);
    else if ('booleanValue' in fieldObj) obj[key] = fieldObj.booleanValue;
    else obj[key] = null;
  }
  return obj;
};

// 1. Push License Record to Firebase Cloud Firestore
export const pushLicenseToCloud = async (record) => {
  if (!record || !record.licenseKey) return false;
  const docId = encodeURIComponent(record.licenseKey.replace(/\//g, '_'));
  const url = `${FIRESTORE_REST_BASE}/registered_licenses/${docId}?key=${FIREBASE_CONFIG.apiKey}`;

  // Evaluate date-based status automatically before pushing to Cloud
  const updatedRecord = { ...record };
  if (updatedRecord.status !== 'REVOKED') {
    const expTime = updatedRecord.expiryTimestamp ? Number(updatedRecord.expiryTimestamp) : null;
    if (expTime && expTime < Date.now()) {
      updatedRecord.status = 'EXPIRED';
    } else {
      updatedRecord.status = 'ACTIVE';
    }
  }

  const fields = {};
  for (const [k, v] of Object.entries(updatedRecord)) {
    fields[k] = toFirestoreValue(v);
  }
  fields['cloudSyncedAt'] = toFirestoreValue(new Date().toISOString());

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    return res.ok;
  } catch (err) {
    console.warn('Firebase Cloud Sync Notice: Offline mode fallback active.');
    return false;
  }
};

// 2. Fetch All Licenses from Firebase Cloud Firestore & Auto-Sync Date Expiry Status
export const fetchCloudLicenses = async () => {
  const url = `${FIRESTORE_REST_BASE}/registered_licenses?key=${FIREBASE_CONFIG.apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.documents || !Array.isArray(data.documents)) return [];
    
    const now = Date.now();
    const licenses = data.documents.map(doc => parseFirestoreDocument(doc)).filter(Boolean);

    // Auto-evaluate date-based status and auto-sync EXPIRED/ACTIVE state to Firebase Cloud Firestore
    for (const lic of licenses) {
      if (lic.status !== 'REVOKED') {
        const expTime = lic.expiryTimestamp ? Number(lic.expiryTimestamp) : null;
        if (expTime && expTime < now && lic.status !== 'EXPIRED') {
          lic.status = 'EXPIRED';
          pushLicenseToCloud({ ...lic, status: 'EXPIRED' }).catch(() => {});
        } else if (expTime && expTime >= now && lic.status === 'EXPIRED') {
          lic.status = 'ACTIVE';
          pushLicenseToCloud({ ...lic, status: 'ACTIVE' }).catch(() => {});
        }
      }
    }

    return licenses;
  } catch (err) {
    console.warn('Firebase Cloud fetch notice.');
    return [];
  }
};

// 3. Push Audit Telemetry Log to Firebase Cloud Firestore
export const pushAuditTelemetryToCloud = async (auditEntry) => {
  if (!auditEntry || !auditEntry.id) return false;
  const docId = encodeURIComponent(auditEntry.id);
  const url = `${FIRESTORE_REST_BASE}/technician_telemetry_logs/${docId}?key=${FIREBASE_CONFIG.apiKey}`;

  const fields = {};
  for (const [k, v] of Object.entries(auditEntry)) {
    fields[k] = toFirestoreValue(v);
  }
  fields['cloudSyncedAt'] = toFirestoreValue(new Date().toISOString());

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};

// 4. Fetch All Maintenance Audit Logs from Firebase Cloud Firestore
export const fetchCloudAuditLogs = async () => {
  const url = `${FIRESTORE_REST_BASE}/technician_telemetry_logs?key=${FIREBASE_CONFIG.apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.documents || !Array.isArray(data.documents)) return [];
    return data.documents.map(doc => parseFirestoreDocument(doc)).filter(Boolean);
  } catch (err) {
    return [];
  }
};

// 5. Remote Revoke License on Firebase Cloud
export const revokeCloudLicense = async (licenseKey) => {
  if (!licenseKey) return false;
  const docId = encodeURIComponent(licenseKey.replace(/\//g, '_'));
  const url = `${FIRESTORE_REST_BASE}/registered_licenses/${docId}?key=${FIREBASE_CONFIG.apiKey}`;

  const fields = {
    licenseKey: toFirestoreValue(licenseKey),
    status: toFirestoreValue('REVOKED'),
    revokedAt: toFirestoreValue(new Date().toISOString()),
    revokedBy: toFirestoreValue('Vendor System Owner (Remote Lock)')
  };

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};

// 6. Verify Single License Status on Firebase Cloud
export const verifyLicenseOnCloud = async (licenseKey) => {
  if (!licenseKey) return { valid: false, reason: 'Empty license key.' };
  const docId = encodeURIComponent(licenseKey.replace(/\//g, '_'));
  const url = `${FIRESTORE_REST_BASE}/registered_licenses/${docId}?key=${FIREBASE_CONFIG.apiKey}`;

  try {
    const res = await fetch(url);
    if (res.status === 404) {
      return { valid: true, isUnregisteredCloud: true, reason: 'Key exists locally.' };
    }
    if (!res.ok) return { valid: true, offline: true };
    const doc = await res.json();
    const data = parseFirestoreDocument(doc);
    if (data && data.status === 'REVOKED') {
      return { valid: false, isRevoked: true, reason: 'License key revoked remotely by vendor owner.' };
    }
    if (data && data.expiryTimestamp && Number(data.expiryTimestamp) < Date.now()) {
      return { valid: false, isExpired: true, reason: 'License key expired on Firebase Cloud.' };
    }
    return { valid: true, data };
  } catch (err) {
    return { valid: true, offline: true };
  }
};
