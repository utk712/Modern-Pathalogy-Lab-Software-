import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import {
  LineChart as ChartIcon,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  Sliders,
  Calendar,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Dot
} from 'recharts';

export const QualityControl = () => {
  const { qcRuns, addQcRun } = useLab();
  const [selectedParam, setSelectedParam] = useState('Glucose');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newRun, setNewRun] = useState({
    date: new Date().toISOString().split('T')[0],
    parameter: 'Glucose',
    level: 'Level 2 Normal',
    value: 100.5,
    mean: 100.0,
    sd: 2.5
  });

  const filteredRuns = (qcRuns || []).filter(r => r.parameter === selectedParam);
  const mean = filteredRuns[0]?.mean || 100.0;
  const sd = filteredRuns[0]?.sd || 2.5;

  const handleAddRun = (e) => {
    e.preventDefault();
    addQcRun({
      ...newRun,
      value: Number(newRun.value),
      mean: Number(newRun.mean),
      sd: Number(newRun.sd)
    });
    setShowAddModal(false);
  };

  const violationsCount = filteredRuns.filter(r => (r.ruleStatus || '').includes('VIOLATION')).length;
  const warningsCount = filteredRuns.filter(r => (r.ruleStatus || '').includes('WARN')).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            <ChartIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Internal Quality Control (IQC) & Westgard Rules</h1>
            <p className="text-xs text-slate-500">Daily Levey-Jennings (L-J) Charts, standard deviation bounds, and automated violation alerts for NABL compliance</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedParam}
            onChange={(e) => setSelectedParam(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="Glucose">Glucose Control (Level 2 Normal)</option>
            <option value="Hemoglobin">Hemoglobin (Sysmex Control)</option>
            <option value="Cholesterol">Cholesterol (Roche Multichem)</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Log Daily Run</span>
          </button>
        </div>
      </div>

      {/* QC Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 text-xs font-medium">Control Target (Mean)</span>
          <p className="text-xl font-mono font-bold text-slate-900 mt-1">{mean} mg/dL</p>
          <span className="text-[10px] text-slate-400">Assigned Assay Target</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 text-xs font-medium">Standard Deviation (1 SD)</span>
          <p className="text-xl font-mono font-bold text-slate-900 mt-1">± {sd}</p>
          <span className="text-[10px] text-slate-400">Target Range: {mean - 2 * sd} to {mean + 2 * sd}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <span className="text-amber-800 text-xs font-bold">1:2s Warnings</span>
          <p className="text-xl font-mono font-bold text-amber-700 mt-1">{warningsCount}</p>
          <span className="text-[10px] text-amber-600">Points between 2SD & 3SD</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/40 shadow-sm">
          <span className="text-rose-800 text-xs font-bold">Westgard Violations (Rejections)</span>
          <p className="text-xl font-mono font-bold text-rose-600 mt-1">{violationsCount}</p>
          <span className="text-[10px] text-rose-600">Calibration / Re-run Required</span>
        </div>
      </div>

      {/* Levey-Jennings (L-J) Interactive Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Levey-Jennings (L-J) Plot — {selectedParam}
            </h2>
            <p className="text-xs text-slate-500">Daily control runs plotted against target mean and SD limits</p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="flex items-center space-x-1 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Mean: {mean}</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span>±2SD: {mean - 2*sd} / {mean + 2*sd}</span>
            </span>
            <span className="flex items-center space-x-1 text-rose-700">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span>±3SD: {mean - 3*sd} / {mean + 3*sd}</span>
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredRuns} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis
                domain={[mean - 4 * sd, mean + 4 * sd]}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
              />

              {/* Reference SD Lines */}
              <ReferenceLine y={mean + 3 * sd} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: '+3 SD', fill: '#f43f5e', fontSize: 10, position: 'right' }} />
              <ReferenceLine y={mean + 2 * sd} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '+2 SD', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
              <ReferenceLine y={mean + 1 * sd} stroke="#94a3b8" strokeDasharray="2 2" />
              <ReferenceLine y={mean} stroke="#10b981" strokeWidth={2} label={{ value: 'Mean', fill: '#10b981', fontSize: 11, position: 'right' }} />
              <ReferenceLine y={mean - 1 * sd} stroke="#94a3b8" strokeDasharray="2 2" />
              <ReferenceLine y={mean - 2 * sd} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '-2 SD', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
              <ReferenceLine y={mean - 3 * sd} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: '-3 SD', fill: '#f43f5e', fontSize: 10, position: 'right' }} />

              <Line
                type="monotone"
                dataKey="value"
                stroke="#0d9488"
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const isViolation = payload.ruleStatus.includes('VIOLATION');
                  const isWarn = payload.ruleStatus.includes('WARN');
                  const fill = isViolation ? '#e11d48' : isWarn ? '#d97706' : '#0d9488';
                  return (
                    <circle
                      key={`dot-${payload.date}`}
                      cx={cx}
                      cy={cy}
                      r={isViolation ? 6 : isWarn ? 5 : 4}
                      fill={fill}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* QC Runs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recent Control Runs & Audit Log ({filteredRuns.length} Runs)
          </h3>
          <span className="text-xs text-slate-400">NABL Quality Record F-09</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Control Level</th>
                <th className="px-4 py-2.5">Observed Value</th>
                <th className="px-4 py-2.5">SD Shift (Z-Score)</th>
                <th className="px-4 py-2.5 text-center">Westgard Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRuns.slice().reverse().map((run, i) => {
                const zScore = ((run.value - run.mean) / run.sd).toFixed(2);
                return (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-slate-700">{run.date}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{run.level}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{run.value}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">{zScore > 0 ? `+${zScore}` : zScore} SD</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        run.ruleStatus.includes('VIOLATION')
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : run.ruleStatus.includes('WARN')
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {run.ruleStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add QC Run Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddRun} className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-teal-600">
              <Activity className="h-6 w-6" />
              <h3 className="font-bold text-base text-slate-900">Log Daily Quality Control Run</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assay Parameter</label>
                <select
                  value={newRun.parameter}
                  onChange={(e) => setNewRun({ ...newRun, parameter: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                >
                  <option value="Glucose">Glucose (mg/dL)</option>
                  <option value="Hemoglobin">Hemoglobin (g/dL)</option>
                  <option value="Cholesterol">Total Cholesterol (mg/dL)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observed Value <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newRun.value}
                  onChange={(e) => setNewRun({ ...newRun, value: e.target.value })}
                  className="w-full font-mono font-bold bg-white border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Mean</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRun.mean}
                    onChange={(e) => setNewRun({ ...newRun, mean: e.target.value })}
                    className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned 1 SD</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRun.sd}
                    onChange={(e) => setNewRun({ ...newRun, sd: e.target.value })}
                    className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-600/20"
              >
                Save Control Point
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
