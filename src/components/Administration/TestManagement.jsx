import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import { exportToExcel } from '../../utils/exportToExcel';
import { MASTER_DEPARTMENTS, MASTER_TEST_CATALOG } from '../../data/masterTestCatalog';
import {
  TEST_CATEGORIES_MASTER,
  TEST_GROUPS_MASTER,
  TEST_UNITS_MASTER,
  INITIAL_TEST_PROFILES
} from '../../data/testMastersData';

const TEST_CATALOG_EXPORT_COLUMNS = [
  { label: 'Test Code', key: 'code' },
  { label: 'Test Name', key: 'name' },
  { label: 'Display Name', key: 'displayName' },
  { label: 'Short Name', key: 'shortName' },
  { label: 'Category', key: 'category' },
  { label: 'Department', key: 'department' },
  { label: 'Sample / Container', key: (t) => t.container || t.sampleType || 'Serum' },
  { label: 'TAT', key: 'tat' },
  { label: 'MRP (INR)', key: 'price' },
  { label: 'B2B Franchise Rate (INR)', key: 'b2bPrice' },
  { label: 'Parameters Count', key: (t) => t.parameters?.length || 0 },
  { label: 'Parameter Names', key: (t) => t.parameters?.map(p => p.name).join(' | ') || '' }
];
import {
  FlaskConical,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  CheckCircle2,
  Filter,
  Sliders,
  DollarSign,
  Tag,
  ArrowUpDown,
  FileText,
  Activity,
  Droplets,
  TestTube,
  ShieldAlert,
  Bug,
  Dna,
  Scan,
  Clock,
  Save,
  X,
  ChevronsRight,
  ChevronsLeft,
  ArrowRight,
  ArrowLeft,
  ListTree,
  Building2,
  Package,
  FileSpreadsheet
} from 'lucide-react';

