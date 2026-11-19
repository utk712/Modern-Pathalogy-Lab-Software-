import React, { useState, useEffect } from 'react';
import { Network, Server, Monitor, CheckCircle2, AlertTriangle, RefreshCw, Save, ShieldCheck } from 'lucide-react';

export const NetworkSettingsTab = () => {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [mode, setMode] = useState('server');
  const [hostIp, setHostIp] = useState('127.0.0.1');
  const [port, setPort] = useState(5000);
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [feedback, setFeedback] = useState('');

  const fetchNetworkInfo = async () => {
    try {
      const res = await fetch('/api/network/info');
      if (res.ok) {
        const data = await res.json();
        setNetworkInfo(data);
        if (data.config) {
          setMode(data.config.mode || 'server');
          setHostIp(data.config.hostIp || '127.0.0.1');
          setPort(data.config.port || 5000);
        }
      }
    } catch (err) {
      console.warn('Could not fetch network info:', err);
    }
  };

  useEffect(() => {
    fetchNetworkInfo();
  }, []);

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const target = `http://${hostIp}:${port}/api/health`;
      const res = await fetch(target, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const json = await res.json();
        setTestStatus({ success: true, message: `Connected to Central Server! Status: ${json.status}` });
      } else {
        setTestStatus({ success: false, message: `Server responded with HTTP ${res.status}` });
      }
    } catch (err) {
      setTestStatus({ success: false, message: `Could not connect to ${hostIp}:${port} (${err.message})` });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback('');
    try {
      const res = await fetch('/api/network/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, hostIp, port: Number(port) })
      });
      if (res.ok) {
        setFeedback('✅ Network configuration saved successfully! Restart application to apply changes.');
        fetchNetworkInfo();
      } else {
        setFeedback('Failed to save network configuration.');
      }
    } catch (err) {
      setFeedback('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Network className="h-5 w-5 text-indigo-600" />
            <span>Multi-PC Local Network Setup (LAN Server vs Client Mode)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure whether this PC acts as the Central Database Server or as a Client Workstation (Reception, Doctor, or Lab PC).
          </p>
        </div>
        <button
          type="button"
          onClick={fetchNetworkInfo}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          title="Refresh Network Status"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setMode('server')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
            mode === 'server'
              ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
              <Server className="h-4 w-4" />
              <span>SERVER MODE (Central Host PC)</span>
            </div>
            {mode === 'server' && <span className="h-2 w-2 rounded-full bg-indigo-600"></span>}
          </div>
          <p className="text-[11px] text-slate-600">
            This computer runs the Node.js backend engine, active SQLite WAL database, and ASTM/HL7 analyzer socket listeners.
          </p>
        </div>

        <div
          onClick={() => setMode('client')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
            mode === 'client'
              ? 'border-sky-600 bg-sky-50/50 shadow-sm'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sky-700 font-bold text-xs">
              <Monitor className="h-4 w-4" />
              <span>CLIENT MODE (Connected Workstation)</span>
            </div>
            {mode === 'client' && <span className="h-2 w-2 rounded-full bg-sky-600"></span>}
          </div>
          <p className="text-[11px] text-slate-600">
            For Reception, Doctor, or Phlebotomist PCs. Connects directly across the local LAN to the Server PC.
          </p>
        </div>
      </div>

      {/* Active IP Addresses Banner for Server Mode */}
      {mode === 'server' && networkInfo?.lanAddresses && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <p className="text-xs font-bold text-slate-800">
            📡 Active Local Network (LAN) IP Addresses for Client PCs:
          </p>
          <p className="text-[11px] text-slate-500">
            Enter any of these addresses on client computers in your laboratory to connect to this server:
          </p>
          <div className="space-y-1.5 pt-1">
            {networkInfo.lanAddresses.map((addr, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs font-mono">
                <span className="font-bold text-slate-700">{addr.interface}:</span>
                <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  http://{addr.ip}:{networkInfo.port || 5000}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client Configuration Inputs */}
      {mode === 'client' && (
        <div className="space-y-3 p-4 bg-sky-50/60 rounded-2xl border border-sky-200 text-xs">
          <p className="font-bold text-sky-950">Host Server Connection Settings:</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700">Central Server LAN IP Address</label>
              <input
                type="text"
                value={hostIp}
                onChange={(e) => setHostIp(e.target.value)}
                placeholder="e.g. 192.168.1.10"
                className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Server Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={handleTestConnection}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs"
            >
              Test Connection to Server
            </button>
            {testStatus && (
              <span className={`text-xs font-bold ${testStatus.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                {testStatus.message}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 cursor-pointer transition-all"
      >
        <Save className="h-4 w-4" />
        <span>{isSaving ? 'Saving...' : 'Save Network Mode'}</span>
      </button>
    </div>
  );
};
