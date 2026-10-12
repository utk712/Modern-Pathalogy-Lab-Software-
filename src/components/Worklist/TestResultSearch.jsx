import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import {
  Search,
  Printer,
  FileText,
  Calendar,
  Filter,
  CheckSquare,
  Square,
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  Edit3,
  Sliders,
  Send,
  User,
  Activity,
  Layers,
  ArrowUpDown
} from 'lucide-react';

const TEST_COLOR_MAP = {
  TEST_CBC: 'bg-rose-500 text-white',
  TEST_LIPID: 'bg-amber-600 text-white',
  TEST_LFT: 'bg-emerald-600 text-white',
  TEST_KFT: 'bg-teal-600 text-white',
  TEST_THYROID: 'bg-purple-600 text-white',
  TEST_GLUCOSE_FBS: 'bg-sky-600 text-white',
  TEST_HBA1C: 'bg-indigo-600 text-white',
  TEST_URINE_R_M: 'bg-lime-700 text-white',
  TEST_CRP: 'bg-emerald-700 text-white'
};

export const TestResultSearch = () => {
  const {
    patients,
    tests,
    updatePatientResults,
    simulateAnalyzerSync,
    authorizeReport,
    addNotification,
    setSelectedPatientId,
    setActiveTab
  } = useLab();

  // Search Filters
  const [filterPatientName, setFilterPatientName] = useState('');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterTest, setFilterTest] = useState('');
  const [fromLabcode, setFromLabcode] = useState('');
  const [toLabcode, setToLabcode] = useState('');
  const [slotNumber, setSlotNumber] = useState('');
  const [category, setCategory] = useState('');
  const [collectionCenter, setCollectionCenter] = useState('');
  const [statusLevel, setStatusLevel] = useState('Default');

  // Main Stage Tabs: 'all' | 'reg_coll' | 'results_auth' | 'print_release' | 'tat'
  const [activeStageTab, setActiveStageTab] = useState('all');

  // Sub Status Filter Pill (14 Pills from screenshot)
  const [activeStatusPill, setActiveStatusPill] = useState('All');

  // Selected Checkboxes
  const [selectedIds, setSelectedIds] = useState([]);

  // Result Entry / Intermediate Notes Modal
  const [activePatientModal, setActivePatientModal] = useState(null);
  const [modalResults, setModalResults] = useState({});
  const [modalRemarks, setModalRemarks] = useState('');

  // Custom Parameter Addition state
  const [showAddCustomParam, setShowAddCustomParam] = useState(false);
  const [customParamsList, setCustomParamsList] = useState([]);
  const [newParamName, setNewParamName] = useState('');
  const [newParamVal, setNewParamVal] = useState('');
  const [newParamUnit, setNewParamUnit] = useState('g/dL');
  const [newParamRef, setNewParamRef] = useState('');

  // Column Filters
  const [colFilters, setColFilters] = useState({
    labCode: '',
    patientName: '',
    test: '',
    referredBy: '',
    collectionCenter: ''
  });

  // Calculate live badge counts
  const regCount = patients.filter(p => p.status === 'REGISTERED').length;
  const sampleCollCount = patients.filter(p => p.status === 'COLLECTED').length;
  const inTestingCount = patients.filter(p => p.status === 'IN_TESTING').length;
  const pendingAuthCount = patients.filter(p => p.status === 'PENDING_APPROVAL').length;
  const printedCount = patients.filter(p => p.status === 'AUTHORIZED').length;

  const stageCounts = {
    all: patients.length,
    regColl: regCount + sampleCollCount,
    resultsAuth: inTestingCount + pendingAuthCount,
    printRelease: printedCount,
    tat: patients.filter(p => p.urgentTat).length
  };

  // Filter patients list
  const filteredPatients = patients.filter(p => {
    // Stage Filter
    if (activeStageTab === 'reg_coll' && !(p.status === 'REGISTERED' || p.status === 'COLLECTED')) return false;
    if (activeStageTab === 'results_auth' && !(p.status === 'IN_TESTING' || p.status === 'PENDING_APPROVAL')) return false;
    if (activeStageTab === 'print_release' && p.status !== 'AUTHORIZED') return false;
    if (activeStageTab === 'tat' && !p.urgentTat) return false;

    // Sub Status Pill Filter
    if (activeStatusPill === 'Registration' && p.status !== 'REGISTERED') return false;
    if (activeStatusPill === 'Sample Coll' && p.status !== 'COLLECTED') return false;
    if (activeStatusPill === 'Pending' && p.status !== 'IN_TESTING') return false;
    if (activeStatusPill === 'Auth' && p.status !== 'AUTHORIZED') return false;
    if (activeStatusPill === 'Printed' && p.status !== 'AUTHORIZED') return false;

    // Search Fields
    if (filterPatientName && !p.name.toLowerCase().includes(filterPatientName.toLowerCase())) return false;
    if (fromLabcode && p.labCode && !p.labCode.includes(fromLabcode)) return false;
    if (collectionCenter && p.b2bCenter && !p.b2bCenter.toLowerCase().includes(collectionCenter.toLowerCase())) return false;

    // Column Filters
    if (colFilters.labCode && p.labCode && !p.labCode.toLowerCase().includes(colFilters.labCode.toLowerCase())) return false;
    if (colFilters.patientName && !p.name.toLowerCase().includes(colFilters.patientName.toLowerCase())) return false;
    if (colFilters.referredBy && p.referringDoctor && !p.referringDoctor.toLowerCase().includes(colFilters.referredBy.toLowerCase())) return false;
    if (colFilters.collectionCenter && p.b2bCenter && !p.b2bCenter.toLowerCase().includes(colFilters.collectionCenter.toLowerCase())) return false;

    return true;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPatients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPatients.map(p => p.id));
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleOpenResultModal = (patient) => {
    setActivePatientModal(patient);
    setModalResults(patient.results || {});
    setModalRemarks(patient.doctorReview?.remarks || '');
    setCustomParamsList(patient.customParameters || []);
    setShowAddCustomParam(false);
    setNewParamName('');
    setNewParamVal('');
    setNewParamUnit('g/dL');
    setNewParamRef('');
  };

  const handleAddCustomParam = (e) => {
    if (e) e.preventDefault();
    if (!newParamName.trim()) return;

    const paramId = `custom_${newParamName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    const newParamObj = {
      id: paramId,
      name: newParamName.trim(),
      unit: newParamUnit.trim(),
      defaultVal: newParamRef.trim() || 'Normal',
      min: undefined,
      max: undefined,
      isCustom: true
    };

    setCustomParamsList(prev => [...prev, newParamObj]);
    if (newParamVal.trim()) {
      setModalResults(prev => ({ ...prev, [paramId]: newParamVal.trim() }));
    }
    setNewParamName('');
    setNewParamVal('');
    setNewParamRef('');
  };

  const handleSaveModalResults = (e) => {
    e.preventDefault();
    if (!activePatientModal) return;

    if (customParamsList.length > 0) {
      activePatientModal.customParameters = customParamsList;
    }

    updatePatientResults(activePatientModal.id, modalResults);
    setActivePatientModal(null);
    addNotification('Results Saved', `Results updated for Lab Code ${activePatientModal.labCode || activePatientModal.uhid}.`, 'success');
  };

  const handleDirectPrintSelected = () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one patient record to print.');
      return;
    }
    const target = patients.find(p => p.id === selectedIds[0]);
    if (target) {
      setSelectedPatientId(target.id);
      setActiveTab('reports');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* ================= 1. TOP SEARCH & FILTER PANEL (TestResultSearch.aspx) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-xs space-y-3">
        
        {/* Row 1: Patient Name | From Date | To Date | Select Test */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-3 flex items-center space-x-2">
            <span className="w-24 font-semibold text-slate-700">Patient Name</span>
            <input
              type="text"
              value={filterPatientName}
              onChange={(e) => setFilterPatientName(e.target.value)}
              placeholder=""
              className="flex-1 bg-white border border-slate-300 rounded p-1.5 font-medium"
            />
          </div>

          <div className="sm:col-span-3 flex items-center space-x-2">
            <span className="w-20 font-semibold text-slate-700">From Date</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded p-1.5 font-mono"
            />
          </div>

          <div className="sm:col-span-3 flex items-center space-x-2">
            <span className="w-16 font-semibold text-slate-700">To Date</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded p-1.5 font-mono"
            />
          </div>

          <div className="sm:col-span-3 flex items-center space-x-2">
            <span className="w-20 font-semibold text-slate-700">Select Test</span>
            <input
              type="text"
              value={filterTest}
              onChange={(e) => setFilterTest(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded p-1.5"
            />
          </div>
        </div>

        {/* Row 2: Labcode (From/To) | Slot | Category | Collection Center | Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-3 flex items-center space-x-1.5">
            <span className="w-24 font-semibold text-slate-700">Labcode</span>
            <input
              type="text"
              placeholder="From Labcode"
              value={fromLabcode}
              onChange={(e) => setFromLabcode(e.target.value)}
              className="w-1/2 bg-white border border-slate-300 rounded p-1.5 font-mono"
            />
            <input
              type="text"
              placeholder="To Labcode"
              value={toLabcode}
              onChange={(e) => setToLabcode(e.target.value)}
              className="w-1/2 bg-white border border-slate-300 rounded p-1.5 font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={slotNumber}
              onChange={(e) => setSlotNumber(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-600"
            >
              <option value="">Select Slot Number</option>
              <option value="1">Slot 1 (Morning)</option>
              <option value="2">Slot 2 (Afternoon)</option>
              <option value="3">Slot 3 (Evening)</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center space-x-1.5">
            <span className="font-semibold text-slate-700 whitespace-nowrap">Test Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-600"
            >
              <option value="">Select Category</option>
              <option value="HEMATOLOGY">Hematology</option>
              <option value="BIOCHEMISTRY">Biochemistry</option>
              <option value="IMMUNOLOGY">Immunology</option>
              <option value="MICROBIOLOGY">Microbiology</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center space-x-1.5">
            <span className="font-semibold text-slate-700 whitespace-nowrap">Collection Center</span>
            <input
              type="text"
              value={collectionCenter}
              onChange={(e) => setCollectionCenter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-1.5"
            />
          </div>

          {/* Action Buttons matching screenshot */}
          <div className="sm:col-span-3 flex items-center justify-end space-x-2">
            <button
              onClick={handleDirectPrintSelected}
              className="px-4 py-1.5 bg-[#1a365d] hover:bg-[#15294a] text-white font-bold rounded text-xs shadow-sm transition-all flex items-center space-x-1"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Direct Print</span>
            </button>

            <button
              onClick={() => addNotification('Search Executed', `Found ${filteredPatients.length} patient records.`, 'info')}
              className="px-5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded text-xs shadow-sm transition-all"
            >
              Search
            </button>
          </div>
        </div>

        {/* Row 3: Status Level Dropdown */}
        <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
          <span className="font-semibold text-slate-700">Status Level</span>
          <select
            value={statusLevel}
            onChange={(e) => setStatusLevel(e.target.value)}
            className="bg-white border border-slate-300 rounded p-1 text-xs"
          >
            <option>Default</option>
            <option>Level 1 (Technician Entry)</option>
            <option>Level 2 (Doctor Review)</option>
            <option>Level 3 (Signed & Dispatched)</option>
          </select>
        </div>

      </div>

      {/* ================= 2. STAGE TABS (All | Reg & Coll | Results & Auth | Print & Release | TAT) ================= */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setActiveStageTab('all')}
          className={`px-4 py-2 rounded-t-xl font-bold flex items-center space-x-2 transition-all ${
            activeStageTab === 'all'
              ? 'bg-[#bbf7d0] text-[#14532d] border-t-2 border-emerald-600 shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>All</span>
          <span className="px-1.5 py-0.2 bg-emerald-800 text-white rounded text-[10px] font-mono">{stageCounts.all}</span>
        </button>

        <button
          onClick={() => setActiveStageTab('reg_coll')}
          className={`px-4 py-2 rounded-t-xl font-bold flex items-center space-x-2 transition-all ${
            activeStageTab === 'reg_coll'
              ? 'bg-[#fed7aa] text-[#7c2d12] border-t-2 border-orange-600 shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Edit3 className="h-4 w-4 text-orange-600" />
          <span>Registrations & Collection</span>
          <span className="px-1.5 py-0.2 bg-orange-700 text-white rounded text-[10px] font-mono">{stageCounts.regColl}</span>
        </button>

        <button
          onClick={() => setActiveStageTab('results_auth')}
          className={`px-4 py-2 rounded-t-xl font-bold flex items-center space-x-2 transition-all ${
            activeStageTab === 'results_auth'
              ? 'bg-[#bae6fd] text-[#0c4a6e] border-t-2 border-sky-600 shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FlaskConical className="h-4 w-4 text-sky-600" />
          <span>Results & Authorization</span>
          <span className="px-1.5 py-0.2 bg-sky-800 text-white rounded text-[10px] font-mono">{stageCounts.resultsAuth}</span>
        </button>

        <button
          onClick={() => setActiveStageTab('print_release')}
          className={`px-4 py-2 rounded-t-xl font-bold flex items-center space-x-2 transition-all ${
            activeStageTab === 'print_release'
              ? 'bg-[#bbf7d0] text-[#14532d] border-t-2 border-emerald-600 shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Printer className="h-4 w-4 text-emerald-600" />
          <span>Print & Release</span>
          <span className="px-1.5 py-0.2 bg-emerald-800 text-white rounded text-[10px] font-mono">{stageCounts.printRelease}</span>
        </button>

        <button
          onClick={() => setActiveStageTab('tat')}
          className={`px-4 py-2 rounded-t-xl font-bold flex items-center space-x-2 transition-all ${
            activeStageTab === 'tat'
              ? 'bg-[#fecdd3] text-[#881337] border-t-2 border-rose-600 shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="h-4 w-4 text-rose-600" />
          <span>Pending TAT</span>
          <span className="px-1.5 py-0.2 bg-rose-700 text-white rounded text-[10px] font-mono">{stageCounts.tat}</span>
        </button>
      </div>

      {/* ================= 3. SUB-STATUS PILLS (14 Exact Pills from Screenshot) ================= */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
        {[
          { label: 'All', count: patients.length, bg: 'bg-[#1e293b] text-white' },
          { label: 'Registration', count: regCount, bg: 'bg-[#dc2626] text-white' },
          { label: 'Sample Coll', count: sampleCollCount, bg: 'bg-[#d97706] text-white' },
          { label: 'Accen', count: 0, bg: 'bg-[#ea580c] text-white' },
          { label: 'Pending', count: inTestingCount, bg: 'bg-[#0284c7] text-white' },
          { label: 'Part Auth', count: 0, bg: 'bg-[#ca8a04] text-white' },
          { label: 'Auth', count: printedCount, bg: 'bg-[#d97706] text-white' },
          { label: 'Part Print', count: 0, bg: 'bg-[#65a30d] text-white' },
          { label: 'Printed', count: printedCount, bg: 'bg-[#16a34a] text-white' },
          { label: 'Part Disp', count: 0, bg: 'bg-[#0891b2] text-white' },
          { label: 'Dispatched', count: 0, bg: 'bg-[#7c3aed] text-white' },
          { label: 'Part Real', count: 0, bg: 'bg-[#c026d3] text-white' },
          { label: 'Release', count: 0, bg: 'bg-[#9f1239] text-white' },
          { label: 'Discard', count: 0, bg: 'bg-[#be123c] text-white' }
        ].map(pill => (
          <button
            key={pill.label}
            onClick={() => setActiveStatusPill(pill.label)}
            className={`px-3 py-1 rounded-full flex items-center space-x-1.5 transition-all ${pill.bg} ${
              activeStatusPill === pill.label ? 'ring-2 ring-slate-900 ring-offset-1 font-bold scale-105' : 'opacity-90 hover:opacity-100'
            }`}
          >
            <span>{pill.label}</span>
            <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono">
              {pill.count}
            </span>
          </button>
        ))}
      </div>

      {/* ================= 4. DATA TABLE WITH PER-COLUMN FILTERS & GREEN ROW HIGHLIGHT ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            
            {/* Header Row */}
            <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
              <tr>
                <th className="p-2.5 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredPatients.length && filteredPatients.length > 0}
                    onChange={handleSelectAll}
                    className="rounded cursor-pointer"
                  />
                </th>
                <th className="p-2.5">Lab Code</th>
                <th className="p-2.5">Patient Name</th>
                <th className="p-2.5">Selected Test</th>
                <th className="p-2.5">Regn Date</th>
                <th className="p-2.5 text-center">Age</th>
                <th className="p-2.5 text-center">Gen</th>
                <th className="p-2.5">Referred By</th>
                <th className="p-2.5">Collection Center</th>
                <th className="p-2.5 text-right">Total</th>
                <th className="p-2.5 text-right">Balance</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-center w-8">☰</th>
              </tr>

              {/* Sub-Filter Input Row under each column */}
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-1"></th>
                <th className="p-1">
                  <input
                    type="text"
                    value={colFilters.labCode}
                    onChange={(e) => setColFilters({ ...colFilters, labCode: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px] font-mono"
                  />
                </th>
                <th className="p-1">
                  <input
                    type="text"
                    value={colFilters.patientName}
                    onChange={(e) => setColFilters({ ...colFilters, patientName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px]"
                  />
                </th>
                <th className="p-1">
                  <input
                    type="text"
                    value={colFilters.test}
                    onChange={(e) => setColFilters({ ...colFilters, test: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px]"
                  />
                </th>
                <th className="p-1"></th>
                <th className="p-1"></th>
                <th className="p-1"></th>
                <th className="p-1">
                  <input
                    type="text"
                    value={colFilters.referredBy}
                    onChange={(e) => setColFilters({ ...colFilters, referredBy: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px]"
                  />
                </th>
                <th className="p-1">
                  <input
                    type="text"
                    value={colFilters.collectionCenter}
                    onChange={(e) => setColFilters({ ...colFilters, collectionCenter: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px]"
                  />
                </th>
                <th className="p-1"></th>
                <th className="p-1"></th>
                <th className="p-1"></th>
                <th className="p-1"></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 font-sans">
              {filteredPatients.map(p => {
                const isSelected = selectedIds.includes(p.id);
                const isPrinted = p.status === 'AUTHORIZED';

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isPrinted
                        ? 'bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#14532d]'
                        : 'bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(p.id)}
                        className="rounded cursor-pointer"
                      />
                    </td>

                    {/* Lab Accession Code */}
                    <td className="p-2.5 font-mono font-bold">
                      <button
                        onClick={() => handleOpenResultModal(p)}
                        className="text-[#0284c7] hover:underline font-bold"
                      >
                        {p.labCode || (p.uhid ? String(p.uhid).replace('UHID-', '1608260') : '160826001')}
                      </button>
                    </td>

                    {/* Patient Name */}
                    <td className="p-2.5 font-bold uppercase tracking-tight">
                      <button
                        onClick={() => handleOpenResultModal(p)}
                        className="hover:underline text-left"
                      >
                        {p.name}
                      </button>
                    </td>

                    {/* Selected Test Color Badges */}
                    <td className="p-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(p.tests || []).map((tItem, idx) => {
                          const tId = typeof tItem === 'string' ? tItem : (tItem?.testId || tItem?.id || `T_${idx}`);
                          const shortName = typeof tItem === 'string' ? tItem.replace('TEST_', '').replace('_', ' ') : (tItem?.name || tItem?.testId || 'Test');
                          const badgeClass = TEST_COLOR_MAP[tId] || 'bg-slate-700 text-white';
                          return (
                            <span
                              key={tId + '_' + idx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}
                            >
                              {shortName}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Regn Date */}
                    <td className="p-2.5 font-mono text-[11px] text-slate-600">
                      {p.registrationDate}
                    </td>

                    {/* Age / Gender */}
                    <td className="p-2.5 text-center font-mono">{p.age}</td>
                    <td className="p-2.5 text-center font-bold">{p.gender ? p.gender.charAt(0) : 'M'}</td>

                    {/* Referred By */}
                    <td className="p-2.5 font-medium text-slate-700">
                      {p.referringDoctor || 'Self / Walk-in'}
                    </td>

                    {/* Collection Center */}
                    <td className="p-2.5 font-medium text-slate-700">
                      {p.b2bCenter || 'Gondiya Care'}
                    </td>

                    {/* Total / Balance */}
                    <td className="p-2.5 text-right font-mono font-bold">
                      {p.billing?.grossTotal || 400}
                    </td>
                    <td className="p-2.5 text-right font-mono text-slate-600">
                      {p.billing?.dueAmount ?? (p.billing?.grossTotal || 400)}
                    </td>

                    {/* Status */}
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPrinted
                          ? 'bg-emerald-700 text-white'
                          : p.status === 'REGISTERED'
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {isPrinted ? 'Printed' : p.status === 'REGISTERED' ? 'Registration' : p.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenResultModal(p)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"
                          title="Edit / Enter Results"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatientId(p.id);
                            setActiveTab('reports');
                          }}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[10px] flex items-center space-x-1 cursor-pointer"
                          title="View & Print Patient Report"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Report</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredPatients.length} patient records</span>
          <div className="flex items-center space-x-2">
            <span>Selected: {selectedIds.length}</span>
            <button
              onClick={handleDirectPrintSelected}
              className="px-3 py-1 bg-slate-900 text-white rounded font-bold text-[11px]"
            >
              Direct Print Selected
            </button>
          </div>
        </div>
      </div>

      {/* ================= 5. RESULT ENTRY & INTERMEDIATE NOTES MODAL ================= */}
      {activePatientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-base text-slate-900">
                    Test Results & Intermediate Notes Entry
                  </h3>
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-sky-100 text-sky-800 text-xs">
                    Labcode: {activePatientModal.labCode || activePatientModal.uhid}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: <strong className="text-slate-800">{activePatientModal.name}</strong> • {activePatientModal.age}y / {activePatientModal.gender} • Ref: {activePatientModal.referringDoctor}
                </p>
              </div>

              {/* 1-Click Analyzer Sync Button */}
              <button
                type="button"
                onClick={() => {
                  simulateAnalyzerSync(activePatientModal.id);
                  setActivePatientModal(null);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Simulate Machine Sync</span>
              </button>
            </div>

            <form onSubmit={handleSaveModalResults} className="space-y-4 text-xs">
              
              {/* Parameters List for this Patient's Ordered Tests & Custom Parameter Addition */}
              {(() => {
                const orderedTests = Array.isArray(activePatientModal.tests) ? activePatientModal.tests : [];
                const testPanelsToRender = [];

                orderedTests.forEach(tItem => {
                  let testObj = null;
                  if (typeof tItem === 'string') {
                    testObj = tests.find(x => x.id === tItem || x.code === tItem || x.name?.toLowerCase() === tItem.toLowerCase());
                  } else if (typeof tItem === 'object' && tItem !== null) {
                    const matched = tests.find(x => x.id === tItem.id || x.id === tItem.testId || x.code === tItem.code || x.name === tItem.name);
                    testObj = {
                      id: tItem.id || tItem.testId || matched?.id || 'CUSTOM_PANEL',
                      name: tItem.name || matched?.name || 'Diagnostic Panel',
                      code: tItem.code || matched?.code || 'TST',
                      department: tItem.department || matched?.department || 'General Pathology',
                      parameters: (tItem.parameters && tItem.parameters.length > 0) ? tItem.parameters : (matched?.parameters || [])
                    };
                  }

                  if (!testObj && typeof tItem === 'string') {
                    testObj = {
                      id: tItem,
                      name: tItem,
                      code: tItem.substring(0, 4).toUpperCase(),
                      department: 'General Pathology',
                      parameters: [
                        { id: `${tItem.toLowerCase().replace(/[^a-z0-9]/g, '_')}_val`, name: tItem, unit: 'val', min: 0, max: 100, defaultVal: 'Normal' }
                      ]
                    };
                  }

                  if (testObj) {
                    const sanitizedParams = (testObj.parameters || []).map((p, pIdx) => {
                      const pSlug = (p.id || p.shortName || p.name || `p_${pIdx + 1}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
                      const uniqueId = (p.id && String(p.id).trim() !== '') ? String(p.id) : `${testObj.id || 'test'}_${pSlug}`;
                      return {
                        ...p,
                        id: uniqueId
                      };
                    });
                    testPanelsToRender.push({
                      ...testObj,
                      parameters: sanitizedParams
                    });
                  }
                });

                // Fallback to master catalog CBC/Biochemistry panel if patient has no parameters
                if (testPanelsToRender.length === 0) {
                  const fallbackTest = tests.find(x => x.id === 'TEST_CBC') || tests[0];
                  if (fallbackTest) {
                    const sanitizedParams = (fallbackTest.parameters || []).map((p, pIdx) => ({
                      ...p,
                      id: p.id || `TEST_CBC_${(p.shortName || p.name || pIdx).toLowerCase().replace(/[^a-z0-9]/g, '_')}`
                    }));
                    testPanelsToRender.push({ ...fallbackTest, parameters: sanitizedParams });
                  }
                }

                return (
                  <div className="space-y-4">
                    
                    {/* Top Action Bar for Parameters + Add Custom Parameter Button */}
                    <div className="flex items-center justify-between bg-slate-100/90 p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800 text-xs">
                        Ordered Test Parameter Sheet ({testPanelsToRender.reduce((acc, t) => acc + (t.parameters?.length || 0), 0) + customParamsList.length} Parameters)
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => setShowAddCustomParam(!showAddCustomParam)}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{showAddCustomParam ? '✕ Close Custom Parameter Form' : '➕ Add Custom Parameter / Extra Value'}</span>
                      </button>
                    </div>

                    {/* Inline Form to Add Manual Custom Parameter */}
                    {showAddCustomParam && (
                      <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3.5 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-amber-900 text-xs flex items-center space-x-1.5">
                            <span>➕ Add Manual Custom Parameter to Result Sheet</span>
                          </h5>
                          <span className="text-[10px] text-amber-700 font-medium">Adds new custom test field on the fly</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="text-[10px] font-bold text-amber-800 block mb-0.5">Parameter Name *</label>
                            <input
                              type="text"
                              placeholder="e.g. Vitamin D3, Calcium"
                              value={newParamName}
                              onChange={(e) => setNewParamName(e.target.value)}
                              className="w-full bg-white border border-amber-300 rounded p-1.5 font-semibold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-amber-800 block mb-0.5">Result Value</label>
                            <input
                              type="text"
                              placeholder="e.g. 9.5"
                              value={newParamVal}
                              onChange={(e) => setNewParamVal(e.target.value)}
                              className="w-full bg-white border border-amber-300 rounded p-1.5 font-bold font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-amber-800 block mb-0.5">Unit</label>
                            <input
                              type="text"
                              placeholder="e.g. mg/dL, ng/mL, %"
                              value={newParamUnit}
                              onChange={(e) => setNewParamUnit(e.target.value)}
                              className="w-full bg-white border border-amber-300 rounded p-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-amber-800 block mb-0.5">Reference Range</label>
                            <input
                              type="text"
                              placeholder="e.g. 8.5 - 10.5"
                              value={newParamRef}
                              onChange={(e) => setNewParamRef(e.target.value)}
                              className="w-full bg-white border border-amber-300 rounded p-1.5 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={handleAddCustomParam}
                            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow"
                          >
                            Add to Result Sheet
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Ordered Tests Parameter Panels */}
                    {testPanelsToRender.map(testObj => (
                      <div key={testObj.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                          <h4 className="font-bold text-slate-900 uppercase text-xs flex items-center space-x-2">
                            <span>{testObj.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                              {testObj.code || 'PANEL'}
                            </span>
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Dept: {testObj.department || 'Pathology'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {(testObj.parameters || []).map((param, pIdx) => {
                            const paramKey = param.id || `${testObj.id}_p_${pIdx}`;
                            const val = modalResults[paramKey] ?? '';
                            const num = Number(val);
                            let flagBadge = null;
                            if (val !== '' && !isNaN(num)) {
                              if (param.max !== undefined && num > param.max) {
                                flagBadge = <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">HIGH ▲</span>;
                              } else if (param.min !== undefined && num < param.min) {
                                flagBadge = <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-300">LOW ▼</span>;
                              } else if (param.min !== undefined || param.max !== undefined) {
                                flagBadge = <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">NORMAL</span>;
                              }
                            }

                            return (
                              <div key={paramKey} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1 hover:border-sky-300 transition-all">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="font-semibold text-slate-700 truncate mr-1">{param.name}</span>
                                  <span className="text-slate-400 font-mono text-[10px] shrink-0">{param.unit}</span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  <input
                                    type="text"
                                    placeholder={param.defaultVal || 'Value'}
                                    value={val}
                                    onChange={(e) => setModalResults(prev => ({ ...prev, [paramKey]: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                  />
                                  {flagBadge}
                                </div>
                                <span className="text-[9px] text-slate-400 block font-mono">
                                  Ref: {param.min !== undefined ? `${param.min} - ${param.max}` : (param.defaultVal || 'Normal')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Added Custom Parameters Panel (if any) */}
                    {customParamsList.length > 0 && (
                      <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/40 space-y-3">
                        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                          <h4 className="font-bold text-amber-900 uppercase text-xs flex items-center space-x-2">
                            <span>Manually Added Custom Parameters ({customParamsList.length})</span>
                          </h4>
                          <span className="text-[10px] text-amber-700 font-mono">Custom Extra Fields</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {customParamsList.map(param => (
                            <div key={param.id} className="bg-white p-2.5 rounded-lg border border-amber-200 space-y-1">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="font-semibold text-slate-800">{param.name}</span>
                                <span className="text-amber-600 font-mono text-[10px]">{param.unit}</span>
                              </div>
                              <input
                                type="text"
                                placeholder={param.defaultVal || 'Value'}
                                value={modalResults[param.id] ?? ''}
                                onChange={(e) => setModalResults({ ...modalResults, [param.id]: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono font-bold text-slate-900 focus:bg-white"
                              />
                              <span className="text-[9px] text-slate-400 block font-mono">
                                Ref: {param.defaultVal || 'Normal'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })()}

              {/* Intermediate Notes & Pathologist Clinical Impressions */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">
                  Intermediate Observations & Pathologist Clinical Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter intermediate microscopic notes, morphological findings, or clinical advice..."
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    authorizeReport(activePatientModal.id, 'Dr. Pallavi Gedam', modalRemarks);
                    setActivePatientModal(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Authorize & Sign-Off Report</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setActivePatientModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    Save Results
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
