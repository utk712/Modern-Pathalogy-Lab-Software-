import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import { exportToExcel, exportToTallyXML } from '../../utils/exportToExcel';
import {
  Search,
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  Send,
  CreditCard,
  History,
  FileText,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Bike,
  Sliders,
  Share2,
  ExternalLink,
  Edit2,
  RefreshCw,
  QrCode,
  ArrowRight,
  User,
  FlaskConical,
  X
} from 'lucide-react';

const GLOBAL_SEARCH_COLUMNS = [
  { label: 'Lab Code', key: (p) => p?.labCode || (p?.uhid ? String(p.uhid).replace('UHID-', '1608260') : '-') },
  { label: 'IPD/OPD', key: (p) => p?.id?.includes('803') ? 'IPD' : 'OPD' },
  { label: 'Patient Name', key: 'name' },
  { label: 'Age', key: (p) => p?.age ? `${p.age} Y` : '-' },
  { label: 'Gender', key: 'gender' },
  { label: 'Affiliation / Doctor', key: 'referringDoctor' },
  { label: 'Test Names', key: (p) => p?.tests ? (Array.isArray(p.tests) ? p.tests.map(t => typeof t === 'string' ? t.replace('TEST_', '') : (t?.name || t?.testId || '')).join(' | ') : String(p.tests)) : '-' },
  { label: 'Registration Date', key: 'registrationDate' },
  { label: 'Status', key: (p) => p?.status === 'AUTHORIZED' ? 'Printed' : p?.status === 'REGISTERED' ? 'Registration' : (p?.status || '-') },
  { label: 'Total Amount (INR)', key: (p) => p?.billing?.grossTotal || 0 },
  { label: 'Paid Amount (INR)', key: (p) => p?.billing?.paidAmount ?? (p?.billing?.grossTotal || 0) },
  { label: 'Balance Due (INR)', key: (p) => p?.billing?.dueAmount || 0 },
  { label: 'Collection Center', key: (p) => p?.b2bCenter || 'Main Center' },
  { label: 'Phone', key: 'phone' }
];

const WORKFLOW_STAGES = {
  REGISTERED: {
    label: 'Registration',
    nextLabel: 'Sample Collection',
    nextStatus: 'COLLECTED',
    colorClass: 'text-[#dc2626]',
    buttonColor: 'bg-[#dc2626] hover:bg-[#b91c1c]'
  },
  COLLECTED: {
    label: 'Sample Collection',
    nextLabel: 'Accessioning & Testing',
    nextStatus: 'IN_TESTING',
    colorClass: 'text-[#ea580c]',
    buttonColor: 'bg-[#ea580c] hover:bg-[#c2410c]'
  },
  IN_TESTING: {
    label: 'In Testing (Lab Worklist)',
    nextLabel: 'Results & Authorization',
    nextStatus: 'PENDING_APPROVAL',
    colorClass: 'text-[#0284c7]',
    buttonColor: 'bg-[#0284c7] hover:bg-[#0369a1]'
  },
  PENDING_APPROVAL: {
    label: 'Results & Authorization',
    nextLabel: 'Print & Release Report',
    nextStatus: 'AUTHORIZED',
    colorClass: 'text-[#ca8a04]',
    buttonColor: 'bg-[#ca8a04] hover:bg-[#a16207]'
  },
  AUTHORIZED: {
    label: 'Printed',
    nextLabel: 'Dispatch & Delivery',
    nextStatus: 'DISPATCHED',
    colorClass: 'text-[#16a34a]',
    buttonColor: 'bg-[#16a34a] hover:bg-[#15803d]'
  },
  DISPATCHED: {
    label: 'Dispatched',
    nextLabel: 'Archive & Complete',
    nextStatus: 'COMPLETED',
    colorClass: 'text-[#15803d]',
    buttonColor: 'bg-[#15803d] hover:bg-[#166534]'
  }
};

