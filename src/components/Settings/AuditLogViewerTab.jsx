import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, RefreshCw, FileSpreadsheet, Lock } from 'lucide-react';

export const AuditLogViewerTab = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/audit-logs?limit=200');
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (err) {
      console.warn('Could not fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l =>
    (l.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.entity_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.details || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>Immutable Clinical Audit Trail (NABL / ISO 15189:2022 Mandate)</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
              🔒 IMMUTABLE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Silently records all logins, result updates, patient registrations, and report releases. Zero delete or edit capability in API or UI.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative w-48 sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, action, UHID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="button"
            onClick={fetchLogs}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 sticky top-0 z-10">
              <tr>
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">User & Role</th>
                <th className="p-3">Clinical Action</th>
                <th className="p-3">Entity ID</th>
                <th className="p-3">Details / Value Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-mono">
                    No matching audit trail events found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{log.username}</p>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">{log.role}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        log.action.includes('RELEASE')
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : log.action.includes('UPDATE')
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800 text-[11px]">
                      {log.entity_id || '—'}
                    </td>
                    <td className="p-3 text-[11px] text-slate-600 max-w-md">
                      {log.old_value !== null && log.new_value !== null ? (
                        <div className="font-mono text-[10px]">
                          <span className="line-through text-rose-600">{log.old_value}</span>
                          {' → '}
                          <span className="font-bold text-emerald-600">{log.new_value}</span>
                        </div>
                      ) : (
                        <span>{log.details || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
