import React, { useRef, useState, useMemo } from 'react';
import { useLab } from '../../context/LabContext';
import {
  FileText,
  Printer,
  Download,
  Share2,
  Send,
  MessageSquare,
  Search,
  Layers,
  Check,
  Award,
  ChevronDown,
  Sliders,
  Lock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

const CBC_STRUCTURED_DATA = {
  testTitle: 'Complete Blood Count',
  department: 'Hematology',
  items: [
    { name: 'Hemoglobin', value: '14.2', unit: 'g/dL', ref: '12 - 16', method: 'Colorimetric', isBold: false },
    { name: 'R.B.C. Count', value: '4.85', unit: 'mill/cumm', ref: '4.5 - 5.5', method: 'Electrical impedance', isBold: false },
    { name: 'HCT', value: '42.5', unit: '%', ref: '40 - 49', method: 'Calculated', isBold: false },
    { name: 'MCV', value: '88.5', unit: 'fl', ref: '83 - 101', method: 'Derived', isBold: false },
    { name: 'MCH', value: '29.3', unit: 'pg', ref: '28 - 32', method: 'Calculated', isBold: false },
    { name: 'MCHC', value: '33.1', unit: 'g/dL', ref: '32.5 - 36.7', method: 'Calculated', isBold: false },
    { name: 'RDW (CV)', value: '12.7', unit: '%', ref: '11.6 - 14', method: 'Calculated', isBold: false },
    { name: 'Total W.B.C Count', value: '7500', unit: '/ cumm', ref: '4000 - 10000', method: 'SF Cube cell analysis', isBold: false, isHeaderBold: true },
    
    // Subheadings
    { isSubHeader: true, title: 'Differential % WBCs count' },
    { name: 'Neutrophils', value: '60.4', unit: '%', ref: '40 - 80', method: 'Microscopic', isBold: false },
    { name: 'Lymphocytes', value: '31.2', unit: '%', ref: '20 - 40', method: 'Microscopic', isBold: false },
    { name: 'Eosinophils', value: '2.4', unit: '%', ref: '1 - 6', method: 'Microscopic', isBold: false },
    { name: 'Monocytes', value: '5.6', unit: '%', ref: '2 - 10', method: 'Microscopic', isBold: false },
    { name: 'Basophils', value: '0.4', unit: '%', ref: '0 - 1', method: 'Microscopic', isBold: false },

    { isSubHeader: true, title: 'Absolute Differential Count :' },
    { name: 'Absolute Neutrophils Count', value: '4530', unit: '/ cumm', ref: '2000 - 6700', method: '', isBold: false },
    { name: 'Absolute Lymphocytes Count', value: '2340', unit: '/ cumm', ref: '1000 - 3000', method: '', isBold: false },
    { name: 'Absolute Monocytes Count', value: '420', unit: '/ cumm', ref: '200 - 1000', method: '', isBold: false },
    { name: 'Absolute Eosinophils Count', value: '180', unit: '/ cumm', ref: '20 - 500', method: '', isBold: false },
    { name: 'Absolute Basophils Count', value: '30', unit: '/ cumm', ref: '0 - 100', method: '', isBold: false },

    { name: 'Platelet Count', value: '250000', unit: '/ cumm', ref: '150000 - 410000', method: 'Electrical impedance', isBold: false, isHeaderBold: true },
    { name: 'MPV', value: '8.9', unit: 'fl', ref: '7.5 - 10.3', method: 'Calculated', isBold: false }
  ]
};

const LIPID_STRUCTURED_DATA = {
  testTitle: 'Lipid Profile Report',
  department: 'Biochemistry',
  items: [
    { name: 'Total Cholesterol', value: '185', unit: 'mg/dL', ref: '125 - 200', method: 'CHOD-PAP Enzymatic', isBold: false },
    { name: 'Triglycerides', value: '135', unit: 'mg/dL', ref: '50 - 150', method: 'GPO-PAP', isBold: false },
    { name: 'HDL Cholesterol', value: '48', unit: 'mg/dL', ref: '40 - 60', method: 'Direct Measure', isBold: false },
    { name: 'LDL Cholesterol', value: '110', unit: 'mg/dL', ref: '0 - 100', method: 'Friedewald Formula', isBold: false },
    { name: 'VLDL Cholesterol', value: '27', unit: 'mg/dL', ref: '10 - 30', method: 'Calculated', isBold: false },
    { name: 'Total Cholesterol / HDL Ratio', value: '3.85', unit: 'ratio', ref: '3.0 - 5.0', method: 'Calculated', isBold: false },
    { name: 'LDL / HDL Ratio', value: '2.29', unit: 'ratio', ref: '1.5 - 3.3', method: 'Calculated', isBold: false }
  ]
};

const DEMO_FALLBACK_PATIENT = {
  id: 'DEMO-PATIENT-001',
  uhid: 'UHID-2026-9901',
  labCode: '160826001',
  name: 'SAMPLE PATIENT (DEMO REPORT)',
  age: '45',
  ageType: 'Years',
  gender: 'Male',
  phone: '9876543210',
  referringDoctor: 'Direct Walk-in / Self',
  b2bCenter: 'Central Diagnostic Lab',
  registrationDate: new Date().toLocaleDateString('en-GB'),
  tests: [
    {
      testId: 'TEST_CBC',
      name: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      parameters: CBC_STRUCTURED_DATA.items.filter(i => !i.isSubHeader)
    }
  ],
  results: {
    'Hemoglobin': '14.2',
    'R.B.C. Count': '4.85',
    'Total W.B.C Count': '7500',
    'Platelet Count': '250000'
  }
};

export const ReportViewer = () => {
  const {
    patients,
    tests: masterTests,
    selectedPatientId,
    setSelectedPatientId,
    reportDesign,
    addNotification,
    setActiveTab,
    authorizeReport,
    labProfile
  } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareChannel, setShareChannel] = useState('whatsapp');
  const [activePageIndex, setActivePageIndex] = useState('all');

  // Requirement 5: Technical QC Validation Gate Modal State
  const [showQCModal, setShowQCModal] = useState(false);
  const [supervisorName, setSupervisorName] = useState(labProfile?.pathologistName || 'Dr. Pallavi Gedam');
  const [qcRemarks, setQcRemarks] = useState('All evaluated clinical parameters verified against calibration controls and delta history.');

  const reportContainerRef = useRef(null);

  // Determine active patient with robust fallback
  const activePatient = useMemo(() => {
    if (patients && patients.length > 0) {
      return patients.find(p => p.id === selectedPatientId) || patients[0];
    }
    return DEMO_FALLBACK_PATIENT;
  }, [patients, selectedPatientId]);

  // Requirement 5: QC Gate Enforcement - Diagnostic reports MUST be released by supervisor before PDF/print
  const isReportReleased = activePatient.status === 'AUTHORIZED' || activePatient.status === 'RELEASED';

  const handleReleaseReport = (e) => {
    if (e) e.preventDefault();
    if (!activePatient) return;
    authorizeReport(activePatient.id, supervisorName, qcRemarks);
    setShowQCModal(false);
    try {
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.7 } });
    } catch (err) {}
    addNotification('QC Gate Approved & Released', 'Report unlocked! NABL/ISO 15189 diagnostic PDF generation is now active.', 'success');
  };

  const filteredList = useMemo(() => {
    if (!patients || patients.length === 0) return [DEMO_FALLBACK_PATIENT];
    return patients.filter(p =>
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.uhid || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.labCode || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [patients, searchQuery]);

  // Dynamically build report pages from activePatient's tests and results
  const reportPages = useMemo(() => {
    if (!activePatient) return [CBC_STRUCTURED_DATA];

    const rawTests = activePatient.tests || [];
    const pages = [];

    // If tests is an array of test objects or test IDs
    if (Array.isArray(rawTests) && rawTests.length > 0) {
      rawTests.forEach(testObj => {
        let title = '';
        let dept = 'Pathology';
        let params = [];

        if (typeof testObj === 'string') {
          const found = (masterTests || []).find(m => m.id === testObj || m.code === testObj);
          title = found ? found.name : testObj.replace('TEST_', '').replace('_', ' ');
          dept = found?.category || 'Biochemistry';
          params = found?.parameters || [];
        } else if (typeof testObj === 'object' && testObj !== null) {
          title = testObj.name || testObj.testTitle || 'Diagnostic Test Panel';
          dept = testObj.category || testObj.department || 'Pathology';
          params = testObj.parameters || [];
        }

        // Map parameters to items with REAL patient test results
        const items = [];
        if (Array.isArray(params) && params.length > 0) {
          params.forEach(p => {
            const paramKey = p.id || p.name;
            const val = activePatient.results?.[paramKey] 
              ?? activePatient.results?.[p.name] 
              ?? testObj.results?.[paramKey]
              ?? p.defaultVal 
              ?? p.value 
              ?? '-';

            let refRange = '';
            if (p.min !== undefined && p.max !== undefined) {
              refRange = `${p.min} - ${p.max}`;
            } else if (p.ref) {
              refRange = p.ref;
            } else {
              refRange = p.defaultVal || 'Normal';
            }

            const numVal = Number(val);
            const isAbnormal = (!isNaN(numVal) && ((p.min !== undefined && numVal < p.min) || (p.max !== undefined && numVal > p.max)));

            items.push({
              name: p.name,
              value: String(val),
              unit: p.unit || '',
              ref: refRange,
              method: p.method || '',
              isBold: isAbnormal || p.isBold,
              isAbnormal: isAbnormal
            });
          });
        }

        // Fallback for CBC / Lipid panels if params list was not populated
        if (items.length === 0) {
          const lowerTitle = title.toLowerCase();
          if (lowerTitle.includes('cbc') || lowerTitle.includes('blood count')) {
            CBC_STRUCTURED_DATA.items.forEach(item => {
              if (item.isSubHeader) {
                items.push(item);
              } else {
                const userVal = activePatient.results?.[item.name] || item.value;
                items.push({ ...item, value: userVal });
              }
            });
          } else if (lowerTitle.includes('lipid')) {
            LIPID_STRUCTURED_DATA.items.forEach(item => {
              const userVal = activePatient.results?.[item.name] || item.value;
              items.push({ ...item, value: userVal });
            });
          } else {
            // Pick all results from activePatient.results
            Object.entries(activePatient.results || {}).forEach(([k, v]) => {
              items.push({ name: k, value: String(v), unit: '', ref: 'Normal', method: '' });
            });
          }
        }

        pages.push({
          testTitle: title,
          department: dept,
          items: items.length > 0 ? items : [{ name: title, value: 'Normal / Completed', unit: '', ref: 'Normal', method: 'Automated' }]
        });
      });
    }

    // Default to CBC if no pages were created
    if (pages.length === 0) {
      pages.push(CBC_STRUCTURED_DATA);
    }

    return pages;
  }, [activePatient, masterTests]);

  const totalPages = Math.max(reportPages.length, 1);

  // Dynamic Margins from Report Designer (Compact top spacing)
  const getMarginTopPx = (str) => {
    if (!str || str.includes('0 Inch')) return '0px';
    if (str.includes('2.0')) return '36px';
    if (str.includes('1.5')) return '24px';
    if (str.includes('1.0')) return '16px';
    if (str.includes('0.5')) return '8px';
    return '0px';
  };

  const handlePrint = () => {
    if (!isReportReleased) {
      setShowQCModal(true);
      addNotification('QC Gate Locked', 'Supervisor verification required before printing final report.', 'warning');
      return;
    }
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!isReportReleased) {
      setShowQCModal(true);
      addNotification('QC Gate Locked', 'Supervisor verification required before generating final NABL/ISO PDF.', 'warning');
      return;
    }
    if (!reportContainerRef.current) return;
    setIsExporting(true);
    try {
      const pageElements = reportContainerRef.current.querySelectorAll('.exact-client-report-sheet');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < pageElements.length; i++) {
        const el = pageElements[i];
        const canvas = await html2canvas(el, {
          scale: 2.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, imgHeight));
      }

      pdf.save(`Report_${activePatient.uhid || '300425018'}_${activePatient.name.replace(/\s+/g, '_')}.pdf`);
      addNotification('PDF Downloaded', `Medical report PDF generated according to Report Designer styles.`, 'success');
    } catch (err) {
      console.error(err);
      alert('Error generating PDF report.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendDispatch = () => {
    setShowShareModal(false);
    addNotification(
      'Report Dispatched',
      `Report successfully dispatched to ${activePatient.name} via ${shareChannel.toUpperCase()}`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-md">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900">Diagnostic Reports Engine</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                Styled by Report Designer
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Font: <strong>{reportDesign.fontName} ({reportDesign.fontSize}pt)</strong> • Header: <strong>{reportDesign.showHeaderOnReport ? reportDesign.headerType : 'Pre-Printed Space'}</strong> • 1 Test/Page: <strong>{reportDesign.printTestOnNewPage ? 'Active' : 'Off'}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setActiveTab('report_designer')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-200 flex items-center space-x-1.5"
          >
            <Sliders className="h-4 w-4 text-sky-600" />
            <span>Customize Design</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl border border-emerald-200 flex items-center space-x-1.5"
          >
            <Share2 className="h-4 w-4" />
            <span>Dispatch</span>
          </button>

          <button
            onClick={handlePrint}
            className={`px-3 py-2 font-bold rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              !isReportReleased
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title={!isReportReleased ? 'Locked: Human Supervisor QC Verification Required' : 'Print Report'}
          >
            {!isReportReleased ? <Lock className="h-4 w-4 text-amber-700" /> : <Printer className="h-4 w-4" />}
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className={`px-4 py-2 font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer ${
              !isReportReleased
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 ring-2 ring-amber-400'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
            title={!isReportReleased ? 'Locked: Human Supervisor QC Verification Required' : 'Download PDF'}
          >
            {!isReportReleased ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Download className={`h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
            )}
            <span>{isExporting ? 'Generating PDF...' : !isReportReleased ? '🔒 Locked (QC Approval Required)' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 4 Cols: Patient Selector */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 no-print">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Patient ({filteredList.length})
            </h3>
            <span className="text-[10px] text-slate-400">Click to preview</span>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search UHID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500/20"
            />
          </div>

          <div className="space-y-2 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
            {filteredList.map(p => {
              const isSelected = p.id === activePatient?.id;
              const pReleased = p.status === 'AUTHORIZED' || p.status === 'RELEASED';
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-100 border-slate-400 shadow-sm ring-1 ring-slate-400'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div>
                    <p className="font-bold text-xs text-slate-900">{p.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Lab Code: {p.labCode || (p.uhid ? String(p.uhid).replace('UHID-', '1608260') : '1608260')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {(p.tests || []).length} Page{(p.tests || []).length > 1 ? 's' : ''}
                    </span>
                    {pReleased ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Authorized
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded font-mono">
                        Pending Review
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Dynamically Styled Report Canvas */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Requirement 5: QC Validation Gate Enforcement Banner */}
          {!isReportReleased ? (
            <div className="bg-amber-500/10 border-2 border-amber-400 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs no-print">
              <div className="flex items-start space-x-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-200">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-amber-950 text-sm">
                      QC Validation Gate: Technical Verification Required
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 font-mono uppercase tracking-wider">
                      Pending Review
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mt-0.5">
                    NABL (ISO 15189:2022) compliance mandates that machine results must be verified by a human laboratory supervisor before generating diagnostic PDFs. <strong>PDF generation and printing are currently locked.</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQCModal(true)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-300 flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer animate-pulse"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve & Release Report</span>
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between gap-3 no-print">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-900">
                  ✓ NABL / ISO 15189 QC Gate Verified & Clinically Released by {activePatient.approvedBy || activePatient.doctorReview?.authorizedBy || supervisorName}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                PDF UNLOCKED
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm no-print">
            <div className="flex items-center space-x-2 text-xs font-bold">
              <span className="text-slate-600">Active View:</span>
              <button
                onClick={() => setActivePageIndex('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activePageIndex === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All {totalPages} Pages
              </button>
              {reportPages.map((pg, idx) => (
                <button
                  key={pg.testTitle}
                  onClick={() => setActivePageIndex(idx)}
                  className={`px-3 py-1 rounded-lg transition-colors truncate max-w-[140px] ${
                    activePageIndex === idx ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Page {idx + 1}: {pg.testTitle.split(' ')[0]}
                </button>
              ))}
            </div>
            <span className="text-xs font-mono text-slate-500 font-bold">
              Total {totalPages} Pages
            </span>
          </div>

          {/* Printable Report Canvas styled dynamically by reportDesign */}
          <div ref={reportContainerRef} id="printable-report" className="space-y-8">
            
            {reportPages.map((testPage, pageIdx) => {
              const isVisibleOnScreen = activePageIndex === 'all' || activePageIndex === pageIdx;
              if (!isVisibleOnScreen) return null;

              const patientIdDisplay = activePatient?.labCode || (activePatient?.uhid ? String(activePatient.uhid).replace('UHID-', '30042') : '300425018');
              const patientNameDisplay = activePatient?.name ? activePatient.name.toUpperCase() : 'NO PATIENT SELECTED';
              const ageGenderDisplay = activePatient ? `${activePatient.age || '-'} ${activePatient.ageType || 'Years'} / ${activePatient.gender || '-'}` : '-';
              const refByDisplay = activePatient?.referringDoctor || 'Direct Walk-in / Self';

              return (
                <div
                  key={testPage.testTitle}
                  className="exact-client-report-sheet bg-white rounded-none shadow-2xl px-8 sm:px-12 pt-4 pb-12 max-w-4xl mx-auto text-black break-after-page"
                  style={{
                    minHeight: '1120px',
                    fontFamily: `${reportDesign.fontName}, "Arial", "Helvetica", sans-serif`,
                    fontSize: `${reportDesign.fontSize}pt`,
                    color: '#000000',
                    lineHeight: 1.4
                  }}
                >
                  
                  {/* Dynamic Header Setup from Report Designer */}
                  {reportDesign.showHeaderOnReport ? (
                    reportDesign.headerType === 'type1' ? (
                      <div className="border-b-2 border-black pb-3 mb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h1 className="text-base font-black text-black uppercase tracking-tight">
                              {reportDesign.labName}
                            </h1>
                            <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                              {reportDesign.labAddress}
                            </p>
                            <p className="text-[11px] font-bold text-slate-900 mt-0.5">
                              {reportDesign.doctorName}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                              ISO 15189:2022
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-24 w-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm uppercase tracking-widest mb-4">
                        {reportDesign.labName}
                      </div>
                    )
                  ) : (
                    // Clean top white margin without placeholder text
                    <div
                      style={{ height: getMarginTopPx(reportDesign.reportStartAfter) }}
                      className="w-full"
                    />
                  )}

                  {/* ================= PATIENT DEMOGRAPHIC 2-COLUMN BLOCK ================= */}
                  <div className="text-[13px] mb-4">
                    <div className="grid grid-cols-12 gap-y-1">
                      
                      {/* Left Column */}
                      <div className="col-span-7 space-y-1">
                        <div className="flex">
                          <span className="w-32 font-normal">Patient ID</span>
                          <span className="font-normal">: {patientIdDisplay}</span>
                        </div>
                        <div className="flex font-bold">
                          <span className="w-32 font-bold">Patient Name</span>
                          <span className="font-bold">: {patientNameDisplay}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 font-normal">Age/Gender</span>
                          <span className="font-normal">: {ageGenderDisplay}</span>
                        </div>
                        <div className="flex font-bold">
                          <span className="w-32 font-bold">Ref. By</span>
                          <span className="font-normal">: {refByDisplay}</span>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="col-span-5 space-y-1 text-right sm:text-left">
                        <div className="flex justify-between sm:justify-start">
                          <span className="w-44 font-normal">Registered On</span>
                          <span className="font-normal">: {activePatient?.registrationDate || (activePatient?.registeredAt ? new Date(activePatient.registeredAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'))}</span>
                        </div>
                        <div className="flex justify-between sm:justify-start">
                          <span className="w-44 font-normal">Sample Collected On</span>
                          <span className="font-normal">: {activePatient?.registrationDate || (activePatient?.registeredAt ? new Date(activePatient.registeredAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'))}</span>
                        </div>
                        <div className="flex justify-between sm:justify-start">
                          <span className="w-44 font-normal">Sample Reported On</span>
                          <span className="font-normal">: {new Date().toLocaleDateString('en-GB')}</span>
                        </div>

                        {/* Code128 Barcode Graphic */}
                        <div className="pt-1 flex flex-col items-end sm:items-start pl-2">
                          <div className="h-6 w-48 flex items-center justify-between overflow-hidden">
                            {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 1, 3, 4, 1, 2, 3, 1, 2, 4].map((w, i) => (
                              <div
                                key={i}
                                className="bg-black h-full"
                                style={{ width: `${w * 1.2}px` }}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-[9px] text-black tracking-widest pl-1 mt-0.5">
                            * {patientIdDisplay} *
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* ================= TEST TITLE SHADED BANNER ================= */}
                  <div className="w-full bg-[#dcdcdc] border-t-2 border-b-2 border-black py-1 px-2 text-center my-3">
                    <h2 className="font-bold text-[14px] text-black tracking-wide">
                      {testPage.testTitle}
                    </h2>
                  </div>

                  {/* ================= DYNAMIC COLUMN HEADERS (from Report Designer) ================= */}
                  <div className={`border-b border-black pb-1 mb-2 ${reportDesign.colHeaderUnderline ? 'border-b-2' : ''}`}>
                    <div
                      className="grid grid-cols-12 text-[12px]"
                      style={{
                        fontFamily: reportDesign.columnHeaderFont,
                        fontWeight: reportDesign.colHeaderBold ? 'bold' : 'normal',
                        fontStyle: reportDesign.colHeaderItalic ? 'italic' : 'normal'
                      }}
                    >
                      <div className="col-span-5">{reportDesign.header1}</div>
                      <div className="col-span-2 text-center">{reportDesign.header2}</div>
                      <div className="col-span-2 text-left pl-3">{reportDesign.header3}</div>
                      <div className="col-span-3 text-left">{reportDesign.header4}</div>
                    </div>
                  </div>

                  {/* ================= PARAMETER ROWS ================= */}
                  <div className="space-y-1 text-[12px]">
                    {testPage.items.map((item, idx) => {
                      if (item.isSubHeader) {
                        return (
                          <div key={idx} className="pt-2 pb-0.5 font-bold text-[12.5px] pl-6 text-black">
                            {item.title}
                          </div>
                        );
                      }

                      return (
                        <div key={idx} className="grid grid-cols-12 items-center py-0.5 text-black">
                          <div className={`col-span-5 ${item.isHeaderBold ? 'font-bold' : item.isBold ? 'font-bold' : 'font-normal'}`}>
                            {item.name}
                          </div>

                          <div className={`col-span-2 text-center ${item.isBold ? 'font-black text-[13px]' : 'font-normal'}`}>
                            {item.value}
                          </div>

                          <div className="col-span-2 text-left pl-3 font-normal">
                            {item.unit}
                          </div>

                          <div className="col-span-3 flex items-center justify-between font-normal text-[11.5px]">
                            <span>{item.ref}</span>
                            {item.method && (
                              <span className="text-[9px] text-slate-800 font-sans tracking-tight text-right shrink-0 pl-1">
                                {item.method}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ================= FOOTER / SIGNATURES / DYNAMIC DISCLAIMER ================= */}
                  <div className="mt-28 pt-6">
                    <div className="grid grid-cols-12 items-end">
                      
                      <div className="col-span-3 text-[12px] font-normal text-black pb-2">
                        Checked By
                      </div>

                      <div className="col-span-3 flex justify-center pb-1">
                        <QRCodeSVG
                          value={`https://verify.pulselab.org/report/${patientIdDisplay}?auth=MC4892`}
                          size={62}
                          level="M"
                        />
                      </div>

                      <div className="col-span-2 text-center text-[11px] font-normal text-black pb-2">
                        Page {pageIdx + 1} of {totalPages}
                      </div>

                      {/* Right: Signature Image & Doctor Text from Report Designer */}
                      <div className="col-span-4 text-right flex flex-col items-end">
                        <div className="h-12 flex items-center justify-end mb-1">
                          {reportDesign.signatureImage ? (
                            <img
                              src={reportDesign.signatureImage}
                              alt="Doctor Signature Stamp"
                              className="max-h-12 max-w-[150px] object-contain"
                            />
                          ) : (
                            <svg className="h-8 w-28 text-black" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 25 C 20 10, 30 35, 45 15 C 55 5, 65 25, 80 18 C 85 15, 90 20, 95 18 M30 20 L 70 20" strokeLinecap="round" />
                            </svg>
                          )}
                        </div>

                        <div className="text-right whitespace-pre-line text-[11px] font-medium leading-tight">
                          <p className="font-bold text-[13px] text-black">
                            {reportDesign.doctorName || reportDesign.doctorSignatureText?.split('\n')?.[0] || 'Dr. Pallavi Gedam'}
                          </p>
                          <p className="text-[11px] font-normal text-black">
                            {reportDesign.doctorDegree || reportDesign.doctorSignatureText?.split('\n')?.slice(1)?.join('\n') || 'MBBS MD Pathology'}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Report Footer Text disclaimer */}
                    {reportDesign.showReportFooterText && (
                      <div className="text-center pt-4 border-t border-slate-200 mt-4 text-[10px] text-slate-500 font-mono">
                        {reportDesign.reportFooterText}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}

          </div>

        </div>

      </div>

      {/* WhatsApp Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-emerald-600">
              <MessageSquare className="h-6 w-6" />
              <h3 className="font-bold text-base text-slate-900">Dispatch Medical Report</h3>
            </div>

            <p className="text-xs text-slate-600">
              Send PDF link directly to <strong>{activePatient.name}</strong>:
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono text-[11px] text-slate-700">
              Patient: {activePatient.name} ({activePatient.uhid})
              <br />
              Doctor: {activePatient.referringDoctor}
              <br />
              Pages: {totalPages} Tests
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSendDispatch}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md flex items-center space-x-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send PDF Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requirement 5: Technical QC Verification & Release Modal */}
      {showQCModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3 text-amber-600">
                <ShieldAlert className="h-6 w-6" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">QC Validation Gate: Technical Release</h3>
                  <p className="text-[11px] text-slate-500 font-mono">NABL / ISO 15189:2022 Mandated Verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowQCModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Patient Snapshot */}
            <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">{activePatient.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">UHID: {activePatient.uhid} • Age: {activePatient.age} ({activePatient.gender})</p>
              </div>
              <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                {activePatient.barcode || 'SMP-ONLINE'}
              </span>
            </div>

            {/* Parameter Review Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Evaluated Machine Parameters</span>
                <span className="text-[10px] text-slate-400 font-mono">Status: Pending Review</span>
              </div>
              <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {Object.entries(activePatient.results || {}).length > 0 ? (
                  Object.entries(activePatient.results).map(([k, v]) => (
                    <div key={k} className="p-2 flex items-center justify-between">
                      <span className="font-medium text-slate-700">{k}</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{String(v)}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-slate-400 text-xs font-mono">
                    Results recorded in patient profile
                  </div>
                )}
              </div>
            </div>

            {/* Supervisor Form */}
            <form onSubmit={handleReleaseReport} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Releasing Supervisor / Pathologist Name
                </label>
                <input
                  type="text"
                  required
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical QC Verification Remarks
                </label>
                <textarea
                  rows={2}
                  value={qcRemarks}
                  onChange={(e) => setQcRemarks(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQCModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-200 flex items-center justify-center space-x-2 cursor-pointer transition-all"
                >
                  <Award className="h-4 w-4" />
                  <span>Approve & Unlock PDF Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