export const TestManagement = () => {
  const { testMgmtSubTab, setTestMgmtSubTab, addNotification } = useLab();

  // Active Sub-Tab Safeguard
  const VALID_SUBTABS = ['parameter_master', 'profile_details', 'category_master', 'group_master', 'unit_master', 'rate_master', 'complete_list'];
  const activeSubTab = VALID_SUBTABS.includes(testMgmtSubTab) ? testMgmtSubTab : 'parameter_master';
  const setActiveSubTab = setTestMgmtSubTab;

  // Master State Data
  const [catalog, setCatalog] = useState(MASTER_TEST_CATALOG);
  const [categories, setCategories] = useState(TEST_CATEGORIES_MASTER);
  const [groups, setGroups] = useState(TEST_GROUPS_MASTER);
  const [units, setUnits] = useState(TEST_UNITS_MASTER);
  const [profiles, setProfiles] = useState(() => {
    try {
      const saved = localStorage.getItem('pulselab_custom_test_profiles');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_TEST_PROFILES;
  });

  // Complete List Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  // Rate Master Search & Filters
  const [rateSearchQuery, setRateSearchQuery] = useState('');
  const [rateDeptFilter, setRateDeptFilter] = useState('all');

  // ================= 1. STATE FOR TEST PARAMETER MASTER (TestParameterDetails.aspx) =================
  const [testDisplayType, setTestDisplayType] = useState('Display Name');
  const [testSearchInput, setTestSearchInput] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('TEST_CBC');
  const [selectedParamIdx, setSelectedParamIdx] = useState(0);

  const activeTest = catalog.find(t => t.id === selectedTestId) || catalog[0];
  const currentParameters = activeTest?.parameters || [];

  const filteredTestsForParam = catalog.filter(t => {
    if (!testSearchInput) return true;
    const query = testSearchInput.toLowerCase();
    return (t.name && t.name.toLowerCase().includes(query)) ||
           (t.displayName && t.displayName.toLowerCase().includes(query)) ||
           (t.shortName && t.shortName.toLowerCase().includes(query)) ||
           (t.code && t.code.includes(query));
  });

  // Parameter Reordering
  const handleMoveParamUp = () => {
    if (selectedParamIdx <= 0) return;
    const newParams = [...currentParameters];
    const temp = newParams[selectedParamIdx - 1];
    newParams[selectedParamIdx - 1] = newParams[selectedParamIdx];
    newParams[selectedParamIdx] = temp;

    setCatalog(prev => prev.map(t => t.id === activeTest.id ? { ...t, parameters: newParams } : t));
    setSelectedParamIdx(selectedParamIdx - 1);
  };

  const handleMoveParamDown = () => {
    if (selectedParamIdx >= currentParameters.length - 1) return;
    const newParams = [...currentParameters];
    const temp = newParams[selectedParamIdx + 1];
    newParams[selectedParamIdx + 1] = newParams[selectedParamIdx];
    newParams[selectedParamIdx] = temp;

    setCatalog(prev => prev.map(t => t.id === activeTest.id ? { ...t, parameters: newParams } : t));
    setSelectedParamIdx(selectedParamIdx + 1);
  };

  // Add / Edit Parameter Modal
  const [showParamModal, setShowParamModal] = useState(false);
  const [editingParamIdx, setEditingParamIdx] = useState(null);
  const [paramFormData, setParamFormData] = useState({
    name: '',
    shortName: '',
    unit: '',
    normalMale: '',
    normalFemale: '',
    method: ''
  });

  const handleOpenAddParam = () => {
    setEditingParamIdx(null);
    setParamFormData({ name: '', shortName: '', unit: '', normalMale: '', normalFemale: '', method: '' });
    setShowParamModal(true);
  };

  const handleOpenEditParam = () => {
    if (currentParameters.length === 0) return;
    const p = currentParameters[selectedParamIdx];
    if (!p) return;
    setEditingParamIdx(selectedParamIdx);
    setParamFormData({
      name: p.name,
      shortName: p.shortName || '',
      unit: p.unit || '',
      normalMale: p.normalMale || '',
      normalFemale: p.normalFemale || '',
      method: p.method || ''
    });
    setShowParamModal(true);
  };

  const handleDeleteParam = () => {
    if (currentParameters.length === 0) return;
    const deletedName = currentParameters[selectedParamIdx]?.name;
    const newParams = currentParameters.filter((_, idx) => idx !== selectedParamIdx);
    setCatalog(prev => prev.map(t => t.id === activeTest.id ? { ...t, parameters: newParams } : t));
    setSelectedParamIdx(Math.max(0, selectedParamIdx - 1));
    addNotification('Parameter Deleted', `Removed "${deletedName}".`, 'info');
  };

  const handleCreateSpace = () => {
    const spacer = { name: '----------------------------------------', shortName: '', unit: '', normalMale: '', normalFemale: '', isSpacer: true };
    const newParams = [...currentParameters];
    newParams.splice(selectedParamIdx + 1, 0, spacer);
    setCatalog(prev => prev.map(t => t.id === activeTest.id ? { ...t, parameters: newParams } : t));
    setSelectedParamIdx(selectedParamIdx + 1);
    addNotification('Space Created', 'Added visual separator space in test parameters.', 'info');
  };

  const handleSaveParamForm = () => {
    if (!paramFormData.name.trim()) {
      alert('Please enter a parameter name.');
      return;
    }
    const newParams = [...currentParameters];
    if (editingParamIdx !== null) {
      newParams[editingParamIdx] = { ...newParams[editingParamIdx], ...paramFormData };
      addNotification('Parameter Updated', `Updated "${paramFormData.name}".`, 'success');
    } else {
      newParams.push(paramFormData);
      addNotification('Parameter Added', `Added "${paramFormData.name}".`, 'success');
    }
    setCatalog(prev => prev.map(t => t.id === activeTest.id ? { ...t, parameters: newParams } : t));
    setShowParamModal(false);
  };

  // ================= 2. STATE FOR TEST PROFILE (TestProfile_Details.aspx) =================
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.id || '');
  const [profileSearchName, setProfileSearchName] = useState('');
  const [profileBarcode, setProfileBarcode] = useState('PROF-LIP');
  const [profileCompany, setProfileCompany] = useState('In-House');
  const [profileIsOutsourcing, setProfileIsOutsourcing] = useState(false);
  const [profileTypeRadio, setProfileTypeRadio] = useState('profile'); // 'profile' | 'package'

  const [profileTestSearchName, setProfileTestSearchName] = useState('');
  const [profileTestSearchCat, setProfileTestSearchCat] = useState('');
  const [profileChosenTests, setProfileChosenTests] = useState(profiles[0]?.tests || []);
  const [profileAvailableSelected, setProfileAvailableSelected] = useState(null);
  const [profileChosenSelected, setProfileChosenSelected] = useState(null);

  const availableProfilePool = catalog
    .map(t => t.displayName || t.name)
    .filter(name => {
      const notInChosen = !profileChosenTests.includes(name);
      const matchesName = !profileTestSearchName || name.toLowerCase().includes(profileTestSearchName.toLowerCase());
      return notInChosen && matchesName;
    });

  const handleSelectProfileFromDropdown = (profId) => {
    setSelectedProfileId(profId);
    const p = profiles.find(x => x.id === profId);
    if (p) {
      setProfileSearchName(p.name);
      setProfileBarcode(p.barcode || '');
      setProfileCompany(p.company || 'In-House');
      setProfileIsOutsourcing(p.isOutSourcing || false);
      setProfileTypeRadio(p.type || 'profile');
      setProfileChosenTests(p.tests || []);
    }
  };

  const handleAddOneToProfile = () => {
    if (!profileAvailableSelected) return;
    setProfileChosenTests(prev => [...prev, profileAvailableSelected]);
    setProfileAvailableSelected(null);
  };

  const handleAddAllToProfile = () => {
    setProfileChosenTests(prev => Array.from(new Set([...prev, ...availableProfilePool])));
  };

  const handleRemoveOneFromProfile = () => {
    if (!profileChosenSelected) return;
    setProfileChosenTests(prev => prev.filter(t => t !== profileChosenSelected));
    setProfileChosenSelected(null);
  };

  const handleRemoveAllFromProfile = () => {
    setProfileChosenTests([]);
  };

  const handleDeleteProfile = () => {
    if (!selectedProfileId) {
      alert('Please select a test profile from the dropdown to delete.');
      return;
    }
    const target = profiles.find(p => p.id === selectedProfileId);
    if (!target) return;

    if (window.confirm(`Are you sure you want to permanently delete the profile "${target.name}"?`)) {
      setProfiles(prev => {
        const updated = prev.filter(p => p.id !== selectedProfileId);
        try { localStorage.setItem('pulselab_custom_test_profiles', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      setSelectedProfileId('');
      setProfileSearchName('');
      setProfileBarcode('');
      setProfileChosenTests([]);
      addNotification('Profile Deleted', `Permanently deleted "${target.name}".`, 'info');
    }
  };

  const handleClearAllOldProfiles = () => {
    if (window.confirm('⚠️ HARD DELETE CONFIRMATION:\nAre you sure you want to PERMANENTLY wipe all existing default profiles and packages?\n\nThis will clear the profile list so you can start with a clean slate.')) {
      setProfiles([]);
      try { localStorage.setItem('pulselab_custom_test_profiles', JSON.stringify([])); } catch (e) {}
      setSelectedProfileId('');
      setProfileSearchName('');
      setProfileBarcode('');
      setProfileChosenTests([]);
      addNotification('Profiles Cleared', 'All old profiles and packages have been hard deleted.', 'info');
    }
  };

  const handleSaveProfile = () => {
    if (!profileSearchName.trim()) {
      alert('Please enter a Profile / Package Name.');
      return;
    }
    const updated = {
      id: selectedProfileId || `PROF_${Date.now()}`,
      name: profileSearchName.trim(),
      type: profileTypeRadio,
      barcode: profileBarcode.trim() || `PROF-${Math.floor(100 + Math.random() * 900)}`,
      company: profileCompany,
      isOutSourcing: profileIsOutsourcing,
      tests: profileChosenTests
    };

    setProfiles(prev => {
      const exists = prev.some(p => p.id === updated.id);
      const updatedList = exists
        ? prev.map(p => p.id === updated.id ? updated : p)
        : [...prev, updated];
      try { localStorage.setItem('pulselab_custom_test_profiles', JSON.stringify(updatedList)); } catch (e) {}
      return updatedList;
    });

    setSelectedProfileId(updated.id);
    addNotification('Profile Saved', `Profile "${updated.name}" with ${updated.tests.length} tests successfully saved.`, 'success');
  };

  // ================= 3. STATE FOR TEST CATEGORY MASTER =================
  const [catSearch, setCatSearch] = useState('');
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [catFormData, setCatFormData] = useState({ name: '', categoryFooter: '', order: '', department: 'Pathology' });

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
    c.categoryFooter.toLowerCase().includes(catSearch.toLowerCase()) ||
    c.department.toLowerCase().includes(catSearch.toLowerCase())
  );

  const handleSaveCategory = () => {
    if (!catFormData.name.trim()) return;
    const newCat = {
      id: String(Date.now()),
      name: catFormData.name.toUpperCase(),
      printFooter: '',
      categoryFooter: catFormData.categoryFooter,
      order: Number(catFormData.order || categories.length + 1),
      department: catFormData.department
    };
    setCategories(prev => [...prev, newCat]);
    setShowAddCatModal(false);
    addNotification('Category Created', `Added "${newCat.name}" to Category Master.`, 'success');
  };

  // ================= 4. STATE FOR TEST GROUP MASTER =================
  const [groupSearch, setGroupSearch] = useState('');
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [groupFormData, setGroupFormData] = useState({ name: '', barcode: 'SER' });

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.barcode.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const handleSaveGroup = () => {
    if (!groupFormData.name.trim()) return;
    const newGrp = {
      id: String(Date.now()),
      name: groupFormData.name,
      barcode: groupFormData.barcode.toUpperCase()
    };
    setGroups(prev => [...prev, newGrp]);
    setShowAddGroupModal(false);
    addNotification('Group Created', `Added "${newGrp.name}" with Barcode [${newGrp.barcode}].`, 'success');
  };

  // ================= 5. STATE FOR TEST UNIT MASTER =================
  const [unitSearch, setUnitSearch] = useState('');
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitInput, setNewUnitInput] = useState('');

  const filteredUnits = units.filter(u => u.toLowerCase().includes(unitSearch.toLowerCase()));

  const handleSaveUnit = () => {
    if (!newUnitInput.trim()) return;
    setUnits(prev => [newUnitInput.trim(), ...prev]);
    setShowAddUnitModal(false);
    setNewUnitInput('');
    addNotification('Unit Added', `Unit "${newUnitInput}" added to Test Unit Master.`, 'success');
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-[#1e3a8a] text-white flex items-center justify-center font-bold shadow-md shadow-sky-100">
            <ListTree className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900">Test Management & Master Configurations</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 font-mono">
                1,148+ Tests
              </span>
            </div>
            <p className="text-xs text-slate-500">Manage Parameters, Test Profiles, Categories, Test Groups, and Clinical Units</p>
          </div>
        </div>

        {/* Master Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          {[
            { id: 'parameter_master', label: 'Test Parameter Master' },
            { id: 'profile_details', label: 'Test Profile Details' },
            { id: 'category_master', label: `Category Master (${categories.length})` },
            { id: 'group_master', label: `Group Master (${groups.length})` },
            { id: 'unit_master', label: `Unit Master (${units.length})` },
            { id: 'rate_master', label: 'Rate Master' },
            { id: 'complete_list', label: 'Complete Test List' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all text-[11px] ${
                activeSubTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TEST PARAMETER MASTER (Exact Replication of TestParameterDetails.aspx) */}
      {/* ========================================================================= */}
      {activeSubTab === 'parameter_master' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs animate-in fade-in">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-sky-900">Test Parameter Master</h2>
            <span className="font-mono text-slate-500 font-bold">
              Active Test: <strong className="text-slate-900">{activeTest?.displayName || activeTest?.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
            
            {/* Left 5 Cols: Select Test Area */}
            <div className="lg:col-span-5 space-y-3">
              
              {/* Select Test Search Controls */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-700 w-24">Select Test:</span>
                  <select
                    value={testDisplayType}
                    onChange={(e) => setTestDisplayType(e.target.value)}
                    className="bg-white border border-slate-300 rounded p-1 text-xs font-semibold"
                  >
                    <option>Display Name</option>
                    <option>Short Name</option>
                    <option>Test Code</option>
                  </select>
                </div>

                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search test by name or code..."
                    value={testSearchInput}
                    onChange={(e) => setTestSearchInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
                  />
                </div>
              </div>

              {/* Test Listbox */}
              <div>
                <label className="block text-sky-900 font-bold text-[11px] mb-1">
                  Test: ({filteredTestsForParam.length} Tests)
                </label>
                <div className="border border-slate-300 rounded-lg bg-white min-h-[320px] max-h-[360px] overflow-y-auto divide-y divide-slate-100 font-sans text-xs">
                  {filteredTestsForParam.map(t => {
                    const isSelected = t.id === activeTest.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTestId(t.id);
                          setSelectedParamIdx(0);
                        }}
                        className={`p-2 cursor-pointer transition-colors flex items-center justify-between ${
                          isSelected ? 'bg-sky-600 text-white font-bold' : 'text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate pr-2">{t.displayName || t.name}</span>
                        <span className={`text-[10px] font-mono shrink-0 ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                          ({t.parameters?.length || 0} p)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Test Action Buttons matching screenshot */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  onClick={handleOpenAddParam}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded border border-slate-300 shadow-2xs"
                >
                  Add Test
                </button>
                <button
                  onClick={handleOpenEditParam}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded border border-slate-300 shadow-2xs"
                >
                  Edit Test
                </button>
                <button
                  onClick={() => addNotification('Delete Test', 'Protected master record.', 'info')}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-700 font-bold rounded border border-slate-300 shadow-2xs"
                >
                  Delete
                </button>
                <button
                  onClick={() => setActiveSubTab('complete_list')}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded border border-slate-300 shadow-2xs"
                >
                  Test List
                </button>
              </div>

            </div>

            {/* Middle 1 Col: Up and Down Red Reorder Arrows matching screenshot */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center h-[340px] space-y-3 pt-12">
              <button
                onClick={handleMoveParamUp}
                disabled={selectedParamIdx <= 0}
                className="p-2.5 bg-white hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-300 shadow-sm transition-all disabled:opacity-30 flex items-center justify-center cursor-pointer"
                title="Move Parameter Up (▲)"
              >
                <ChevronUp className="h-6 w-6 stroke-[3]" />
              </button>

              <button
                onClick={handleMoveParamDown}
                disabled={selectedParamIdx >= currentParameters.length - 1}
                className="p-2.5 bg-white hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-300 shadow-sm transition-all disabled:opacity-30 flex items-center justify-center cursor-pointer"
                title="Move Parameter Down (▼)"
              >
                <ChevronDown className="h-6 w-6 stroke-[3]" />
              </button>
            </div>

            {/* Right 6 Cols: Parameter Listbox Area */}
            <div className="lg:col-span-6 space-y-3">
              
              <div>
                <label className="block text-sky-900 font-bold text-[11px] mb-1">
                  Parameter: ({currentParameters.length} Parameters)
                </label>
                <div className="border border-slate-300 rounded-lg bg-white min-h-[355px] max-h-[380px] overflow-y-auto divide-y divide-slate-100 font-sans text-xs">
                  {currentParameters.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-400">
                      No parameters added yet. Click "Add Parameter" below.
                    </div>
                  ) : (
                    currentParameters.map((p, idx) => {
                      const isSelected = selectedParamIdx === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedParamIdx(idx)}
                          className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="opacity-60 text-[10px] w-5 text-center font-mono">{idx + 1}.</span>
                            <span className="truncate">{p.name}</span>
                          </div>

                          <div className="flex items-center space-x-3 text-[11px] font-mono shrink-0">
                            {p.unit && <span className={isSelected ? 'text-white' : 'text-slate-500 font-bold'}>{p.unit}</span>}
                            {p.normalMale && <span className={isSelected ? 'text-sky-100' : 'text-slate-400 font-sans'}>[{p.normalMale}]</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Parameter Action Buttons matching screenshot */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  onClick={handleOpenAddParam}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded border border-slate-300 shadow-2xs"
                >
                  Add Parameter
                </button>

                <button
                  onClick={handleOpenEditParam}
                  disabled={currentParameters.length === 0}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded border border-slate-300 shadow-2xs disabled:opacity-50"
                >
                  Edit Parameter
                </button>

                <button
                  onClick={handleDeleteParam}
                  disabled={currentParameters.length === 0}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-700 font-bold rounded border border-slate-300 shadow-2xs disabled:opacity-50"
                >
                  Delete
                </button>

                <button
                  onClick={handleCreateSpace}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded border border-slate-300 shadow-2xs"
                >
                  Create Space
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================================= */}
      {/* 2. TEST PROFILE DETAILS (Exact Replication of TestProfile_Details.aspx) */}
      {/* ======================================================================= */}
      {activeSubTab === 'profile_details' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs animate-in fade-in">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-sky-900">Test Profile Details</h2>
            <span className="font-mono text-slate-500 font-bold">
              {profileTypeRadio === 'profile' ? 'Profile Setup' : 'Package Setup'}
            </span>
          </div>

          {/* Form Header Area matching Screenshot 2 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            
            {/* Row 1: Select Profile | Add New Profile | Profile vs Package */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4 flex items-center space-x-2">
                <span className="w-32 font-semibold text-slate-700">Select Test Profile</span>
                <select
                  value={selectedProfileId}
                  onChange={(e) => handleSelectProfileFromDropdown(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded p-1.5 font-bold text-slate-900"
                >
                  <option value="">-- Select Profile --</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProfileId('');
                    setProfileSearchName('');
                    setProfileBarcode(`PROF-${Math.floor(100 + Math.random() * 900)}`);
                    setProfileChosenTests([]);
                  }}
                  className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded border border-sky-300"
                >
                  Add New Profile
                </button>

                <button
                  type="button"
                  onClick={handleDeleteProfile}
                  disabled={!selectedProfileId}
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold rounded border border-rose-300 disabled:opacity-40"
                  title="Permanently delete selected profile"
                >
                  🗑️ Delete Profile
                </button>

                <button
                  type="button"
                  onClick={handleClearAllOldProfiles}
                  className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded border border-amber-300"
                  title="Permanently clear all default/old profiles"
                >
                  🔥 Clear All Old Profiles
                </button>

                <div className="flex items-center space-x-4 font-semibold text-slate-800 ml-auto">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="profileType"
                      checked={profileTypeRadio === 'profile'}
                      onChange={() => setProfileTypeRadio('profile')}
                    />
                    <span>profile</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="profileType"
                      checked={profileTypeRadio === 'package'}
                      onChange={() => setProfileTypeRadio('package')}
                    />
                    <span>package</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Row 2: Search Test Profile */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <span className="md:col-span-2 font-semibold text-slate-700">Search Test Profile</span>
              <input
                type="text"
                placeholder="Enter Profile / Package Name"
                value={profileSearchName}
                onChange={(e) => setProfileSearchName(e.target.value)}
                className="md:col-span-4 bg-white border border-slate-300 rounded p-1.5 font-bold"
              />
            </div>

            {/* Row 3: Barcode */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <span className="md:col-span-2 font-semibold text-slate-700">Barcode</span>
              <input
                type="text"
                value={profileBarcode}
                onChange={(e) => setProfileBarcode(e.target.value)}
                className="md:col-span-4 bg-white border border-slate-300 rounded p-1.5 font-mono"
              />
            </div>

            {/* Row 4: Company & OutSourcing */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <span className="md:col-span-2 font-semibold text-slate-700">Company</span>
              <select
                value={profileCompany}
                onChange={(e) => setProfileCompany(e.target.value)}
                className="md:col-span-4 bg-white border border-slate-300 rounded p-1.5"
              >
                <option>-- Select Company --</option>
                <option>In-House</option>
                <option>Gondiya Care</option>
                <option>Metropolis Lab</option>
              </select>

              <div className="md:col-span-6 flex items-center space-x-2">
                <label className="flex items-center space-x-1.5 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={profileIsOutsourcing}
                    onChange={(e) => setProfileIsOutsourcing(e.target.checked)}
                  />
                  <span>IsOutSourcing</span>
                </label>
                <select className="bg-white border border-slate-300 rounded p-1 text-slate-500">
                  <option>--Select--</option>
                </select>
              </div>
            </div>

            {/* Row 5: Search Tests */}
            <div className="pt-2 border-t border-slate-200">
              <p className="font-bold text-slate-900 mb-1.5">Search Tests</p>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-6 flex items-center space-x-1.5">
                  <span className="w-20 text-slate-600 font-semibold">Test Name</span>
                  <select className="bg-white border border-slate-300 rounded p-1 text-xs">
                    <option>Display Name</option>
                    <option>Short Name</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Filter available tests..."
                    value={profileTestSearchName}
                    onChange={(e) => setProfileTestSearchName(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded p-1"
                  />
                </div>

                <div className="sm:col-span-6 flex items-center space-x-2">
                  <span className="w-24 text-slate-600 font-semibold">Test Category</span>
                  <input
                    type="text"
                    value={profileTestSearchCat}
                    onChange={(e) => setProfileTestSearchCat(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded p-1"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Dual Listbox: Test List | Action Controls | Selected Test List */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2">
            
            {/* Left Box: Test List */}
            <div className="md:col-span-5 space-y-1">
              <label className="block text-slate-700 font-bold text-[11px]">
                Test List ({availableProfilePool.length})
              </label>
              <div className="border border-slate-300 rounded-xl bg-white p-1 min-h-[220px] max-h-[260px] overflow-y-auto divide-y divide-slate-50 text-xs">
                {availableProfilePool.map(tName => (
                  <div
                    key={tName}
                    onClick={() => setProfileAvailableSelected(tName)}
                    className={`p-2 cursor-pointer transition-colors ${
                      profileAvailableSelected === tName ? 'bg-sky-600 text-white font-bold' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {tName}
                  </div>
                ))}
              </div>
            </div>

            {/* Middle Controls */}
            <div className="md:col-span-2 flex flex-col items-center justify-center space-y-2">
              <button
                onClick={handleAddOneToProfile}
                disabled={!profileAvailableSelected}
                className="w-32 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded border border-slate-300 shadow-2xs transition-colors disabled:opacity-40"
              >
                Add &gt;&gt;
              </button>

              <button
                onClick={handleAddAllToProfile}
                className="w-32 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded border border-slate-300 shadow-2xs transition-colors"
              >
                Add All &gt;&gt;
              </button>

              <button
                onClick={handleRemoveOneFromProfile}
                disabled={!profileChosenSelected}
                className="w-32 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded border border-slate-300 shadow-2xs transition-colors disabled:opacity-40"
              >
                &lt;&lt; Remove
              </button>

              <button
                onClick={handleRemoveAllFromProfile}
                className="w-32 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded border border-slate-300 shadow-2xs transition-colors"
              >
                &lt;&lt; Remove All
              </button>
            </div>

            {/* Right Box: Selected Test List */}
            <div className="md:col-span-5 space-y-1">
              <label className="block text-slate-700 font-bold text-[11px]">
                Selected Test List ({profileChosenTests.length})
              </label>
              <div className="border border-slate-300 rounded-xl bg-white p-1 min-h-[220px] max-h-[260px] overflow-y-auto divide-y divide-slate-50 text-xs">
                {profileChosenTests.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    No tests added to this profile yet.
                  </div>
                ) : (
                  profileChosenTests.map(tName => (
                    <div
                      key={tName}
                      onClick={() => setProfileChosenSelected(tName)}
                      className={`p-2 cursor-pointer transition-colors ${
                        profileChosenSelected === tName ? 'bg-sky-600 text-white font-bold' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      {tName}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center space-x-3 pt-3 border-t border-slate-200">
            <button
              onClick={handleSaveProfile}
              className="px-6 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-lg shadow-sm transition-all"
            >
              Save Profile
            </button>

            <button
              onClick={() => {
                setProfileChosenTests([]);
                setProfileSearchName('');
              }}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300"
            >
              Cancel
            </button>
          </div>

        </div>
      )}

      {/* ======================================================================= */}
      {/* 3. TEST CATEGORY MASTER (51 Categories with Footers & Analyzers)       */}
      {/* ======================================================================= */}
      {activeSubTab === 'category_master' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-sky-900">Test Category Master</h2>
              <p className="text-slate-500">Configure pathology/radiology categories, analyzer equipment footers & print order</p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search categories or equipment..."
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <button
                onClick={() => setShowAddCatModal(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-xs flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Category</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                <tr>
                  <th className="p-3">Category Name</th>
                  <th className="p-3">Category Footer (Equipment / Methodology)</th>
                  <th className="p-3 text-center w-24">Display Order</th>
                  <th className="p-3">Department Name</th>
                  <th className="p-3 text-center w-20">Edit</th>
                  <th className="p-3 text-center w-20">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">{c.categoryFooter || '-'}</td>
                    <td className="p-3 text-center font-mono font-bold text-sky-800">{c.order}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.department === 'Radiology' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {c.department}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button className="text-sky-600 hover:text-sky-800 font-bold">Edit</button>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setCategories(categories.filter(x => x.id !== c.id))}
                        className="text-rose-600 hover:text-rose-800 font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ======================================================================= */}
      {/* 4. TEST GROUP MASTER (27 Specimen Groups with Barcodes)                */}
      {/* ======================================================================= */}
      {activeSubTab === 'group_master' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-sky-900">Test Group Master (Sample & Vial Types)</h2>
              <p className="text-slate-500">Manage specimen groups (Serum, EDTA Blood, Urine, Stool, Fluid, Sputum, etc.)</p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search group name or barcode..."
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <button
                onClick={() => setShowAddGroupModal(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-xs flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Test Group</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl max-w-2xl">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                <tr>
                  <th className="p-3">Group Name</th>
                  <th className="p-3 font-mono">Bar Code</th>
                  <th className="p-3 text-center w-20">Edit</th>
                  <th className="p-3 text-center w-20">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGroups.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{g.name}</td>
                    <td className="p-3 font-mono font-bold text-sky-800">{g.barcode}</td>
                    <td className="p-3 text-center">
                      <button className="text-sky-600 hover:text-sky-800 font-bold">Edit</button>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setGroups(groups.filter(x => x.id !== g.id))}
                        className="text-rose-600 hover:text-rose-800 font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ======================================================================= */}
      {/* 5. TEST UNIT MASTER (140+ Units)                                      */}
      {/* ======================================================================= */}
      {activeSubTab === 'unit_master' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-sky-900">Test Unit Master</h2>
              <p className="text-slate-500">All standard clinical measurement units ({units.length} defined units)</p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search unit name..."
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <button
                onClick={() => setShowAddUnitModal(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-xs flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Test Unit</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[500px] overflow-y-auto p-1">
            {filteredUnits.map((u, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 flex items-center justify-between group transition-colors"
              >
                <span className="truncate">{u}</span>
                <button
                  onClick={() => setUnits(units.filter(x => x !== u))}
                  className="text-slate-300 group-hover:text-rose-600 transition-colors p-0.5"
                  title="Delete unit"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ======================================================================= */}
      {/* 5.5 RATE MASTER (MRP vs B2B Center Pricing & Margins)                  */}
      {/* ======================================================================= */}
      {activeSubTab === 'rate_master' && (() => {
        const filteredRateCatalog = catalog.filter(t => {
          const matchesSearch = !rateSearchQuery ||
            (t.name && t.name.toLowerCase().includes(rateSearchQuery.toLowerCase())) ||
            (t.displayName && t.displayName.toLowerCase().includes(rateSearchQuery.toLowerCase())) ||
            (t.shortName && t.shortName.toLowerCase().includes(rateSearchQuery.toLowerCase())) ||
            (t.code && String(t.code).includes(rateSearchQuery)) ||
            (t.category && t.category.toLowerCase().includes(rateSearchQuery.toLowerCase()));

          const matchesDept = rateDeptFilter === 'all' || t.department === rateDeptFilter;
          return matchesSearch && matchesDept;
        });

        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs animate-in fade-in">
            {/* Header Toolbar with Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-sky-900">Diagnostic Rate Master & B2B Tariff Matrix</h2>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-mono">
                    {filteredRateCatalog.length} of {catalog.length} Tests
                  </span>
                </div>
                <p className="text-slate-500">Search 1,148+ tests and configure walk-in Patient MRP rates, Collection Center B2B tariffs, and gross margins</p>
              </div>

              <div className="flex items-center space-x-2">
                {/* High Speed Rate Search Bar */}
                <div className="relative w-80">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-sky-600" />
                  <input
                    type="text"
                    placeholder="Search 1,148+ tests by name, code, category..."
                    value={rateSearchQuery}
                    onChange={(e) => setRateSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-amber-50/60 hover:bg-amber-50 focus:bg-white border-2 border-amber-300 focus:border-sky-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all placeholder:text-slate-400"
                    autoFocus
                  />
                  {rateSearchQuery && (
                    <button
                      onClick={() => setRateSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    exportToExcel(filteredRateCatalog, 'Rate_Master_Tariffs', TEST_CATALOG_EXPORT_COLUMNS);
                    addNotification('Rate Sheet Exported', `Exported ${filteredRateCatalog.length} test rates to Excel.`, 'success');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-all shrink-0"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Export Rate Sheet</span>
                </button>
              </div>
            </div>

            {/* Department Quick Filter Bar */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="font-bold text-slate-600 shrink-0 mr-1">Department:</span>
              {[
                { id: 'all', label: 'All Departments' },
                { id: 'haematology', label: 'Haematology' },
                { id: 'biochemistry', label: 'Biochemistry' },
                { id: 'clinical_pathology', label: 'Clinical Pathology' },
                { id: 'immuno_assay', label: 'Immuno Assay' },
                { id: 'serology', label: 'Serology' },
                { id: 'microbiology', label: 'Microbiology' },
                { id: 'radiology_imaging', label: 'Radiology' }
              ].map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setRateDeptFilter(dept.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                    rateDeptFilter === dept.id
                      ? 'bg-sky-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {dept.label}
                </button>
              ))}
            </div>

            {/* Tariff Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[550px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-16">Code</th>
                    <th className="p-3">Test Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-right">Walk-in MRP (₹)</th>
                    <th className="p-3 text-right">B2B Franchise (₹)</th>
                    <th className="p-3 text-right">Lab Gross Margin</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRateCatalog.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        No tests match your rate search query "{rateSearchQuery}". Try clearing the search.
                      </td>
                    </tr>
                  ) : (
                    filteredRateCatalog.map(t => {
                      const margin = t.price ? Math.round(((t.price - t.b2bPrice) / t.price) * 100) : 0;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-sky-800">{t.code}</td>
                          <td className="p-3 font-bold text-slate-900">{t.displayName || t.name}</td>
                          <td className="p-3 text-slate-600">{t.category}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {t.department}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">₹{t.price}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">₹{t.b2bPrice}</td>
                          <td className="p-3 text-right">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded-full font-mono text-[10px]">
                              {margin}% Margin
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                const newMrp = prompt(`Enter new Walk-in MRP for ${t.displayName || t.name}:`, t.price);
                                if (newMrp && !isNaN(newMrp)) {
                                  setCatalog(prev => prev.map(item => item.id === t.id ? { ...item, price: Number(newMrp), b2bPrice: Math.round(Number(newMrp) * 0.6) } : item));
                                  addNotification('Rate Updated', `Updated MRP for ${t.displayName || t.name} to ₹${newMrp}.`, 'success');
                                }
                              }}
                              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded border border-sky-200 text-[10px]"
                            >
                              Edit Rate
                            </button>
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
      })()}

      {/* ======================================================================= */}
      {/* 6. COMPLETE TEST LIST & SEARCH                                         */}
      {/* ======================================================================= */}
      {activeSubTab === 'complete_list' && (() => {
        const filteredList = catalog.filter(t => {
          const matchesSearch = !catalogSearch ||
            (t.name && t.name.toLowerCase().includes(catalogSearch.toLowerCase())) ||
            (t.displayName && t.displayName.toLowerCase().includes(catalogSearch.toLowerCase())) ||
            (t.shortName && t.shortName.toLowerCase().includes(catalogSearch.toLowerCase())) ||
            (t.code && String(t.code).includes(catalogSearch)) ||
            (t.category && t.category.toLowerCase().includes(catalogSearch.toLowerCase()));

          const matchesDept = selectedDeptFilter === 'all' || t.department === selectedDeptFilter;
          return matchesSearch && matchesDept;
        });

        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs animate-in fade-in">
            
            {/* Header Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-sky-900">Complete Master Test Directory</h2>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800 text-[11px] font-mono">
                    {filteredList.length} of {catalog.length} Tests
                  </span>
                </div>
                <p className="text-slate-500">Full searchable catalog with methodology, sample types, turnaround time, and tariffs</p>
              </div>

              <div className="flex items-center space-x-2">
                {/* Search Bar */}
                <div className="relative w-72">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, code, category..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  {catalogSearch && (
                    <button
                      onClick={() => setCatalogSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    exportToExcel(filteredList, 'Master_Diagnostic_Test_Catalog', TEST_CATALOG_EXPORT_COLUMNS);
                    addNotification('Excel Export Downloaded', `Exported ${filteredList.length} diagnostic tests to Excel spreadsheet.`, 'success');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-all shrink-0"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            {/* Department Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="font-bold text-slate-600 shrink-0 mr-1">Department:</span>
              {[
                { id: 'all', label: 'All Departments' },
                { id: 'haematology', label: 'Haematology' },
                { id: 'biochemistry', label: 'Biochemistry' },
                { id: 'clinical_pathology', label: 'Clinical Pathology' },
                { id: 'immuno_assay', label: 'Immuno Assay & Hormones' },
                { id: 'serology', label: 'Serology' },
                { id: 'microbiology', label: 'Microbiology' },
                { id: 'histopathology', label: 'Histopathology' },
                { id: 'coagulation', label: 'Coagulation' },
                { id: 'molecular_pcr', label: 'Molecular PCR' },
                { id: 'radiology_imaging', label: 'Radiology / Imaging' }
              ].map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDeptFilter(dept.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                    selectedDeptFilter === dept.id
                      ? 'bg-sky-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {dept.label}
                </button>
              ))}
            </div>

            {/* Complete Test Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[550px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-16">Code</th>
                    <th className="p-3">Test Name & Parameters</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Sample Container</th>
                    <th className="p-3">TAT</th>
                    <th className="p-3 text-right">MRP (₹)</th>
                    <th className="p-3 text-right">B2B (₹)</th>
                    <th className="p-3 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No tests match your filter "{catalogSearch}". Try clearing the search.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-sky-800">{t.code}</td>
                        <td className="p-3 font-bold text-slate-900">
                          <div>{t.displayName || t.name}</div>
                          <span className="text-[10px] text-slate-500 font-mono font-normal">
                            {t.shortName && <strong className="text-slate-700">[{t.shortName}] </strong>}
                            {t.parameters?.length || 0} Parameters ({t.parameters?.map(p => p.shortName || p.name).slice(0, 3).join(', ')})
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 font-semibold">{t.category}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.department === 'radiology_imaging'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {t.department?.replace('_', ' ')?.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-mono text-[11px]">{t.container || t.sampleType}</td>
                        <td className="p-3 text-slate-600 font-medium">{t.tat}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">₹{t.price}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">₹{t.b2bPrice}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedTestId(t.id);
                              setActiveSubTab('parameter_master');
                            }}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded border border-sky-200 text-[10px]"
                          >
                            Parameters
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        );
      })()}

      {/* ================= MODAL: ADD / EDIT PARAMETER ================= */}
      {showParamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingParamIdx !== null ? 'Edit Parameter' : 'Add New Parameter'}
              </h3>
              <button
                onClick={() => setShowParamModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Parameter Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Hemoglobin, Total Cholesterol, SGPT"
                  value={paramFormData.name}
                  onChange={(e) => setParamFormData({ ...paramFormData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Short Name / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. Hb, TC, ALT"
                    value={paramFormData.shortName}
                    onChange={(e) => setParamFormData({ ...paramFormData, shortName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={paramFormData.unit}
                    onChange={(e) => setParamFormData({ ...paramFormData, unit: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  >
                    <option value="">Select Unit</option>
                    {units.slice(0, 50).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Male Bio Ref. Interval</label>
                  <input
                    type="text"
                    placeholder="e.g. 13.0 - 17.0"
                    value={paramFormData.normalMale}
                    onChange={(e) => setParamFormData({ ...paramFormData, normalMale: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Female Bio Ref. Interval</label>
                  <input
                    type="text"
                    placeholder="e.g. 12.0 - 15.0"
                    value={paramFormData.normalFemale}
                    onChange={(e) => setParamFormData({ ...paramFormData, normalFemale: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Clinical Methodology</label>
                <input
                  type="text"
                  placeholder="e.g. Cyanmethemoglobin, CHOD-PAP, IFCC UV"
                  value={paramFormData.method}
                  onChange={(e) => setParamFormData({ ...paramFormData, method: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowParamModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveParamForm}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Save Parameter
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CATEGORY ================= */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in text-xs">
            <h3 className="font-bold text-base text-slate-900">Add Test Category</h3>
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. BIOCHEMISTRY, HISTOPATHOLOGY"
                  value={catFormData.name}
                  onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold uppercase"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Footer (Equipment / Methodology)</label>
                <input
                  type="text"
                  placeholder="e.g. Fully automated biochemistry analyzer EM200"
                  value={catFormData.categoryFooter}
                  onChange={(e) => setCatFormData({ ...catFormData, categoryFooter: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={catFormData.order}
                    onChange={(e) => setCatFormData({ ...catFormData, order: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={catFormData.department}
                    onChange={(e) => setCatFormData({ ...catFormData, department: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option>Pathology</option>
                    <option>Radiology</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowAddCatModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">Cancel</button>
              <button onClick={handleSaveCategory} className="px-4 py-2 bg-sky-600 text-white font-bold rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD TEST GROUP ================= */}
      {showAddGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in text-xs">
            <h3 className="font-bold text-base text-slate-900">Add Test Group (Vial Type)</h3>
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Group Name *</label>
                <input
                  type="text"
                  placeholder="e.g. SERUM, EDTA Blood, URINE"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Barcode Prefix</label>
                <input
                  type="text"
                  placeholder="e.g. SER, FLU, HIS"
                  value={groupFormData.barcode}
                  onChange={(e) => setGroupFormData({ ...groupFormData, barcode: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowAddGroupModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">Cancel</button>
              <button onClick={handleSaveGroup} className="px-4 py-2 bg-sky-600 text-white font-bold rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD TEST UNIT ================= */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in text-xs">
            <h3 className="font-bold text-base text-slate-900">Add Clinical Measurement Unit</h3>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit Symbol *</label>
              <input
                type="text"
                placeholder="e.g. mg/dL, g/dL, U/L, ng/ml"
                value={newUnitInput}
                onChange={(e) => setNewUnitInput(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowAddUnitModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">Cancel</button>
              <button onClick={handleSaveUnit} className="px-4 py-2 bg-sky-600 text-white font-bold rounded-lg">Save Unit</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
