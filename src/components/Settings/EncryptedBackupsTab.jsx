import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Download, RefreshCw, CheckCircle2, AlertTriangle, HardDrive, Check } from 'lucide-react';

export const EncryptedBackupsTab = () => {
  const [backups, setBackups] = useState([]);
  const [backupDir, setBackupDir] = useState('C:\\ModernLIMS_Backups');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState({});
  const [feedback, setFeedback] = useState('');

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/system/backups');
      if (res.ok) {
        const json = await res.json();
        setBackups(json.backups || []);
        if (json.backupDirectory) setBackupDir(json.backupDirectory);
      }
    } catch (err) {
      console.warn('Could not fetch backups:', err);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    setFeedback('');
    try {
      const res = await fetch('/api/system/backup-now', { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback(`✅ Created AES-256-GCM encrypted snapshot: ${json.filename} (${(json.sizeBytes / 1024).toFixed(1)} KB)`);
        fetchBackups();
      } else {
        setFeedback('Backup notice: ' + (json.error || 'Failed to complete snapshot.'));
      }
    } catch (err) {
      setFeedback('Error: ' + err.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleVerifyIntegrity = async (filename) => {
    setVerifyStatus(prev => ({ ...prev, [filename]: 'verifying' }));
    try {
      const res = await fetch('/api/system/backup-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const json = await res.json();
      if (res.ok && json.valid) {
        setVerifyStatus(prev => ({ ...prev, [filename]: 'ok' }));
      } else {
        setVerifyStatus(prev => ({ ...prev, [filename]: 'error' }));
      }
    } catch (err) {
      setVerifyStatus(prev => ({ ...prev, [filename]: 'error' }));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <HardDrive className="h-5 w-5 text-indigo-600" />
            <span>Automated Encrypted Backups (AES-256-GCM in SQLite WAL Mode)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Zero-risk crash recovery: Safe online SQLite WAL snapshots are encrypted with authenticated AES-256-GCM before writing to the backup disk.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchBackups}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            title="Refresh Backups List"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleBackupNow}
            disabled={isBackingUp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Database className="h-4 w-4" />
            <span>{isBackingUp ? 'Creating Encrypted Snapshot...' : 'Create Instant Backup'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Target Directory Information */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
        <div>
          <span className="text-slate-500 block text-[11px]">Active Encrypted Backup Destination Folder:</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{backupDir}</span>
        </div>
        <div className="flex items-center space-x-1 text-emerald-700 font-bold text-xs bg-emerald-100/60 px-2.5 py-1 rounded-xl border border-emerald-200">
          <ShieldCheck className="h-4 w-4" />
          <span>AES-256-GCM</span>
        </div>
      </div>

      {/* Backups Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
            <tr>
              <th className="p-3.5">Backup Snapshot File</th>
              <th className="p-3.5">Snapshot Date / Time</th>
              <th className="p-3.5">File Size</th>
              <th className="p-3.5">Encryption Mode</th>
              <th className="p-3.5 text-right">Integrity Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {backups.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-400 font-mono">
                  No previous backup snapshots recorded. Click "Create Instant Backup" above.
                </td>
              </tr>
            ) : (
              backups.map(b => {
                const status = verifyStatus[b.filename];
                return (
                  <tr key={b.filename} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900 truncate max-w-xs">
                      {b.filename}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(b.createdAt).toLocaleString('en-GB')}
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {(b.sizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                        {b.encrypted ? 'AES-256-GCM' : 'UNENCRYPTED'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {status === 'ok' ? (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center space-x-1">
                          <Check className="h-3 w-3" />
                          <span>PASSED (100% OK)</span>
                        </span>
                      ) : status === 'verifying' ? (
                        <span className="text-[11px] text-slate-400 font-bold">Verifying...</span>
                      ) : status === 'error' ? (
                        <span className="text-[11px] text-rose-600 font-bold">Failed Check</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVerifyIntegrity(b.filename)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[10px] border border-slate-200"
                        >
                          Verify Decrypt & Check
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
