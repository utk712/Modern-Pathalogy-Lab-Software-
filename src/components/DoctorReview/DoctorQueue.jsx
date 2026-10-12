import React, { useState, useEffect } from 'react';
import { useLab } from '../../context/LabContext';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  CheckCheck,
  FileText,
  Sparkles,
  UserCheck,
  MessageSquareQuote,
  ShieldCheck,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CLINICAL_REMARKS_PRESETS } from '../../data/mockData';

export const DoctorQueue = () => {
  const {
    patients,
    tests,
    pathologists,
    authorizeReport,
    batchAuthorize,
    selectedPatientId,
    setSelectedPatientId,
    setActiveTab,
    labProfile
  } = useLab();

  const defaultDocName = pathologists?.[0]?.name || labProfile?.pathologistName || 'Consultant Pathologist';
  const [filterMode, setFilterMode] = useState('pending'); // 'all' | 'pending' | 'critical' | 'authorized'
  const [selectedDoctor, setSelectedDoctor] = useState(defaultDocName);
  const [customRemarks, setCustomRemarks] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);

  // Active Patient
  const activePatient = (patients && patients.length > 0) ? (patients.find(p => p.id === selectedPatientId) || patients[0]) : null;

  // Sync remarks when active patient changes
  useEffect(() => {
    if (activePatient?.doctorReview?.remarks) {
      setCustomRemarks(activePatient.doctorReview.remarks);
    } else {
      setCustomRemarks('');
    }
  }, [activePatient?.id]);

  // Filtered List
  const filteredPatients = (patients || []).filter(p => {
    const matchesSearch =
      (p?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p?.uhid || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterMode === 'pending') return p.status !== 'AUTHORIZED';
    if (filterMode === 'critical') {
      return Object.values(p.results || {}).some(v => v > 15 || v < 2);
    }
    if (filterMode === 'authorized') return p.status === 'AUTHORIZED';
    return true;
  });

  const handleAuthorize = () => {
    if (!activePatient) return;
    authorizeReport(activePatient.id, selectedDoctor, customRemarks);
    
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (e) {}
  };

  const handleBatchSign = () => {
    if (selectedBatchIds.length === 0) {
      alert('Please select patients using the checkboxes to batch authorize.');
      return;
    }
    batchAuthorize(selectedBatchIds, selectedDoctor);
    setSelectedBatchIds([]);
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.7 }
      });
    } catch (e) {}
  };

  const handleToggleBatch = (id) => {
    setSelectedBatchIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Get active doctor details
  const activeDocObj = (pathologists && pathologists.length > 0 ? (pathologists.find(d => d.name === selectedDoctor) || pathologists[0]) : null) || {
    name: labProfile?.pathologistName || 'Consultant Pathologist',
    degree: labProfile?.pathologistDegree || 'MBBS, MD (Pathology)',
    regNo: labProfile?.mciRegNo || 'MCI-001',
    role: 'Chief Pathologist'
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Pathologist Review & Authorization Queue</h1>
            <p className="text-xs text-slate-500">Multi-level clinical verification, historical delta analysis, and digital signature sign-off</p>
          </div>
        </div>

        {/* Doctor Selector & Batch Sign-off */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <UserCheck className="h-4 w-4 text-slate-600" />
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="text-xs bg-transparent border-none focus:ring-0 font-bold text-slate-800"
            >
              {(pathologists && pathologists.length > 0 ? pathologists : [activeDocObj]).map(doc => (
                <option key={doc.id || doc.name} value={doc.name}>{doc.name} ({doc.degree})</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleBatchSign}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Batch Sign ({selectedBatchIds.length})</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 4 Cols: Queue Selector */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          
          {/* Filter Pills */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-semibold text-slate-600">
            {[
              { id: 'pending', label: 'Pending' },
              { id: 'critical', label: 'Critical' },
              { id: 'authorized', label: 'Signed' },
              { id: 'all', label: 'All' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id)}
                className={`py-1 rounded-lg transition-all text-center ${
                  filterMode === tab.id
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search UHID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="space-y-2 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
            {filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No patients found in this filter queue.
              </div>
            ) : (
              filteredPatients.map(p => {
                const isSelected = p.id === activePatient?.id;
                const hasCritical = Object.values(p.results || {}).some(v => v > 15 || v < 2);

                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border transition-all flex items-start space-x-2.5 ${
                      isSelected
                        ? 'bg-rose-50/80 border-rose-400 shadow-sm ring-1 ring-rose-400'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBatchIds.includes(p.id)}
                      onChange={() => handleToggleBatch(p.id)}
                      className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                    />

                    <div
                      onClick={() => setSelectedPatientId(p.id)}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{p.uhid}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{p.age}{p.gender?.charAt(0) || ''} • {(p.tests || []).length} Panels</span>

                        {p.status === 'AUTHORIZED' ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Signed
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Needs Sign-off
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 8 Cols: Clinical Verification Sheet */}
        <div className="lg:col-span-8 space-y-4">
          
          {activePatient ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              
              {/* Patient Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-black text-slate-900">{activePatient.name}</h2>
                    <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {activePatient.uhid}
                    </span>
                    {activePatient.urgentTat && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                        STAT PRIORITY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {activePatient.age} {activePatient.ageType} • {activePatient.gender} • Ref: {activePatient.referringDoctor} • Source: {activePatient.b2bCenter}
                  </p>
                </div>

                {activePatient.status === 'AUTHORIZED' && (
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center space-x-1.5"
                  >
                    <FileText className="h-4 w-4" />
                    <span>View Dispatch Report</span>
                  </button>
                )}
              </div>

              {/* Clinical Results Summary */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-sky-600" />
                  <span>Clinical Results & Biological Intervals</span>
                </h3>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Test / Parameter</th>
                        <th className="px-4 py-2.5">Observed Result</th>
                        <th className="px-4 py-2.5">Units</th>
                        <th className="px-4 py-2.5">Biological Reference Range</th>
                        <th className="px-4 py-2.5 text-center">Clinical Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(activePatient.tests || []).map((testItem, tIdx) => {
                        const test = typeof testItem === 'object' && testItem !== null 
                          ? testItem 
                          : (tests || []).find(t => t.id === testItem || t.name === testItem);
                        if (!test || !test.parameters || !Array.isArray(test.parameters) || test.parameters.length === 0) return null;

                        return test.parameters.map((param, pIdx) => {
                          const val = (typeof testItem === 'object' && testItem.results && testItem.results[param.id] !== undefined)
                            ? testItem.results[param.id]
                            : activePatient.results?.[param.id];
                          const min = (activePatient.gender === 'Female' && param.femaleMin !== undefined) ? param.femaleMin : param.min;
                          const max = (activePatient.gender === 'Female' && param.femaleMax !== undefined) ? param.femaleMax : param.max;
                          const isHigh = max !== undefined && val > max;
                          const isLow = min !== undefined && val < min;
                          const isPanic = (param.panicHigh && val >= param.panicHigh) || (param.panicLow && val <= param.panicLow);

                          return (
                            <tr key={param.id} className={isPanic ? 'bg-rose-50/50' : isHigh || isLow ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'}>
                              <td className="px-4 py-2.5 font-medium text-slate-800">
                                {param.name}
                              </td>
                              <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                                {val !== undefined ? (
                                  <span className={isPanic ? 'text-rose-600 font-black text-sm' : isHigh || isLow ? 'text-amber-700 font-bold' : ''}>
                                    {val}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 italic">Pending Entry</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                                {param.unit || '-'}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600 text-[11px]">
                                {min !== undefined && max !== undefined ? `${min} - ${max}` : param.defaultVal || '-'}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {isPanic ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white animate-pulse">
                                    CRITICAL PANIC
                                  </span>
                                ) : isHigh ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    HIGH ↑
                                  </span>
                                ) : isLow ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                    LOW ↓
                                  </span>
                                ) : val !== undefined ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    NORMAL
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Impressions & Remarks Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <MessageSquareQuote className="h-4 w-4 text-slate-500" />
                    <span>Clinical Impressions & Interpretations Library</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Click preset to append</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(CLINICAL_REMARKS_PRESETS || []).map((preset, idx) => {
                    const text = typeof preset === 'string' ? preset : preset?.text || '';
                    const title = typeof preset === 'string' ? (preset.length > 35 ? preset.slice(0, 35) + '...' : preset) : preset?.title || '';
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCustomRemarks(prev => (prev ? `${prev} ${text}` : text));
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                      >
                        + {title}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  rows={3}
                  placeholder="Enter custom clinical remarks, microscopy findings, or advice for the consulting doctor..."
                  value={customRemarks}
                  onChange={(e) => setCustomRemarks(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                />
              </div>

              {/* Doctor Digital Signature Banner */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">{activeDocObj.name}</p>
                  <p className="text-[11px] text-slate-500">{activeDocObj.degree} • Reg No: {activeDocObj.regNo || '-'}</p>
                  <p className="text-[10px] text-slate-400">{activeDocObj.role || 'Pathologist'}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right font-mono text-[11px] text-slate-400 hidden sm:block">
                    <span>Digital Signature Hash: </span>
                    <strong className="text-slate-600">eLab-{(activeDocObj.regNo || 'AUTH').slice(-4)}</strong>
                  </div>

                  <button
                    onClick={handleAuthorize}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center space-x-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Approve & Apply Digital Signature</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-600">No Patient Selected</p>
              <p className="text-xs text-slate-400">Select a patient from the queue or register a new patient to perform clinical review.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