export const GlobalSearch = () => {
  const {
    patients,
    tests,
    advancePatientStatus,
    authorizeReport,
    addNotification,
    setSelectedPatientId,
    setActiveTab
  } = useLab();

  // Basic Search Filters
  const [patientName, setPatientName] = useState('');
  const [fromDate, setFromDate] = useState('2026-08-16');
  const [toDate, setToDate] = useState('2026-08-16');
  const [labCodeFrom, setLabCodeFrom] = useState('');
  const [labCodeTo, setLabCodeTo] = useState('');
  const [sampleBarcode, setSampleBarcode] = useState('');
  const [selectState, setSelectState] = useState('Select');
  const [showAdvanceSearch, setShowAdvanceSearch] = useState(true);

  // Exact Advance Search Fields from Screenshot
  const [advTestCategory, setAdvTestCategory] = useState('');
  const [advTestNameType, setAdvTestNameType] = useState('Short Name');
  const [advTestNameInput, setAdvTestNameInput] = useState('');
  const [advProfileType, setAdvProfileType] = useState('Short Name');
  const [advProfileInput, setAdvProfileInput] = useState('');
  const [advTestLevelStatus, setAdvTestLevelStatus] = useState('Select');

  const [advCollectionCenter, setAdvCollectionCenter] = useState('');
  const [advAffiliation, setAdvAffiliation] = useState('');
  const [advDoctor, setAdvDoctor] = useState('');

  const [advExternalBarcode, setAdvExternalBarcode] = useState('');
  const [advMobileNumber, setAdvMobileNumber] = useState('');
  const [advPatientType, setAdvPatientType] = useState('None');

  const [advCollFromDate, setAdvCollFromDate] = useState('');
  const [advCollToDate, setAdvCollToDate] = useState('');
  const [advPrintParamsWkSheet, setAdvPrintParamsWkSheet] = useState(true);
  const [advSlotNumber, setAdvSlotNumber] = useState('');

  const [advAreaLocation, setAdvAreaLocation] = useState('Select All');
  const [advCollectionBoy, setAdvCollectionBoy] = useState('');
  const [advAmountPendingStatus, setAdvAmountPendingStatus] = useState('All');

  const [advDepartment, setAdvDepartment] = useState('');
  const [advUser, setAdvUser] = useState('');
  const [advSampleCollectionAt, setAdvSampleCollectionAt] = useState('All');

  const [advIcmr, setAdvIcmr] = useState('All');

  // Workflow Transition state
  const [workflowComment, setWorkflowComment] = useState('');
  const [worksheetNumber, setWorksheetNumber] = useState('WS-9901');

  // Selected Patients
  const [selectedIds, setSelectedIds] = useState(['PT-2026-0801']);
  const [pageSize, setPageSize] = useState(20);
  const [showStatePopup, setShowStatePopup] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // Filtered Patient List
  const filteredList = patients.filter(p => {
    // Basic Filters
    if (patientName && !p.name.toLowerCase().includes(patientName.toLowerCase())) return false;
    if (labCodeFrom && p.labCode && !p.labCode.includes(labCodeFrom)) return false;
    if (sampleBarcode && !p.samples.some(s => s.barcode.includes(sampleBarcode))) return false;
    if (selectState !== 'Select' && p.status !== selectState) return false;

    // Advanced Filters matching screenshot
    if (advDoctor && p.referringDoctor && !p.referringDoctor.toLowerCase().includes(advDoctor.toLowerCase())) return false;
    if (advCollectionCenter && p.b2bCenter && !p.b2bCenter.toLowerCase().includes(advCollectionCenter.toLowerCase())) return false;
    if (advAffiliation && p.referringDoctor && !p.referringDoctor.toLowerCase().includes(advAffiliation.toLowerCase())) return false;
    if (advMobileNumber && p.phone && !p.phone.includes(advMobileNumber)) return false;
    if (advPatientType !== 'None' && p.id && (advPatientType === 'I.P.D.' ? !p.id.includes('803') : p.id.includes('803'))) return false;

    return true;
  });

  const activeSelectedPatient = patients.find(p => p.id === selectedIds[0]) || filteredList[0] || patients[0];
  const activeStageConfig = WORKFLOW_STAGES[activeSelectedPatient?.status] || WORKFLOW_STAGES.REGISTERED;

  const handleSelectRow = (patient) => {
    setSelectedIds([patient.id]);
    setSelectedPatientId(patient.id);
    setShowStatePopup(true);
  };

  const handleToggleCheckbox = (e, id) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map(p => p.id));
    }
  };

  const handleExecuteTransition = (targetStatus) => {
    if (!activeSelectedPatient) return;
    const nextStatus = targetStatus || activeStageConfig.nextStatus;
    
    advancePatientStatus(activeSelectedPatient.id, nextStatus, workflowComment);
    
    if (nextStatus === 'AUTHORIZED') {
      authorizeReport(activeSelectedPatient.id, 'Dr. Pallavi Gedam', workflowComment || 'Workflow approved & printed.');
    }

    addNotification(
      'State Transition Confirmed',
      `Patient ${activeSelectedPatient.name} moved to state: "${WORKFLOW_STAGES[nextStatus]?.label || nextStatus}".`,
      'success'
    );

    setShowStatePopup(false);
    setWorkflowComment('');
  };

  const handleQuickAction = (actionName) => {
    if (selectedIds.length === 0) {
      alert(`Please select a patient to execute ${actionName}.`);
      return;
    }
    const target = patients.find(p => p.id === selectedIds[0]) || filteredList[0];
    if (target) {
      setSelectedPatientId(target.id);
      if (actionName === 'Result') {
        setActiveTab('worklist');
      } else if (actionName === 'Print Report' || actionName === 'Direct Print') {
        setActiveTab('reports');
      } else if (actionName === 'Registration') {
        setActiveTab('registration');
      } else {
        setActiveModal(actionName);
      }
    }
  };

  return (
    <div className="space-y-4">
      
      {/* ================= 1. SEARCH FILTER BOX (GlobalSearch.aspx) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-sky-600" />
            <h2 className="font-bold text-slate-900 text-sm">Global Search & Workflow Manager (GlobalSearch.aspx)</h2>
          </div>
          <span className="font-mono text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            Center: Gondiya Care (Gondiya Care)
          </span>
        </div>

        {/* Basic Search Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-4 flex items-center space-x-2">
            <span className="w-24 font-semibold text-slate-700">Patient Name</span>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded p-1.5 font-medium"
            />
          </div>

          <div className="sm:col-span-4 flex items-center space-x-2">
            <span className="w-20 font-semibold text-slate-700">From Date</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded p-1.5 font-mono"
            />
          </div>

          <div className="sm:col-span-4 flex items-center space-x-2">
            <span className="w-20 font-semibold text-slate-700">To Date</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded p-1.5 font-mono"
            />
          </div>
        </div>

        {/* Basic Search Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-4 flex items-center space-x-1.5">
            <span className="w-24 font-semibold text-slate-700">Lab Code</span>
            <input
              type="text"
              placeholder="From"
              value={labCodeFrom}
              onChange={(e) => setLabCodeFrom(e.target.value)}
              className="w-1/2 bg-white border border-slate-300 rounded p-1.5 font-mono"
            />
            <input
              type="text"
              placeholder="To"
              value={labCodeTo}
              onChange={(e) => setLabCodeTo(e.target.value)}
              className="w-1/2 bg-white border border-slate-300 rounded p-1.5 font-mono"
            />
          </div>

          <div className="sm:col-span-4 flex items-center space-x-2">
            <span className="w-32 font-semibold text-slate-700">Test/Sample Barcode</span>
            <input
              type="text"
              value={sampleBarcode}
              onChange={(e) => setSampleBarcode(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded p-1.5 font-mono"
            />
          </div>

          <div className="sm:col-span-4 flex items-center space-x-2">
            <span className="w-20 font-semibold text-slate-700">Select State</span>
            <select
              value={selectState}
              onChange={(e) => setSelectState(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded p-1.5"
            >
              <option value="Select">Select</option>
              <option value="REGISTERED">Registration</option>
              <option value="COLLECTED">Sample Collection</option>
              <option value="IN_TESTING">In Testing</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="AUTHORIZED">Printed / Released</option>
            </select>
          </div>
        </div>

        {/* Action & Export Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => addNotification('Search Applied', `Matching records: ${filteredList.length}`, 'info')}
            className="px-5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded text-xs shadow-sm transition-all"
          >
            Search
          </button>

          <button
            onClick={() => {
              exportToTallyXML(filteredList, 'Tally_Diagnostic_Sales_Vouchers');
              addNotification('Tally XML Downloaded', `Exported ${filteredList.length} accounting vouchers for Tally ERP.`, 'success');
            }}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs border border-slate-300 flex items-center space-x-1 shadow-2xs"
          >
            <span>Tally</span>
          </button>

          <button
            onClick={() => {
              exportToExcel(patients, 'GlobalSearch_All_Patients', GLOBAL_SEARCH_COLUMNS);
              addNotification('Excel Export Downloaded', `Exported all ${patients.length} records to Excel CSV.`, 'success');
            }}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs border border-slate-300 flex items-center space-x-1 shadow-2xs"
          >
            <span>ExcelAll</span>
          </button>

          <button
            onClick={() => {
              exportToExcel(filteredList, 'GlobalSearch_Filtered_Records', GLOBAL_SEARCH_COLUMNS);
              addNotification('Excel Export Downloaded', `Exported ${filteredList.length} filtered records to Excel CSV.`, 'success');
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs border border-emerald-700 flex items-center space-x-1 shadow-2xs"
          >
            <span>Excel</span>
          </button>

          <button
            onClick={() => addNotification('Fleet GPS', 'Phlebotomists on route.', 'info')}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300"
            title="Phlebotomist Home Collection Tracker"
          >
            <Bike className="h-4 w-4 text-emerald-700" />
          </button>
        </div>

        {/* ================= EXACT ADVANCE SEARCH ACCORDION (Matching Screenshot) ================= */}
        <div className="pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowAdvanceSearch(!showAdvanceSearch)}
            className="text-[#dc2626] font-bold text-xs flex items-center space-x-1 hover:underline"
          >
            {showAdvanceSearch ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <span>Advance Search</span>
          </button>

          {showAdvanceSearch && (
            <div className="space-y-3.5 p-4 mt-2 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in text-xs">
              
              {/* Row 1: 4 Balanced Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[85px]">Test Category</span>
                  <select
                    value={advTestCategory}
                    onChange={(e) => setAdvTestCategory(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5 text-slate-700"
                  >
                    <option value="">Select Category</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Immunology">Immunology</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[70px]">Test Name</span>
                  <select
                    value={advTestNameType}
                    onChange={(e) => setAdvTestNameType(e.target.value)}
                    className="w-24 shrink-0 bg-white border border-slate-300 rounded p-1.5 font-medium text-[11px]"
                  >
                    <option>Short Name</option>
                    <option>Full Name</option>
                  </select>
                  <input
                    type="text"
                    value={advTestNameInput}
                    onChange={(e) => setAdvTestNameInput(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[100px]">TestProfile Name</span>
                  <select
                    value={advProfileType}
                    onChange={(e) => setAdvProfileType(e.target.value)}
                    className="w-24 shrink-0 bg-white border border-slate-300 rounded p-1.5 font-medium text-[11px]"
                  >
                    <option>Short Name</option>
                    <option>Full Name</option>
                  </select>
                  <input
                    type="text"
                    value={advProfileInput}
                    onChange={(e) => setAdvProfileInput(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[105px]">Test Level Status</span>
                  <select
                    value={advTestLevelStatus}
                    onChange={(e) => setAdvTestLevelStatus(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5"
                  >
                    <option value="Select">Select</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Row 2: 3 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[110px]">Collection Center</span>
                  <input
                    type="text"
                    value={advCollectionCenter}
                    onChange={(e) => setAdvCollectionCenter(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[110px]">Affiliation Name</span>
                  <input
                    type="text"
                    value={advAffiliation}
                    onChange={(e) => setAdvAffiliation(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[90px]">Doctor Name</span>
                  <input
                    type="text"
                    value={advDoctor}
                    onChange={(e) => setAdvDoctor(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>
              </div>

              {/* Row 3: 3 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[110px]">External Barcode</span>
                  <input
                    type="text"
                    value={advExternalBarcode}
                    onChange={(e) => setAdvExternalBarcode(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[110px]">Mobile Number</span>
                  <input
                    type="text"
                    value={advMobileNumber}
                    onChange={(e) => setAdvMobileNumber(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[90px]">Patient Type</span>
                  <select
                    value={advPatientType}
                    onChange={(e) => setAdvPatientType(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5"
                  >
                    <option value="None">None</option>
                    <option value="I.P.D.">I.P.D.</option>
                    <option value="O.P.D.">O.P.D.</option>
                    <option value="Cashless">Cashless</option>
                    <option value="Walkin">Walkin</option>
                  </select>
                </div>
              </div>

              {/* Row 4: 3 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[170px]">Sample Collection From Date</span>
                  <input
                    type="date"
                    value={advCollFromDate}
                    onChange={(e) => setAdvCollFromDate(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[155px]">Sample Collection To Date</span>
                  <input
                    type="date"
                    value={advCollToDate}
                    onChange={(e) => setAdvCollToDate(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center space-x-1.5 cursor-pointer font-semibold text-slate-700 shrink-0">
                    <input
                      type="checkbox"
                      checked={advPrintParamsWkSheet}
                      onChange={(e) => setAdvPrintParamsWkSheet(e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Print Params on WkSheet</span>
                  </label>

                  <select
                    value={advSlotNumber}
                    onChange={(e) => setAdvSlotNumber(e.target.value)}
                    className="w-40 bg-white border border-slate-300 rounded p-1.5"
                  >
                    <option value="">Select Slot Number</option>
                    <option value="1">Slot 1</option>
                    <option value="2">Slot 2</option>
                  </select>
                </div>
              </div>

              {/* Row 5: 3 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[110px]">Area / Location</span>
                  <select
                    value={advAreaLocation}
                    onChange={(e) => setAdvAreaLocation(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5"
                  >
                    <option>Select All</option>
                    <option>Gondiya East</option>
                    <option>Gondiya West</option>
                    <option>Railway Station Road</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[125px]">Collection Boy Name</span>
                  <input
                    type="text"
                    value={advCollectionBoy}
                    onChange={(e) => setAdvCollectionBoy(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[145px]">Amount Pending Status</span>
                  <select
                    value={advAmountPendingStatus}
                    onChange={(e) => setAdvAmountPendingStatus(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5"
                  >
                    <option>All</option>
                    <option>Pending</option>
                    <option>Cleared</option>
                  </select>
                </div>
              </div>

              {/* Row 6: 3 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[110px]">Department</span>
                  <select
                    value={advDepartment}
                    onChange={(e) => setAdvDepartment(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5 text-slate-700"
                  >
                    <option value="">Select Department</option>
                    <option value="hematology">Hematology</option>
                    <option value="biochemistry">Biochemistry</option>
                    <option value="microbiology">Microbiology</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[80px]">User</span>
                  <select
                    value={advUser}
                    onChange={(e) => setAdvUser(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5 text-slate-700"
                  >
                    <option value="">Select User</option>
                    <option value="admin">Lab Admin</option>
                    <option value="pathologist">Dr. Pallavi Gedam</option>
                    <option value="tech">Lab Technician</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[140px]">Sample Collection At</span>
                  <select
                    value={advSampleCollectionAt}
                    onChange={(e) => setAdvSampleCollectionAt(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5"
                  >
                    <option>All</option>
                    <option>Lab Center</option>
                    <option>Home Collection</option>
                  </select>
                </div>
              </div>

              {/* Row 7: ICMR & Submit Button */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 min-w-[110px]">ICMR</span>
                  <select
                    value={advIcmr}
                    onChange={(e) => setAdvIcmr(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-300 rounded p-1.5"
                  >
                    <option>All</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={() => addNotification('Advance Search Executed', `Found ${filteredList.length} matching records.`, 'info')}
                    className="px-6 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Advance Search</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ================= 2. BATCH ACTION TOOLBAR (17 Buttons) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 text-xs space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            'Print WorkSheet',
            'Print',
            'Job Sheet',
            'Payment History',
            'Work Flow History',
            'Print Barcode',
            'Pending Test',
            'Send SMS',
            'Bulk Release',
            'Dispatch Sheet',
            'Summary Sheet',
            'TAT Pending'
          ].map(action => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold rounded-lg border border-sky-200 transition-colors shadow-xs"
            >
              {action}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          {[
            'Transfer Reg',
            'CC Daily Report',
            'PC-PNDT Report',
            'Pay Online',
            'Zip Download'
          ].map(action => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-200 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* ================= 3. WORKFLOW STATE TRANSITION BAR ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 font-bold">
            <span className="text-slate-500">Current State :</span>
            <span className="text-emerald-700 font-extrabold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {activeStageConfig.label}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-500">Next State :</span>
            <button
              onClick={() => setShowStatePopup(true)}
              className={`px-3.5 py-1 text-white font-bold rounded-lg shadow-sm flex items-center space-x-1 transition-all ${activeStageConfig.buttonColor}`}
            >
              <span>{activeStageConfig.nextLabel}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Enter Comment"
              value={workflowComment}
              onChange={(e) => setWorkflowComment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-slate-800 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono font-bold text-slate-700">
          <span className="text-slate-500 font-sans font-semibold text-xs">Worksheet Number :</span>
          <input
            type="text"
            value={worksheetNumber}
            onChange={(e) => setWorksheetNumber(e.target.value)}
            className="w-24 bg-slate-50 border border-slate-300 rounded p-1 text-center font-bold"
          />
        </div>
      </div>

      {/* ================= 4. TABLE QUICK ACTION LINKS & ROWS SLIDER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-100/90 p-2.5 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 font-bold text-[#0284c7]">
          {[
            'Result',
            'Registration',
            'Show TRF',
            'Bill Receipt',
            'Multiple Bill Receipt',
            'Print Report',
            'Re-Order to Machine',
            'Set Dispatched',
            'Direct Print'
          ].map(action => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              className="hover:underline hover:text-sky-900"
            >
              {action}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-slate-600 font-medium">
          <span>Select number of rows:</span>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="w-24 accent-slate-800"
          />
          <span className="font-mono font-bold text-slate-900">{pageSize}</span>
        </div>
      </div>

      {/* ================= 5. MASTER OPERATIONS DATA GRID ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
              <tr>
                <th className="p-2.5 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredList.length && filteredList.length > 0}
                    onChange={handleSelectAll}
                    className="rounded cursor-pointer"
                  />
                </th>
                <th className="p-2.5">Lab Code</th>
                <th className="p-2.5 text-center">IPD/OPD</th>
                <th className="p-2.5">Patient Name</th>
                <th className="p-2.5">Affiliation</th>
                <th className="p-2.5">Test Name</th>
                <th className="p-2.5">Regn Date</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-right">Total A...</th>
                <th className="p-2.5 text-right">Balanc...</th>
                <th className="p-2.5">Collection Center</th>
                <th className="p-2.5 text-center">PatientAge</th>
                <th className="p-2.5 text-center">Gend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredList.slice(0, pageSize).map(p => {
                const isSelected = selectedIds.includes(p.id);
                const isPrinted = p.status === 'AUTHORIZED' || p.status === 'DISPATCHED' || p.status === 'COMPLETED';
                const isReg = p.status === 'REGISTERED';
                const textColor = isReg ? 'text-[#dc2626]' : isPrinted ? 'text-emerald-700' : 'text-slate-800';

                return (
                  <tr
                    key={p.id}
                    onClick={() => handleSelectRow(p)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50/80 ring-1 ring-sky-300 font-semibold'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleToggleCheckbox(e, p.id)}
                        className="rounded cursor-pointer"
                      />
                    </td>

                    <td className="p-2.5 font-mono font-bold">
                      <div className="flex items-center space-x-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                        <span className={textColor}>
                          {p.labCode || (p.uhid ? String(p.uhid).replace('UHID-', '1608260') : '-')}
                        </span>
                      </div>
                    </td>

                    <td className="p-2.5 text-center font-bold">
                      <span className={p.id?.includes('803') ? 'text-emerald-700' : textColor}>
                        {p.id?.includes('803') ? 'IPD' : 'OPD'}
                      </span>
                    </td>

                    <td className={`p-2.5 font-bold uppercase ${textColor}`}>
                      {p.name}
                    </td>

                    <td className="p-2.5 font-medium text-slate-600">
                      {p.referringDoctor || 'N/A'}
                    </td>

                    <td className={`p-2.5 font-bold ${textColor}`}>
                      {Array.isArray(p.tests) ? p.tests.map(t => typeof t === 'string' ? t.replace('TEST_', '') : (t?.name || t?.testId || '')).join(', ') : '-'}
                    </td>

                    <td className="p-2.5 font-mono text-[11px] text-slate-600">
                      {p.registrationDate}
                    </td>

                    <td className="p-2.5 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPrinted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isReg
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {isPrinted ? 'Printed' : isReg ? 'Registration' : p.status}
                      </span>
                    </td>

                    <td className={`p-2.5 text-right font-mono font-bold ${textColor}`}>
                      {p.billing?.grossTotal || 400}
                    </td>

                    <td className={`p-2.5 text-right font-mono font-bold ${textColor}`}>
                      {p.billing?.dueAmount ?? (p.billing?.grossTotal || 400)}
                    </td>

                    <td className="p-2.5 font-medium text-slate-700">
                      {p.b2bCenter || 'Gondiya Care'}
                    </td>

                    <td className={`p-2.5 text-center font-mono font-bold ${textColor}`}>
                      {p.age} Y
                    </td>

                    <td className="p-2.5 text-center font-semibold text-slate-700">
                      {p.gender || 'Female'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Showing {Math.min(filteredList.length, pageSize)} of {filteredList.length} records</span>
          <span className="font-mono text-slate-600">
            Selected: <strong className="text-slate-900">{activeSelectedPatient?.name}</strong> • Click any row to open state workflow
          </span>
        </div>
      </div>

      {/* ================= 6. WORKFLOW STATE TRANSITION POPUP MODAL ================= */}
      {showStatePopup && activeSelectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{activeSelectedPatient.name}</h3>
                  <p className="text-slate-500 font-mono">
                    Lab Code: <strong className="text-slate-800">{activeSelectedPatient.labCode || activeSelectedPatient.uhid}</strong> • {activeSelectedPatient.age}y / {activeSelectedPatient.gender}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStatePopup(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-500">Current Workflow State:</span>
                <span className={`px-2.5 py-1 rounded-full text-white font-mono ${
                  activeSelectedPatient.status === 'REGISTERED' ? 'bg-rose-600' :
                  activeSelectedPatient.status === 'COLLECTED' ? 'bg-orange-600' :
                  activeSelectedPatient.status === 'IN_TESTING' ? 'bg-sky-600' :
                  activeSelectedPatient.status === 'PENDING_APPROVAL' ? 'bg-amber-600' :
                  'bg-emerald-600'
                }`}>
                  {activeStageConfig.label}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Next Action Stage:</p>
                  <p className="text-slate-500 text-[11px]">{activeStageConfig.nextLabel}</p>
                </div>
                <button
                  onClick={() => handleExecuteTransition(activeStageConfig.nextStatus)}
                  className={`px-4 py-2 text-white font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all ${activeStageConfig.buttonColor}`}
                >
                  <span>Advance to {activeStageConfig.nextLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block font-bold text-slate-700">Transition Log Comment / Notes:</label>
                <input
                  type="text"
                  placeholder="e.g. Sample verified at phlebotomy, Routine EDTA collected"
                  value={workflowComment}
                  onChange={(e) => setWorkflowComment(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setSelectedPatientId(activeSelectedPatient.id);
                  setShowStatePopup(false);
                  setActiveTab('worklist');
                }}
                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center space-x-1"
              >
                <FlaskConical className="h-3.5 w-3.5 text-sky-600" />
                <span>Enter Results</span>
              </button>

              <button
                onClick={() => {
                  setSelectedPatientId(activeSelectedPatient.id);
                  setShowStatePopup(false);
                  setActiveTab('reports');
                }}
                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center space-x-1"
              >
                <Printer className="h-3.5 w-3.5 text-emerald-600" />
                <span>View / Print PDF</span>
              </button>

              <button
                onClick={() => handleExecuteTransition('AUTHORIZED')}
                className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 flex items-center justify-center space-x-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Mark Printed</span>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowStatePopup(false)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
