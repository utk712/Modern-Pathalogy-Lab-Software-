import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import {
  UserPlus,
  Search,
  Check,
  Plus,
  Trash2,
  Receipt,
  TestTube,
  Flame,
  CreditCard,
  Building2,
  Printer,
  Upload,
  UserCheck,
  FileText,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronsRight,
  ChevronsLeft
} from 'lucide-react';
import { VIAL_TYPES } from '../../data/mockData';
import { BarcodePrintModal } from './BarcodePrintModal';

export const PatientRegistration = () => {
  const { tests, doctors, b2bCenters, registerPatient, addDoctor } = useLab();

  // Form State
  const [formData, setFormData] = useState({
    patientType: 'O.P.D.',
    patientId: '',
    labCode: `${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${Math.floor(1000 + Math.random() * 9000)}`,
    registrationDate: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString(),
    title: 'Mr.',
    name: '',
    age: '',
    ageType: 'Yr',
    dob: '',
    gender: 'Male',
    email: '',
    mobile: '',
    address: '',
    city: '',
    isRegister: false,
    collectionCenter: '',
    doctorName: '',
    referredDoctor: '',
    homeCollection: false,
    sampleCollectedAt: '',
    collectionDate: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString(),
    collectionBoy: '',
    barcode: '',
    sendSms: false,
    comments: '',
    trfFile: null,
    
    // Billing & Discounts
    testDiscount: 0,
    regnDiscount: 0,
    regnDiscountType: 'Amt', // 'Amt' | '%'
    discountReason: '',
    authorizedBy: '',
    paymentMethod: 'Cash',
    receiptNo: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
    urgency: false,
    visitingCharges: 0,
    paidAmount: '',
    selectedTestIds: []
  });

  // Test Selection UI State
  const [testSearchTab, setTestSearchTab] = useState('list'); // 'fav' | 'list'
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAvailableId, setSelectedAvailableId] = useState(null);
  const [selectedChosenId, setSelectedChosenId] = useState(null);

  // Modals
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [justRegisteredPatient, setJustRegisteredPatient] = useState(null);

  // Extract All Unique Categories dynamically from Master Catalog
  const uniqueCategories = Array.from(new Set(tests.map(t => t.category).filter(Boolean))).sort();

  // Available vs Chosen Tests Filtered with Master Test Catalog
  const availableTests = tests.filter(t => {
    const notSelected = !formData.selectedTestIds.includes(t.id);
    const matchesTab = testSearchTab === 'fav' ? Boolean(t.popular) : true;
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory || t.department === selectedCategory;
    
    const q = searchFilter.toLowerCase().trim();
    const matchesSearch = !q ||
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.displayName && t.displayName.toLowerCase().includes(q)) ||
      (t.shortName && t.shortName.toLowerCase().includes(q)) ||
      (t.code && String(t.code).includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q));

    return notSelected && matchesTab && matchesCategory && matchesSearch;
  });

  const chosenTests = formData.selectedTestIds
    .map(id => tests.find(t => t.id === id))
    .filter(Boolean);

  // Calculations
  const grossTotal = chosenTests.reduce((acc, t) => acc + t.price, 0);
  const regDiscountAmount = formData.regnDiscountType === '%'
    ? (grossTotal * Number(formData.regnDiscount || 0)) / 100
    : Number(formData.regnDiscount || 0);
  const totalDiscount = Number(formData.testDiscount || 0) + regDiscountAmount;
  const netAmount = Math.max(0, grossTotal + Number(formData.visitingCharges || 0) - totalDiscount);
  const paidVal = formData.paidAmount !== '' ? Number(formData.paidAmount) : netAmount;
  const balanceDue = Math.max(0, netAmount - paidVal);

  // Transfer Handlers
  const handleAddOne = () => {
    if (!selectedAvailableId) return;
    setFormData(prev => ({
      ...prev,
      selectedTestIds: [...prev.selectedTestIds, selectedAvailableId]
    }));
    setSelectedAvailableId(null);
  };

  const handleAddAll = () => {
    const allIds = Array.from(new Set([...formData.selectedTestIds, ...availableTests.map(t => t.id)]));
    setFormData(prev => ({ ...prev, selectedTestIds: allIds }));
  };

  const handleRemoveOne = () => {
    if (!selectedChosenId) return;
    setFormData(prev => ({
      ...prev,
      selectedTestIds: prev.selectedTestIds.filter(id => id !== selectedChosenId)
    }));
    setSelectedChosenId(null);
  };

  const handleRemoveAll = () => {
    setFormData(prev => ({ ...prev, selectedTestIds: [] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.age || !formData.mobile.trim()) {
      alert('Please fill in required fields: Patient Name, Age, and Mobile Number.');
      return;
    }
    if (formData.selectedTestIds.length === 0) {
      alert('Please select at least one test from the Test List.');
      return;
    }

    const patient = registerPatient({
      patientType: formData.patientType || 'O.P.D.',
      name: `${formData.title} ${formData.name}`,
      age: formData.age,
      ageType: formData.ageType === 'Yr' ? 'Years' : formData.ageType,
      gender: formData.gender,
      phone: formData.mobile,
      email: formData.email,
      address: `${formData.address}, ${formData.city}`,
      referringDoctor: formData.doctorName,
      b2bCenter: formData.collectionCenter,
      sampleSource: formData.homeCollection ? 'Home Collection' : (formData.patientType === 'I.P.D.' ? 'IPD Ward' : 'Walk-in'),
      urgentTat: formData.urgency,
      tests: formData.selectedTestIds,
      discount: totalDiscount,
      paidAmount: paidVal,
      paymentMode: formData.paymentMethod
    });

    setJustRegisteredPatient(patient);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-200">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900">Test Registration</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 font-mono">
                Clinical Intake
              </span>
            </div>
            <p className="text-xs text-slate-500">Patient intake, Lab Code allocation, category filters, TRF upload, and payment reconciliation</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            Lab Code: <strong className="text-sky-700">{formData.labCode}</strong>
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ================= 1. PATIENT DEMOGRAPHICS & REFERRAL ================= */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Patient Information & Accession Metadata
            </h2>
            <div className="flex items-center space-x-4 text-xs">
              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={formData.homeCollection}
                  onChange={(e) => setFormData({ ...formData, homeCollection: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Home Collection</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={formData.sendSms}
                  onChange={(e) => setFormData({ ...formData, sendSms: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Send Result in SMS</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Patient Type */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Patient Type</label>
              <select
                value={formData.patientType}
                onChange={(e) => setFormData({ ...formData, patientType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-800"
              >
                <option value="None">None</option>
                <option value="I.P.D.">I.P.D.</option>
                <option value="O.P.D.">O.P.D.</option>
                <option value="Cashless">Cashless</option>
                <option value="Walkin">Walkin</option>
              </select>
            </div>

            {/* Patient ID */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Patient ID (UHID)</label>
              <input
                type="text"
                placeholder="Auto Generated"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>

            {/* Lab Code */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lab Code</label>
              <input
                type="text"
                readOnly
                value={formData.labCode}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono font-bold text-indigo-700"
              />
            </div>

            {/* Registration Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Registration Date</label>
              <input
                type="text"
                readOnly
                value={formData.registrationDate}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono text-slate-600"
              />
            </div>

            {/* Patient Name with Title */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Patient Name <span className="text-rose-500">*</span>
              </label>
              <div className="flex space-x-1.5">
                <select
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-20 bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                >
                  <option>Mr.</option>
                  <option>Mrs.</option>
                  <option>Ms.</option>
                  <option>Master</option>
                  <option>Dr.</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="First and Last Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="flex-1 bg-amber-50/50 border border-amber-300 rounded-lg p-2 font-bold text-slate-900 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            {/* Age & Unit */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Age <span className="text-rose-500">*</span>
              </label>
              <div className="flex space-x-1">
                <input
                  type="number"
                  required
                  placeholder="30"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-2/3 bg-amber-50/50 border border-amber-300 rounded-lg p-2 font-bold text-slate-900"
                />
                <select
                  value={formData.ageType}
                  onChange={(e) => setFormData({ ...formData, ageType: e.target.value })}
                  className="w-1/3 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px]"
                >
                  <option>Yr</option>
                  <option>Mo</option>
                  <option>Day</option>
                </select>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gender</label>
              <div className="flex items-center space-x-3 pt-2">
                {['Male', 'Female', 'None'].map(g => (
                  <label key={g} className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={formData.gender === g}
                      onChange={() => setFormData({ ...formData, gender: g })}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-slate-700 font-medium">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="98XXXXXXXX"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-800"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                placeholder="patient@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Address</label>
              <input
                type="text"
                placeholder="Street / Area"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              />
            </div>

            {/* Doctor Name with Instant (+) button */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Doctor Name / Referred By</label>
              <div className="flex space-x-1.5">
                <select
                  value={formData.doctorName || (doctors?.[0]?.name || '')}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value, referredDoctor: e.target.value })}
                  className="flex-1 bg-amber-50/50 border border-amber-300 rounded-lg p-2 font-bold text-slate-800"
                >
                  {(doctors || []).map(d => (
                    <option key={d.id} value={d.name}>{d.name} ({d.specialization || 'General Doctor'})</option>
                  ))}
                  {formData.doctorName && !(doctors || []).some(d => d.name === formData.doctorName) && (
                    <option value={formData.doctorName}>{formData.doctorName} (Recently Added)</option>
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(true)}
                  className="px-2.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold flex items-center space-x-1"
                  title="Add New Doctor"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Collection Center */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Collection Center</label>
              <input
                type="text"
                value={formData.collectionCenter}
                onChange={(e) => setFormData({ ...formData, collectionCenter: e.target.value })}
                className="w-full bg-amber-50/50 border border-amber-300 rounded-lg p-2 font-bold text-slate-800"
              />
            </div>

            {/* Collection/Round Boy */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Collection/Round Boy</label>
              <input
                type="text"
                value={formData.collectionBoy}
                onChange={(e) => setFormData({ ...formData, collectionBoy: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              />
            </div>
          </div>
        </div>

        {/* ================= 2. TWO-COLUMN TEST SELECTION & TRF UPLOAD ================= */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Test Selection & Ordering
              </h2>
              <div className="flex space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTestSearchTab('fav')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    testSearchTab === 'fav' ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Favourite Tests
                </button>
                <button
                  type="button"
                  onClick={() => setTestSearchTab('list')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    testSearchTab === 'list' ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Test List
                </button>
              </div>
            </div>

            {/* TRF Upload & Comments */}
            <div className="flex items-center space-x-3 text-xs">
              <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer border border-slate-200">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload TRF</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFormData({ ...formData, trfFile: e.target.files[0]?.name })}
                />
              </label>
              {formData.trfFile && (
                <span className="text-[11px] font-mono text-emerald-700 font-bold">{formData.trfFile}</span>
              )}
            </div>
          </div>

          {/* Search Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Test Name or Code..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
              >
                <option value="All">-- All Categories ({uniqueCategories.length}) --</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="text"
                placeholder="Enter Clinical Comment / Notes..."
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs"
              />
            </div>
          </div>

          {/* Two Listboxes with Add/Remove Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 text-xs items-center">
            
            {/* Left Box: Available Test List */}
            <div className="md:col-span-5 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner">
              <div className="bg-slate-50 px-3 py-1.5 font-bold text-[11px] text-slate-700 border-b border-slate-200 flex justify-between items-center">
                <span>Available Tests ({availableTests.length})</span>
                <span className="text-[10px] text-slate-400 font-mono">Tariff (MRP)</span>
              </div>
              <div className="h-64 overflow-y-auto divide-y divide-slate-100 p-1">
                {availableTests.length === 0 ? (
                  <p className="text-center text-slate-400 py-12 text-xs italic">No tests match the search criteria.</p>
                ) : (
                  availableTests.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedAvailableId(t.id)}
                      onDoubleClick={handleAddOne}
                      className={`px-3 py-2 cursor-pointer rounded-lg transition-colors flex items-center justify-between gap-2 ${
                        selectedAvailableId === t.id
                          ? 'bg-sky-100 border border-sky-300 text-sky-950 font-bold shadow-xs'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            {t.code || t.id}
                          </span>
                          <span className="font-semibold text-slate-900 truncate text-[11px]">
                            {t.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-medium text-sky-700 uppercase">{t.category}</span>
                          {t.shortName && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-600">[{t.shortName}]</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0 text-xs">
                        ₹{t.price}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Middle Controls (Add >>, Add All >>, << Remove, << Remove All) */}
            <div className="md:col-span-1 flex flex-row md:flex-col justify-center items-center gap-1.5">
              <button
                type="button"
                onClick={handleAddOne}
                className="p-2 md:w-full bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center justify-center shadow-xs transition-colors"
                title="Add Selected"
              >
                <span className="hidden md:inline text-[11px]">Add &gt;&gt;</span>
                <ArrowRight className="h-3.5 w-3.5 md:hidden" />
              </button>

              <button
                type="button"
                onClick={handleAddAll}
                className="p-2 md:w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center border border-slate-200 transition-colors"
                title="Add All"
              >
                <span className="hidden md:inline">Add All &gt;&gt;</span>
                <ChevronsRight className="h-3.5 w-3.5 md:hidden" />
              </button>

              <button
                type="button"
                onClick={handleRemoveOne}
                className="p-2 md:w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center border border-slate-200 transition-colors"
                title="Remove Selected"
              >
                <span className="hidden md:inline">&lt;&lt; Remove</span>
                <ArrowLeft className="h-3.5 w-3.5 md:hidden" />
              </button>

              <button
                type="button"
                onClick={handleRemoveAll}
                className="p-2 md:w-full bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold flex items-center justify-center border border-rose-200 transition-colors"
                title="Remove All"
              >
                <span className="hidden md:inline">&lt;&lt; Remove All</span>
                <ChevronsLeft className="h-3.5 w-3.5 md:hidden" />
              </button>
            </div>

            {/* Right Box: Selected Test List */}
            <div className="md:col-span-5 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner">
              <div className="bg-slate-50 px-3 py-1.5 font-bold text-[11px] text-slate-700 border-b border-slate-200 flex justify-between items-center">
                <span>Selected Tests ({chosenTests.length})</span>
                <span className="text-[10px] text-slate-500 font-bold font-mono">Gross: ₹{grossTotal}</span>
              </div>
              <div className="h-64 overflow-y-auto divide-y divide-slate-100 p-1">
                {chosenTests.length === 0 ? (
                  <p className="text-center text-slate-400 py-12 text-xs italic">No tests selected yet. Choose from left list.</p>
                ) : (
                  chosenTests.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedChosenId(t.id)}
                      onDoubleClick={handleRemoveOne}
                      className={`px-3 py-2 cursor-pointer rounded-lg transition-colors flex items-center justify-between gap-2 ${
                        selectedChosenId === t.id
                          ? 'bg-amber-100 border border-amber-300 text-amber-950 font-bold shadow-xs'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                            {t.code || t.id}
                          </span>
                          <span className="font-semibold text-slate-900 truncate text-[11px]">
                            {t.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-600">{t.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          ₹{t.price}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({
                              ...prev,
                              selectedTestIds: prev.selectedTestIds.filter(id => id !== t.id)
                            }));
                          }}
                          className="p-1 hover:bg-rose-100 text-rose-500 rounded"
                          title="Remove this test"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ================= 3. BILLING, DISCOUNTS & SETTLEMENT BAR ================= */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <Receipt className="h-4 w-4 text-sky-600" />
              <span>Billing, Discount Authorisation & Payment Reconciliation</span>
            </h2>
            <span className="font-mono text-slate-500">Bill Receipt No: <strong>{formData.receiptNo}</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            
            {/* Discount Section */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-600">Discount (Test):</span>
                <span className="font-mono font-bold text-slate-800">₹{formData.testDiscount.toFixed(2)}</span>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-slate-600">Discount (Regn):</span>
                <input
                  type="number"
                  min="0"
                  value={formData.regnDiscount}
                  onChange={(e) => setFormData({ ...formData, regnDiscount: e.target.value })}
                  className="w-16 bg-white border border-slate-300 rounded p-1 font-mono text-right"
                />
                <select
                  value={formData.regnDiscountType}
                  onChange={(e) => setFormData({ ...formData, regnDiscountType: e.target.value })}
                  className="bg-white border border-slate-300 rounded p-1"
                >
                  <option>Amt</option>
                  <option>%</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500">Discount Reason</label>
                <select
                  value={formData.discountReason}
                  onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded p-1 text-[11px]"
                >
                  <option>Senior Citizen Concession</option>
                  <option>Doctor Recommendation</option>
                  <option>Special Health Camp</option>
                  <option>Staff Concession</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500">Authorisation</label>
                <select
                  value={formData.authorizedBy}
                  onChange={(e) => setFormData({ ...formData, authorizedBy: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded p-1 text-[11px] font-medium"
                >
                  <option>Dr. Arvind Kulkarni (Director)</option>
                  <option>Dr. Meera Nambiar</option>
                  <option>Admin In-Charge</option>
                </select>
              </div>
            </div>

            {/* Payment Method Radios */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 block">Payment Method:</span>
              <div className="grid grid-cols-2 gap-2">
                {['Cash', 'Credit Card', 'Debit Card', 'Cheque', 'UPI / QR', 'Others'].map(m => (
                  <label key={m} className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={formData.paymentMethod === m}
                      onChange={() => setFormData({ ...formData, paymentMethod: m })}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-slate-700">{m}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amounts Grid */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900 text-white p-4 rounded-xl shadow-md">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Total Gross</span>
                <span className="text-base font-bold font-mono">₹{grossTotal.toFixed(2)}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Visiting</span>
                <span className="text-base font-bold font-mono">₹{Number(formData.visitingCharges).toFixed(2)}</span>
              </div>

              <div>
                <span className="text-[10px] text-sky-400 block uppercase font-bold">Net Amount</span>
                <span className="text-lg font-black font-mono text-sky-400">₹{netAmount.toFixed(2)}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Paid Amount</span>
                <input
                  type="number"
                  placeholder={String(netAmount)}
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold rounded p-1 text-sm mt-0.5"
                />
              </div>

              <div className="col-span-2 sm:col-span-4 flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Balance Due: <strong className={balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}>₹{balanceDue.toFixed(2)}</strong></span>
                <span className="text-slate-400">Refund: <strong>₹0.00</strong></span>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
            >
              &lt;&lt; Test Search
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-600/20 flex items-center justify-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Save &amp; Proceed &gt;&gt;</span>
            </button>
          </div>

        </div>

      </form>

      {/* Add Doctor Modal (+) */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-sm text-slate-900">Add New Referring Doctor</h3>
            <input
              type="text"
              placeholder="e.g. Dr. Amit Deshpande, MBBS, MD"
              value={newDoctorName}
              onChange={(e) => setNewDoctorName(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddDoctorModal(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newDoctorName.trim()) {
                    const createdDoc = addDoctor ? addDoctor(newDoctorName.trim()) : { name: newDoctorName.trim() };
                    setFormData(prev => ({ ...prev, doctorName: createdDoc.name, referredDoctor: createdDoc.name }));
                    setShowAddDoctorModal(false);
                    setNewDoctorName('');
                  }
                }}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Save & Select Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Print Modal */}
      {justRegisteredPatient && (
        <BarcodePrintModal
          patient={justRegisteredPatient}
          onClose={() => setJustRegisteredPatient(null)}
        />
      )}

    </div>
  );
};
