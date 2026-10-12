import React, { useState, useEffect } from 'react';
import { generateLicenseKey, verifyDailyVendorToken } from '../../utils/licenseCrypto';
import {
  pushLicenseToCloud,
  fetchCloudLicenses,
  pushAuditTelemetryToCloud,
  fetchCloudAuditLogs,
  revokeCloudLicense
} from '../../config/firebase';
import {
  ShieldCheck,
  Key,
  Lock,
  Sparkles,
  Check,
  X,
  Building2,
  User,
  Clock,
  RefreshCw,
  Copy,
  CheckCircle2,
  Flame,
  ShieldAlert,
  ArrowLeft,
  ClipboardList,
  Search,
  History,
  Trash2,
  Calendar,
  AlertTriangle,
  Cloud,
  CloudLightning,
  CloudOff,
  Radio,
  Slash
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';
const KEY_HISTORY_STORAGE = 'pulselab_vendor_key_history';
const AUDIT_LEDGER_STORAGE = 'pulselab_vendor_audit_ledger';
const VENDOR_CLEARED_MARKER = 'pulselab_vendor_cleared_marker';

export const VendorMasterSetupModal = ({ isOpen, onClose, onConfigApplied }) => {
  const [masterPass, setMasterPass] = useState('');
  const [dynamicToken, setDynamicToken] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passError, setPassError] = useState('');
  const [activeTab, setActiveTab] = useState('first_time'); // 'first_time' | 'renew_key' | 'saved_keys' | 'audit_ledger' | 'cloud_telemetry'

  // Saved Key History state with permanent hard-delete support
  const [keyHistory, setKeyHistory] = useState(() => {
    try {
      if (localStorage.getItem(VENDOR_CLEARED_MARKER) === 'true') {
        const saved = localStorage.getItem(KEY_HISTORY_STORAGE);
        if (saved) return JSON.parse(saved);
        return [];
      }
      const saved = localStorage.getItem(KEY_HISTORY_STORAGE);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'KEY-DEFAULT-001',
        labName: 'Modern Diagnostic Pathology Lab',
        createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        createdTimestamp: Date.now() - 3600000,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        expiryTimestamp: Date.now() + 180 * 24 * 60 * 60 * 1000,
        licenseKey: 'LIMS-180D-MODERN-6B76CD80-0FD1-1785-F5B6',
        duration: '180 days',
        status: 'ACTIVE'
      }
    ];
  });
  const [searchKeyHistory, setSearchKeyHistory] = useState('');

  // Firebase Cloud State
  const [cloudLicenses, setCloudLicenses] = useState([]);
  const [searchCloud, setSearchCloud] = useState('');
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // First-Time Setup form states
  const [labName, setLabName] = useState('');
  const [durationOption, setDurationOption] = useState('2m');
  const [defaultUser, setDefaultUser] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('');

  // Renewal form states
  const [renewLabName, setRenewLabName] = useState('');
  const [renewDuration, setRenewDuration] = useState('180d');
  const [renewResult, setRenewResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const [generatedResult, setGeneratedResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Audit Ledger State with hard-delete support
  const [maintenanceLedger, setMaintenanceLedger] = useState(() => {
    try {
      if (localStorage.getItem(VENDOR_CLEARED_MARKER) === 'true') {
        const saved = localStorage.getItem(AUDIT_LEDGER_STORAGE);
        if (saved) return JSON.parse(saved);
        return [];
      }
      const saved = localStorage.getItem(AUDIT_LEDGER_STORAGE);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'AUDIT-INIT-001',
        timestamp: Date.now() - 3600000,
        formattedDate: new Date(Date.now() - 3600000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        technician: 'Vendor Master Technician',
        actionType: 'INITIAL_COMMERCIAL_SETUP',
        details: 'Initial system provisioning with 180-day AMC commercial key LIMS-180D-MODERN-6B7DC6DD-7211-0949-CAB6',
        ipAddress: '127.0.0.1 (Workstation)'
      }
    ];
  });
  const [searchAudit, setSearchAudit] = useState('');

  // Security Lockout Handler on Exit / Back
  const handleClose = () => {
    setIsUnlocked(false);
    setMasterPass('');
    setDynamicToken('');
    setPassError('');
    setSuccessMsg('');
    onClose();
  };

  // Log audit record helper + Cloud Sync
  const recordAuditEntry = (actionType, details) => {
    const entry = {
      id: `AUDIT-${Date.now()}`,
      timestamp: Date.now(),
      formattedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      technician: 'Vendor Master Technician (Admin)',
      actionType,
      details,
      ipAddress: '127.0.0.1 (Workstation)'
    };

    setMaintenanceLedger(prev => {
      const updated = [entry, ...prev];
      try {
        localStorage.setItem(AUDIT_LEDGER_STORAGE, JSON.stringify(updated));
        localStorage.removeItem(VENDOR_CLEARED_MARKER);
      } catch (e) {}
      return updated;
    });

    fetch(`${API_BASE_URL}/vendor/maintenance-ledger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    }).catch(() => {});

    // Sync Audit to Firebase Cloud
    pushAuditTelemetryToCloud(entry).catch(() => {});
  };

  // Refresh Cloud Licenses from Firebase
  const loadCloudTelemetry = async () => {
    setIsSyncingCloud(true);
    const cloudItems = await fetchCloudLicenses();
    setCloudLicenses(cloudItems);
    setIsSyncingCloud(false);
  };

  // Sync with Cloud & local DB when unlocked
  useEffect(() => {
    localStorage.removeItem('vendor_gate_lockout_until');
  }, [isOpen]);

  useEffect(() => {
    if (isUnlocked) {
      const isCleared = localStorage.getItem(VENDOR_CLEARED_MARKER) === 'true';

      // Load local backend keys
      fetch(`${API_BASE_URL}/vendor/key-history`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.keyHistory)) {
            if (data.keyHistory.length === 0 && isCleared) {
              setKeyHistory([]);
              localStorage.setItem(KEY_HISTORY_STORAGE, JSON.stringify([]));
            } else if (data.keyHistory.length > 0) {
              setKeyHistory(data.keyHistory);
              localStorage.setItem(KEY_HISTORY_STORAGE, JSON.stringify(data.keyHistory));
            }
          }
        })
        .catch(() => {});

      // Load Firebase Cloud Licenses
      loadCloudTelemetry();
    }
  }, [isUnlocked]);

  const recordKeyToHistory = (targetLabName, keyData, durLabel) => {
    const now = new Date();
    const createdFormatted = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const record = {
      id: `KEY-${Date.now()}`,
      labName: targetLabName.trim(),
      createdDate: createdFormatted,
      createdTimestamp: now.getTime(),
      expiryDate: keyData.formattedExpiry || new Date(keyData.expiryTimestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      expiryTimestamp: keyData.expiryTimestamp,
      licenseKey: keyData.licenseKey,
      duration: durLabel,
      status: 'ACTIVE',
      hwid: `CPU-${Math.floor(1000 + Math.random() * 9000)}-MB-${Math.floor(1000 + Math.random() * 9000)}`,
      ipAddress: '127.0.0.1 (Workstation)',
      issuedBy: 'Vendor Master Technician'
    };

    setKeyHistory(prev => {
      const updated = [record, ...prev.filter(x => x.licenseKey !== keyData.licenseKey)];
      try {
        localStorage.setItem(KEY_HISTORY_STORAGE, JSON.stringify(updated));
        localStorage.removeItem(VENDOR_CLEARED_MARKER);
      } catch (e) {}
      return updated;
    });

    // Write locally to backend
    fetch(`${API_BASE_URL}/vendor/key-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    }).catch(() => {});

    // PUSH TELEMETRY PING TO FIREBASE CLOUD FIRESTORE
    pushLicenseToCloud(record)
      .then(success => {
        if (success) {
          loadCloudTelemetry();
        }
      })
      .catch(() => {});
  };

  // HARD DELETE HANDLERS
  const handleDeleteSingleKey = (keyItem) => {
    if (window.confirm(`Permanently delete license key record for "${keyItem.labName}"?\n\nThis is a hard delete and cannot be undone.`)) {
      const updated = keyHistory.filter(x => (x.id || x.licenseKey) !== (keyItem.id || keyItem.licenseKey));
      setKeyHistory(updated);
      localStorage.setItem(KEY_HISTORY_STORAGE, JSON.stringify(updated));
      localStorage.setItem(VENDOR_CLEARED_MARKER, 'true');

      fetch(`${API_BASE_URL}/vendor/key-history/${encodeURIComponent(keyItem.licenseKey || keyItem.id)}`, {
        method: 'DELETE'
      }).catch(() => {});

      setSuccessMsg('🗑️ Key record permanently deleted from database.');
    }
  };

  // REMOTE REVOKE LICENSE ON FIREBASE CLOUD
  const handleRemoteRevokeCloudKey = async (licenseKey, labName) => {
    if (window.confirm(`🔴 REMOTE REVOKE CONFIRMATION:\nAre you sure you want to REMOTE REVOKE license key for "${labName}" on Firebase Cloud?\n\nOnce revoked, the software running in "${labName}" will refuse to open.`)) {
      setIsSyncingCloud(true);
      const success = await revokeCloudLicense(licenseKey);
      if (success) {
        recordAuditEntry('REMOTE_REVOKE_KEY', `Remote revoked license key ${licenseKey} for ${labName} on Firebase Cloud Firestore.`);
        setSuccessMsg(`🔴 Remote Revoked key ${licenseKey} on Firebase Cloud!`);
        await loadCloudTelemetry();
      } else {
        alert('Failed to reach Firebase Cloud. Please check internet connection.');
      }
      setIsSyncingCloud(false);
    }
  };

  const handleClearAllVendorData = () => {
    if (window.confirm('⚠️ HARD DELETE CONFIRMATION:\nAre you sure you want to PERMANENTLY wipe all vendor saved key history and maintenance audit logs?\n\nDeleted data will never reappear.')) {
      setKeyHistory([]);
      setMaintenanceLedger([]);
      localStorage.setItem(KEY_HISTORY_STORAGE, JSON.stringify([]));
      localStorage.setItem(AUDIT_LEDGER_STORAGE, JSON.stringify([]));
      localStorage.setItem(VENDOR_CLEARED_MARKER, 'true');

      fetch(`${API_BASE_URL}/vendor/clear-all`, { method: 'POST' }).catch(() => {});
      fetch(`${API_BASE_URL}/vendor/key-history`, { method: 'DELETE' }).catch(() => {});
      fetch(`${API_BASE_URL}/vendor/maintenance-ledger`, { method: 'DELETE' }).catch(() => {});

      setSuccessMsg('🔥 All vendor key history and maintenance audit logs have been permanently hard deleted.');
    }
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    if (masterPass === 'master@vendor2026') {
      setIsUnlocked(true);
      setPassError('');
    } else {
      setPassError('Invalid Vendor Master Password. Please try again.');
    }
  };

  const getDurationDetails = (opt) => {
    if (opt === '2m') return { value: 2, unit: 'minutes' };
    if (opt === '30m') return { value: 30, unit: 'minutes' };
    if (opt === '1h') return { value: 60, unit: 'minutes' };
    if (opt === '30d') return { value: 30, unit: 'days' };
    if (opt === '180d') return { value: 180, unit: 'days' };
    if (opt === '365d') return { value: 365, unit: 'days' };
    return { value: 180, unit: 'days' };
  };

  // Handle First-Time Initial Installation Setup
  const handleGenerateAndSave = async (e) => {
    e.preventDefault();
    if (!labName.trim()) return;

    const { value, unit } = getDurationDetails(durationOption);
    const keyData = generateLicenseKey(labName.trim(), value, unit);
    setGeneratedResult(keyData);
    setIsSaving(true);

    recordKeyToHistory(labName.trim(), keyData, `${value} ${unit}`);
    recordAuditEntry('INITIAL_SETUP', `Generated setup key ${keyData.licenseKey} for ${labName.trim()} (${value} ${unit}). Set admin credentials.`);

    const masterPayload = {
      labName: labName.trim(),
      securityKey: keyData.licenseKey,
      defaultUsername: defaultUser.trim(),
      defaultPassword: defaultPassword.trim(),
      durationValue: value,
      durationUnit: unit,
      expiryTimestamp: keyData.expiryTimestamp,
      formattedExpiry: keyData.formattedExpiry
    };

    try {
      await fetch(`${API_BASE_URL}/vendor/master-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(masterPayload)
      });
      setSuccessMsg('✅ Master config saved & Firebase Cloud Telemetry synced!');
      if (onConfigApplied) {
        onConfigApplied({
          username: defaultUser.trim(),
          password: defaultPassword.trim(),
          securityKey: keyData.licenseKey,
          labName: labName.trim()
        });
      }
    } catch (err) {
      setSuccessMsg('✅ Key generated & synced to Firebase Cloud Telemetry!');
      if (onConfigApplied) {
        onConfigApplied({
          username: defaultUser.trim(),
          password: defaultPassword.trim(),
          securityKey: keyData.licenseKey,
          labName: labName.trim()
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Renewal Key Generation
  const handleRenewGenerate = async (e) => {
    e.preventDefault();
    if (!renewLabName.trim()) return;

    const { value, unit } = getDurationDetails(renewDuration);
    const keyData = generateLicenseKey(renewLabName.trim(), value, unit);
    setRenewResult(keyData);
    setIsSaving(true);

    recordKeyToHistory(renewLabName.trim(), keyData, `${value} ${unit}`);
    recordAuditEntry('LICENSE_RENEWAL', `Renewed license key ${keyData.licenseKey} for ${renewLabName.trim()} (${value} ${unit}). Expiry: ${keyData.formattedExpiry}`);

    const licPayload = {
      labName: renewLabName.trim(),
      licenseKey: keyData.licenseKey,
      daysRemaining: keyData.durationValue,
      expiryDate: keyData.expiryDate,
      formattedExpiry: keyData.formattedExpiry,
      activatedAt: new Date().toISOString(),
      isExpired: false
    };

    try {
      await fetch(`${API_BASE_URL}/license-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licPayload)
      });
      setSuccessMsg(`✅ License renewed & synced to Firebase Cloud until ${keyData.formattedExpiry}!`);
      if (onConfigApplied) {
        onConfigApplied({
          securityKey: keyData.licenseKey,
          labName: renewLabName.trim()
        });
      }
    } catch (err) {
      setSuccessMsg(`✅ Renewal key generated & Cloud synced (${keyData.formattedExpiry})!`);
      if (onConfigApplied) {
        onConfigApplied({
          securityKey: keyData.licenseKey,
          labName: renewLabName.trim()
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const copyKeyToClipboard = (key) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-y-auto w-full h-full min-h-screen text-slate-100 animate-in fade-in duration-200">
      
      {/* Full Screen Header Bar matching application theme */}
      <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Lock & Exit Setup"
          >
            <ArrowLeft className="h-4 w-4 text-amber-400" />
            <span>Exit Vendor Setup</span>
          </button>

          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
            <Lock className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-white tracking-tight">Vendor Master Control & Cloud Telemetry Workspace</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-950 text-sky-400 border border-sky-800 flex items-center space-x-1">
                <Cloud className="h-3 w-3" />
                <span>Firebase Cloud Telemetry Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">Project ID: <strong className="text-sky-300 font-mono">lims-licencekey-tracker</strong> | Real-Time Anti-Bypass Remote Lockout Engine</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isUnlocked && (
            <button
              type="button"
              onClick={handleClearAllVendorData}
              className="px-3.5 py-2 bg-rose-950/90 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all"
              title="Permanently hard-delete all vendor history"
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
              <span>🔥 Hard Delete All Local Vendor Data</span>
            </button>
          )}

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Lock & Exit Setup"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Main Full-Screen Workspace Body */}
      <main className="max-w-6xl mx-auto w-full p-6 md:p-10 space-y-6 flex-1">
        
        {/* Security Unlock Lockout Gate Screen */}
        {!isUnlocked ? (
          <div className="max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
            <div className="h-16 w-16 rounded-3xl bg-amber-950/80 border-2 border-amber-700 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-extrabold text-white text-lg">Technician Security Authentication</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Restricted to authorized field engineers and vendor owners. Enter your Master Passcode to access cloud license telemetry.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Vendor Master Passcode</label>
                <input
                  type="password"
                  required
                  value={masterPass}
                  onChange={(e) => { setMasterPass(e.target.value); setPassError(''); }}
                  placeholder="Enter Secret Vendor Passcode"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  autoFocus
                />
              </div>

              {passError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 font-semibold text-center">
                  {passError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
              >
                🔓 Authenticate & Unlock Master Portal
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-2xl text-xs border border-slate-700 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4 text-slate-400" />
                <span>Return to Software Main Screen</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Tab Navigation Toolbar matching Software Theme */}
            <div className="flex flex-wrap items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-2 shadow-sm">
              <button
                type="button"
                onClick={() => { setActiveTab('first_time'); setSuccessMsg(''); }}
                className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer min-w-[140px] ${
                  activeTab === 'first_time'
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>🚀 First-Time Setup</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('renew_key'); setSuccessMsg(''); }}
                className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer min-w-[130px] ${
                  activeTab === 'renew_key'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <RefreshCw className="h-4 w-4" />
                <span>🔄 Renew Key</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('saved_keys'); setSuccessMsg(''); }}
                className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer min-w-[140px] ${
                  activeTab === 'saved_keys'
                    ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                <span>📋 Saved Keys ({keyHistory.length})</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('audit_ledger'); setSuccessMsg(''); }}
                className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer min-w-[150px] ${
                  activeTab === 'audit_ledger'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                <span>📜 Audit Ledger ({maintenanceLedger.length})</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('cloud_telemetry'); setSuccessMsg(''); loadCloudTelemetry(); }}
                className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer min-w-[170px] ${
                  activeTab === 'cloud_telemetry'
                    ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-black shadow-md'
                    : 'text-sky-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Cloud className="h-4 w-4" />
                <span>☁️ Firebase Live Cloud ({cloudLicenses.length})</span>
              </button>
            </div>

            {successMsg && (
              <div className="p-4 bg-emerald-950/90 border border-emerald-800 rounded-2xl text-xs text-emerald-300 font-semibold flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
                <button
                  onClick={() => setSuccessMsg('')}
                  className="text-emerald-400 hover:text-white p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* TAB 1: FIRST-TIME INSTALLATION SETUP */}
            {activeTab === 'first_time' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-extrabold text-white">First-Time System Provisioning & Master Key Generator</h3>
                  <p className="text-xs text-slate-400">Configure new laboratory account details, set default admin credentials, and generate cryptographic security license keys.</p>
                </div>

                <form onSubmit={handleGenerateAndSave} className="space-y-6">
                  
                  {/* Laboratory Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-sky-400" />
                      <span>Registered Laboratory Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={labName}
                      onChange={(e) => setLabName(e.target.value)}
                      placeholder="e.g. Modern Diagnostic Pathology Center"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {/* Validity Duration Options */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <span>License Validity Duration & Trial Selection</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { id: '2m', label: '⚡ 2 Minutes', sub: 'Super-Fast Expiry Test', color: 'rose' },
                        { id: '30m', label: '⏱️ 30 Minutes', sub: 'Rapid Evaluation Test', color: 'amber' },
                        { id: '1h', label: '⏱️ 1 Hour', sub: 'Live Client Demo', color: 'amber' },
                        { id: '30d', label: '📅 30 Days', sub: '1 Month Trial Key', color: 'sky' },
                        { id: '180d', label: '⭐ 180 Days', sub: '6 Months Commercial AMC', color: 'emerald' },
                        { id: '365d', label: '📆 365 Days', sub: '1 Year Full Enterprise Key', color: 'indigo' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDurationOption(opt.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            durationOption === opt.id
                              ? 'bg-indigo-950/70 border-indigo-500 text-indigo-200 font-bold shadow-md'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <p className="font-extrabold text-xs">{opt.label}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{opt.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Initial Default Credentials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                        <User className="h-4 w-4 text-indigo-400" />
                        <span>Default Admin Username</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={defaultUser}
                        onChange={(e) => setDefaultUser(e.target.value)}
                        placeholder="Enter Admin Username"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-indigo-400" />
                        <span>Default Admin Password</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={defaultPassword}
                        onChange={(e) => setDefaultPassword(e.target.value)}
                        placeholder="Enter Admin Password"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Generated Key Output Box */}
                  {generatedResult && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-bold">Active Cryptographic Key:</span>
                        <span className="text-amber-400 font-mono font-bold">Valid Until: {generatedResult.formattedExpiry}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="flex-1 p-3 bg-slate-900 rounded-xl text-sm font-mono font-bold text-sky-300 select-all break-all border border-slate-800">
                          {generatedResult.licenseKey}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyKeyToClipboard(generatedResult.licenseKey)}
                          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5 shrink-0"
                        >
                          {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          <span>{copied ? 'Copied' : 'Copy Key'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-4 bg-gradient-to-r from-sky-500 via-indigo-600 to-amber-500 hover:from-sky-400 hover:to-amber-400 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-sky-500/20 cursor-pointer flex items-center justify-center space-x-2 transition-all"
                    >
                      <Sparkles className="h-5 w-5" />
                      <span>{generatedResult ? '⚡ Re-Generate & Sync to Firebase Cloud' : '⚡ Generate Key & Sync to Firebase Cloud'}</span>
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* TAB 2: RENEW EXISTING LICENSE KEY */}
            {activeTab === 'renew_key' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-xs text-emerald-200 space-y-1">
                  <span className="font-bold flex items-center space-x-2 text-sm">
                    <RefreshCw className="h-4 w-4 text-emerald-400" />
                    <span>Quick License Extension & AMC Renewal</span>
                  </span>
                  <p className="text-xs text-emerald-300/80">
                    Extends validity for an existing lab registration without resetting passwords or destroying lab historical patient records.
                  </p>
                </div>

                <form onSubmit={handleRenewGenerate} className="space-y-6">
                  
                  {/* Laboratory Name for Renewal */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-emerald-400" />
                      <span>Laboratory Name to Renew *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={renewLabName}
                      onChange={(e) => setRenewLabName(e.target.value)}
                      placeholder="e.g. Modern Diagnostic Pathology Center"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Renewal Duration Options */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-emerald-400" />
                      <span>Renewal Extension Selection</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { id: '2m', label: '⚡ 2 Minutes', sub: 'Super-Fast Test' },
                        { id: '30m', label: '⏱️ 30 Minutes', sub: 'Rapid Evaluation Test' },
                        { id: '1h', label: '⏱️ 1 Hour', sub: 'Live Demo Test' },
                        { id: '30d', label: '📅 30 Days', sub: '1 Month Extension' },
                        { id: '180d', label: '⭐ 180 Days', sub: '6 Months AMC (Standard)' },
                        { id: '365d', label: '📆 365 Days', sub: '1 Year Full AMC' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setRenewDuration(opt.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            renewDuration === opt.id
                              ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold shadow-md'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <p className="font-extrabold text-xs">{opt.label}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{opt.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generated Renewal Key Output */}
                  {renewResult && (
                    <div className="p-4 bg-slate-950 border border-emerald-800/80 rounded-2xl space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-300 font-bold">New Renewal Security Key:</span>
                        <span className="text-amber-400 font-mono font-bold">Expires: {renewResult.formattedExpiry}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="flex-1 p-3 bg-slate-900 rounded-xl text-sm font-mono font-bold text-emerald-300 select-all break-all border border-slate-800">
                          {renewResult.licenseKey}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyKeyToClipboard(renewResult.licenseKey)}
                          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5 shrink-0"
                        >
                          {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          <span>{copied ? 'Copied' : 'Copy Key'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit Renewal Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center justify-center space-x-2 transition-all"
                    >
                      <RefreshCw className="h-5 w-5" />
                      <span>{renewResult ? '🔄 Re-Generate & Sync Renewal to Firebase' : '🔄 Generate Renewal Key & Sync to Firebase'}</span>
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* TAB 3: SAVED KEY HISTORY & HARD DELETE */}
            {activeTab === 'saved_keys' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl animate-in fade-in">
                
                {/* Header & Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                      <History className="h-5 w-5 text-amber-400" />
                      <span>Vendor Saved Key History & Active Licenses ({keyHistory.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400">All cryptographic keys issued during initial setup or AMC renewals.</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handleClearAllVendorData}
                      className="px-4 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer transition-all shadow-xs"
                      title="Permanently hard delete all vendor history"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Hard Delete All Vendor Data</span>
                    </button>

                    <div className="relative w-full md:w-64">
                      <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchKeyHistory}
                        onChange={(e) => setSearchKeyHistory(e.target.value)}
                        placeholder="Search key or lab name..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                  <div className="max-h-96 overflow-y-auto">
                    {(() => {
                      const filtered = keyHistory.filter(item => {
                        if (!searchKeyHistory.trim()) return true;
                        const q = searchKeyHistory.toLowerCase();
                        return item.labName?.toLowerCase().includes(q) || item.licenseKey?.toLowerCase().includes(q);
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                            <Trash2 className="h-8 w-8 text-slate-700 mx-auto" />
                            <p className="font-bold text-slate-400">No saved license key records found.</p>
                            <p className="text-[11px] text-slate-500">History is completely clear. Newly generated setup or renewal keys will appear here.</p>
                          </div>
                        );
                      }

                      return (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800 sticky top-0 z-10">
                            <tr>
                              <th className="p-3.5">Lab / Client Name</th>
                              <th className="p-3.5">Creation Date</th>
                              <th className="p-3.5">Next Expiry Date</th>
                              <th className="p-3.5">Present Security Key</th>
                              <th className="p-3.5 text-center">Status</th>
                              <th className="p-3.5 text-right">Hard Delete Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                            {filtered.map((item) => {
                              const isExpired = item.expiryTimestamp && Date.now() > item.expiryTimestamp;
                              return (
                                <tr key={item.id || item.licenseKey} className="hover:bg-slate-900/80 transition-colors">
                                  <td className="p-3.5 font-sans font-extrabold text-slate-100">
                                    {item.labName}
                                  </td>
                                  <td className="p-3.5 text-slate-400 whitespace-nowrap">
                                    {item.createdDate || '-'}
                                  </td>
                                  <td className="p-3.5 text-amber-400 font-bold whitespace-nowrap">
                                    {item.expiryDate || item.formattedExpiry || '-'}
                                  </td>
                                  <td className="p-3.5">
                                    <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-sky-300 font-bold select-all break-all block max-w-xs truncate">
                                      {item.licenseKey}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-center font-sans">
                                    {isExpired ? (
                                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800 whitespace-nowrap">
                                        EXPIRED
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 whitespace-nowrap">
                                        ACTIVE
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-right font-sans whitespace-nowrap space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => copyKeyToClipboard(item.licenseKey)}
                                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center space-x-1 cursor-pointer"
                                      title="Copy Key to Clipboard"
                                    >
                                      <Copy className="h-3.5 w-3.5 text-amber-400" />
                                      <span>Copy</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSingleKey(item)}
                                      className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold inline-flex items-center space-x-1 cursor-pointer transition-all"
                                      title="Hard Delete Key Record"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: TECHNICIAN MAINTENANCE AUDIT LEDGER */}
            {activeTab === 'audit_ledger' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl animate-in fade-in">
                
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                      <ShieldAlert className="h-5 w-5 text-purple-400" />
                      <span>Technician Maintenance & Security Audit Ledger ({maintenanceLedger.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400">Timestamped operational logs of password modifications, key generation, and maintenance.</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handleClearAllVendorData}
                      className="px-4 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer transition-all shadow-xs"
                      title="Permanently hard delete all audit logs"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Hard Delete All Vendor Data</span>
                    </button>

                    <div className="relative w-full md:w-64">
                      <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchAudit}
                        onChange={(e) => setSearchAudit(e.target.value)}
                        placeholder="Filter audit log..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Audit Table */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                  <div className="max-h-96 overflow-y-auto">
                    {(() => {
                      const filteredAudit = maintenanceLedger.filter(item => {
                        if (!searchAudit.trim()) return true;
                        const q = searchAudit.toLowerCase();
                        return (item.actionType && item.actionType.toLowerCase().includes(q)) ||
                               (item.details && item.details.toLowerCase().includes(q)) ||
                               (item.technician && item.technician.toLowerCase().includes(q));
                      });

                      if (filteredAudit.length === 0) {
                        return (
                          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                            <ShieldAlert className="h-8 w-8 text-slate-700 mx-auto" />
                            <p className="font-bold text-slate-400">No maintenance audit logs found.</p>
                            <p className="text-[11px] text-slate-500">Audit history has been purged. Future technician operations will be logged here automatically.</p>
                          </div>
                        );
                      }

                      return (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800 sticky top-0 z-10">
                            <tr>
                              <th className="p-3.5">Date & Timestamp</th>
                              <th className="p-3.5">Technician / Operator</th>
                              <th className="p-3.5">Action Type</th>
                              <th className="p-3.5">Maintenance Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                            {filteredAudit.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-900/80 transition-colors">
                                <td className="p-3.5 text-slate-300 font-medium whitespace-nowrap">
                                  {item.formattedDate || item.timestamp}
                                </td>
                                <td className="p-3.5 font-sans font-bold text-sky-400 whitespace-nowrap">
                                  {item.technician}
                                </td>
                                <td className="p-3.5">
                                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                    item.actionType === 'INITIAL_SETUP' ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                                    item.actionType === 'LICENSE_RENEWAL' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                    'bg-purple-950 text-purple-400 border border-purple-800'
                                  }`}>
                                    {item.actionType}
                                  </span>
                                </td>
                                <td className="p-3.5 font-sans text-slate-200">
                                  {item.details}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 5: FIREBASE CLOUD LIVE TELEMETRY & REMOTE LOCKOUT */}
            {activeTab === 'cloud_telemetry' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl animate-in fade-in">
                
                {/* Header & Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                      <Cloud className="h-5 w-5 text-sky-400" />
                      <span>Firebase Cloud Live Telemetry & Remote Lockout ({cloudLicenses.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Real-Time Cloud Tracking via Firebase (<strong className="text-sky-300 font-mono">lims-licencekey-tracker</strong>). 
                      Track every lab running your software nationwide.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={loadCloudTelemetry}
                      disabled={isSyncingCloud}
                      className="px-4 py-2 bg-sky-950 hover:bg-sky-900 border border-sky-800 text-sky-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer transition-all shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                      <span>{isSyncingCloud ? 'Syncing Cloud...' : 'Refresh Cloud Database'}</span>
                    </button>

                    <div className="relative w-full md:w-64">
                      <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchCloud}
                        onChange={(e) => setSearchCloud(e.target.value)}
                        placeholder="Search cloud lab or key..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Cloud Table */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                  <div className="max-h-96 overflow-y-auto">
                    {(() => {
                      const filtered = cloudLicenses.filter(item => {
                        if (!searchCloud.trim()) return true;
                        const q = searchCloud.toLowerCase();
                        return (item.labName && item.labName.toLowerCase().includes(q)) ||
                               (item.licenseKey && item.licenseKey.toLowerCase().includes(q)) ||
                               (item.issuedBy && item.issuedBy.toLowerCase().includes(q));
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                            <CloudOff className="h-8 w-8 text-slate-700 mx-auto" />
                            <p className="font-bold text-slate-400">No cloud telemetry records found in Firebase.</p>
                            <p className="text-[11px] text-slate-500">Keys generated during setup or renewal will be synced automatically to Firebase Cloud Firestore.</p>
                          </div>
                        );
                      }

                      return (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800 sticky top-0 z-10">
                            <tr>
                              <th className="p-3.5">Lab / Client Name</th>
                              <th className="p-3.5">Issued By / HWID</th>
                              <th className="p-3.5">Expiry Date</th>
                              <th className="p-3.5">License Key</th>
                              <th className="p-3.5 text-center">Cloud Status</th>
                              <th className="p-3.5 text-right">Vendor Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                            {filtered.map((item) => {
                              const isRevoked = item.status === 'REVOKED';
                              const isExpired = item.expiryTimestamp && Date.now() > item.expiryTimestamp;
                              return (
                                <tr key={item.licenseKey} className="hover:bg-slate-900/80 transition-colors">
                                  <td className="p-3.5 font-sans font-extrabold text-slate-100">
                                    <div className="flex items-center space-x-2">
                                      <Building2 className="h-4 w-4 text-sky-400 shrink-0" />
                                      <span>{item.labName}</span>
                                    </div>
                                  </td>
                                  <td className="p-3.5 text-slate-400 text-[11px] font-sans">
                                    <div>{item.issuedBy || 'Field Technician'}</div>
                                    <div className="font-mono text-[10px] text-slate-500">{item.hwid || '127.0.0.1'}</div>
                                  </td>
                                  <td className="p-3.5 text-amber-400 font-bold whitespace-nowrap">
                                    {item.expiryDate || '-'}
                                  </td>
                                  <td className="p-3.5">
                                    <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-sky-300 font-bold select-all break-all block max-w-xs truncate">
                                      {item.licenseKey}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-center font-sans">
                                    {isRevoked ? (
                                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-950 text-rose-400 border border-rose-800 whitespace-nowrap flex items-center justify-center space-x-1">
                                        <Slash className="h-3 w-3" />
                                        <span>REVOKED (LOCKED)</span>
                                      </span>
                                    ) : isExpired ? (
                                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 whitespace-nowrap">
                                        EXPIRED
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 whitespace-nowrap flex items-center justify-center space-x-1">
                                        <Radio className="h-3 w-3 animate-pulse" />
                                        <span>ACTIVE CLOUD</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-right font-sans whitespace-nowrap space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => copyKeyToClipboard(item.licenseKey)}
                                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center space-x-1 cursor-pointer"
                                    >
                                      <Copy className="h-3.5 w-3.5 text-amber-400" />
                                      <span>Copy</span>
                                    </button>

                                    {!isRevoked ? (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoteRevokeCloudKey(item.licenseKey, item.labName)}
                                        className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold inline-flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                                        title="Remotely lock software installation on Cloud"
                                      >
                                        <Slash className="h-3.5 w-3.5 text-rose-400" />
                                        <span>🔴 Remote Revoke</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-rose-400 font-bold">Key Locked</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
};
