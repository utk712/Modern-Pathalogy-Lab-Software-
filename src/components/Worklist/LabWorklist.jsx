import React, { useState, useEffect } from 'react';
import { useLab } from '../../context/LabContext';
import {
  FlaskConical,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Save,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  History,
  ShieldCheck,
  Check
} from 'lucide-react';
import { DEPARTMENTS, VIAL_TYPES } from '../../data/mockData';

export const LabWorklist = () => {
  const {
    patients,
    tests,
    selectedPatientId,
    setSelectedPatientId,
    updatePatientResults,
    simulateAnalyzerSync,
    setActiveTab
  } = useLab();

  const [activeDept, setActiveDept] = useState('all');
  const [patientSearch, setPatientSearch] = useState('');
  const [entryValues, setEntryValues] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Selected Patient
  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // Initialize entry values from selected patient
  useEffect(() => {
    if (activePatient) {
      setEntryValues(activePatient.results || {});
      setSavedSuccess(false);
    }
  }, [activePatient?.id, activePatient?.results]);

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.uhid.toLowerCase().includes(patientSearch.toLowerCase());
    return matchesSearch;
  });

  // Get active tests for this patient
  const patientTests = (activePatient?.tests || [])
    .map(tId => tests.find(t => t.id === tId))
    .filter(Boolean)
    .filter(t => activeDept === 'all' || t.department === activeDept);

  // Handle individual parameter change
  const handleParamChange = (paramId, val) => {
    setEntryValues(prev => {
      const updated = { ...prev, [paramId]: val === '' ? '' : (isNaN(val) ? val : Number(val)) };

      // Dynamic Auto-Calculations
      // 1. Lipid Calculations
      if (updated.cholesterol !== undefined && updated.hdl !== undefined && updated.triglycerides !== undefined) {
        const c = Number(updated.cholesterol);
        const h = Number(updated.hdl);
        const tg = Number(updated.triglycerides);
        if (tg > 0) updated.vldl = Number((tg / 5).toFixed(1));
        if (c > 0 && h > 0 && tg > 0) {
          updated.ldl = Number((c - h - (tg / 5)).toFixed(1));
          updated.chol_hdl_ratio = Number((c / h).toFixed(2));
          updated.ldl_hdl_ratio = Number((updated.ldl / h).toFixed(2));
        }
      }

      // 2. LFT Calculations
      if (updated.bili_total !== undefined && updated.bili_direct !== undefined) {
        updated.bili_indirect = Number((Number(updated.bili_total) - Number(updated.bili_direct)).toFixed(2));
      }
      if (updated.protein_total !== undefined && updated.albumin !== undefined) {
        updated.globulin = Number((Number(updated.protein_total) - Number(updated.albumin)).toFixed(2));
        if (updated.globulin > 0) {
          updated.ag_ratio = Number((Number(updated.albumin) / updated.globulin).toFixed(2));
        }
      }

      // 3. KFT BUN
      if (updated.urea !== undefined) {
        updated.bun = Number((Number(updated.urea) / 2.14).toFixed(1));
      }

      // 4. HbA1c eAG
      if (updated.hba1c !== undefined && updated.hba1c > 0) {
        updated.eag = Math.round((28.7 * Number(updated.hba1c)) - 46.7);
      }

      return updated;
    });
  };

  // Check Value Status (Normal, High, Low, Panic)
  const getParamFlag = (param, value, gender) => {
    if (value === undefined || value === '' || isNaN(value)) return null;
    const num = Number(value);
    const min = (gender === 'Female' && param.femaleMin !== undefined) ? param.femaleMin : param.min;
    const max = (gender === 'Female' && param.femaleMax !== undefined) ? param.femaleMax : param.max;

    if (param.panicHigh !== undefined && num >= param.panicHigh) {
      return { status: 'PANIC_HIGH', label: 'CRITICAL HIGH', color: 'bg-rose-600 text-white font-black animate-pulse' };
    }
    if (param.panicLow !== undefined && num <= param.panicLow) {
      return { status: 'PANIC_LOW', label: 'CRITICAL LOW', color: 'bg-rose-600 text-white font-black animate-pulse' };
    }
    if (max !== undefined && num > max) {
      return { status: 'HIGH', label: 'HIGH', color: 'bg-amber-100 text-amber-800 border border-amber-300 font-bold' };
    }
    if (min !== undefined && num < min) {
      return { status: 'LOW', label: 'LOW', color: 'bg-sky-100 text-sky-800 border border-sky-300 font-bold' };
    }
    return { status: 'NORMAL', label: 'NORMAL', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  };

  const handleSave = () => {
    if (!activePatient) return;
    updatePatientResults(activePatient.id, entryValues);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSimulateASTM = () => {
    if (!activePatient) return;
    setIsSyncing(true);
    setTimeout(() => {
      simulateAnalyzerSync(activePatient.id);
      setIsSyncing(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Laboratory Worklist & Result Entry</h1>
            <p className="text-xs text-slate-500">Live ASTM/HL7 analyzer ingestion, dynamic formulas, biological reference intervals, and delta checks</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSimulateASTM}
            disabled={isSyncing}
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
          >
            <Cpu className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Parsing ASTM Packets...' : 'Simulate Analyzer (ASTM/HL7) Sync'}</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save & Validate</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Patient List + Right Entry Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 4 Cols: Patient Queue List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Worklist Patients ({filteredPatients.length})
            </h3>
            <span className="text-[10px] text-slate-400">Click to load</span>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search UHID or Name..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="space-y-2 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
            {filteredPatients.map(p => {
              const isSelected = p.id === activePatient?.id;
              const hasCritical = Object.values(p.results || {}).some(v => v > 15 || v < 2);

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/90 border-amber-400 shadow-sm ring-1 ring-amber-400'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5 truncate">
                      {p.urgentTat && <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>}
                      <span className="font-bold text-xs text-slate-900 truncate">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                      {p.uhid}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{p.age}{p.gender.charAt(0)} • {p.sampleSource}</span>
                    
                    {p.status === 'AUTHORIZED' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Authorized
                      </span>
                    )}
                    {p.status === 'PENDING_APPROVAL' && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                        Dr Review
                      </span>
                    )}
                    {p.status === 'IN_TESTING' && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        In Testing
                      </span>
                    )}
                  </div>

                  {/* Vials Tags */}
                  <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-slate-200/60">
                    {p.samples.map(s => (
                      <span key={s.barcode} className="text-[9px] font-mono px-1 rounded bg-white text-slate-600 border border-slate-200">
                        {s.type}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Parameter Entry Table */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Active Patient Details Banner */}
          {activePatient && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-black text-slate-900">{activePatient.name}</span>
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {activePatient.uhid}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({activePatient.age} {activePatient.ageType} / {activePatient.gender})
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Ref Doctor: <strong className="text-slate-700">{activePatient.referringDoctor}</strong> • Center: {activePatient.b2bCenter}
                </p>
              </div>

              {/* Delta Check Warning Alert Box */}
              {activePatient.history && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 px-3 py-2 rounded-xl text-xs flex items-center space-x-2">
                  <History className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">Delta Check Active: </span>
                    <span>Previous Hb on {activePatient.history.lastVisitDate} was <strong>{activePatient.history.lastHb} g/dL</strong></span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Department Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {DEPARTMENTS.map(d => (
              <button
                key={d.id}
                onClick={() => setActiveDept(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeDept === d.id
                    ? 'bg-slate-900 text-white shadow-sm font-bold'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          {/* Save notification toast */}
          {savedSuccess && (
            <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>Results and auto-calculations saved successfully! Transferred to Pathologist Review.</span>
              </div>
              <button
                onClick={() => setActiveTab('doctor')}
                className="bg-white text-emerald-800 px-2.5 py-1 rounded-lg hover:bg-emerald-50 text-[11px] font-bold"
              >
                Go to Sign-Off →
              </button>
            </div>
          )}

          {/* Parameter Rows Grouped by Test */}
          <div className="space-y-4">
            {patientTests.map(test => (
              <div key={test.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                
                {/* Test Header */}
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{test.name}</span>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      {test.code}
                    </span>
                    <span className="text-[10px] text-slate-400">• Method: {test.method}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${VIAL_TYPES[test.sampleType]?.badgeClass || ''}`}>
                    {test.sampleType}
                  </span>
                </div>

                {/* Parameters Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-2">Parameter Name</th>
                        <th className="px-4 py-2 w-36">Result Value</th>
                        <th className="px-4 py-2">Units</th>
                        <th className="px-4 py-2">Reference Range</th>
                        <th className="px-4 py-2 text-center">Status Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {test.parameters.map((param, pIdx) => {
                        const pId = param.id || `${test.id}_${(param.shortName || param.name || pIdx).toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                        const val = entryValues[pId] ?? (param.id ? entryValues[param.id] : '') ?? '';
                        const flag = getParamFlag(param, val, activePatient?.gender);
                        const min = (activePatient?.gender === 'Female' && param.femaleMin !== undefined) ? param.femaleMin : param.min;
                        const max = (activePatient?.gender === 'Female' && param.femaleMax !== undefined) ? param.femaleMax : param.max;

                        return (
                          <tr key={pId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-medium text-slate-800">{param.name}</span>
                                {param.isCalculated && (
                                  <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">
                                    CALCULATED
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-2.5">
                              {param.isText ? (
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => handleParamChange(pId, e.target.value)}
                                  className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                                />
                              ) : (
                                <input
                                  type="number"
                                  step="0.01"
                                  readOnly={param.isCalculated}
                                  value={val}
                                  onChange={(e) => handleParamChange(pId, e.target.value)}
                                  placeholder={param.isCalculated ? 'Auto' : '0.00'}
                                  className={`w-full px-2.5 py-1 text-xs rounded-lg border font-mono font-bold transition-all ${
                                    param.isCalculated
                                      ? 'bg-slate-100 border-slate-200 text-indigo-900 cursor-not-allowed'
                                      : 'bg-white border-slate-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                                  }`}
                                />
                              )}
                            </td>

                            <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                              {param.unit || '-'}
                            </td>

                            <td className="px-4 py-2.5 text-slate-600 text-[11px]">
                              {min !== undefined && max !== undefined ? (
                                <span>{min} - {max}</span>
                              ) : param.defaultVal ? (
                                <span className="text-slate-400 italic">Normal: {param.defaultVal}</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            <td className="px-4 py-2.5 text-center">
                              {flag ? (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${flag.color}`}>
                                  {flag.label}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-[10px]">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            ))}
          </div>

          {/* Bottom Save Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>NABL Technical Validation Active</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save & Complete Entry</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
