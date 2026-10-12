import React, { useState, useEffect } from 'react';
import { useLab } from '../../context/LabContext';
import {
  FileText,
  Sliders,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  CheckCircle2,
  Receipt,
  Eye,
  Type,
  Layout,
  Columns
} from 'lucide-react';

const INITIAL_CONFIGURATIONS = [
  { id: '1', name: 'Covid Report Only', type: 'Four Column Report' },
  { id: '2', name: 'Four Column Report', type: 'Four Column Report' },
  { id: '3', name: 'FOUR COLUMN REPORT FOR TECHNO', type: 'Four Column Report' },
  { id: '4', name: 'Graph Report', type: 'Graph' },
  { id: '5', name: 'Histo & FNAC', type: 'Two Column Report' },
  { id: '6', name: 'Micro', type: 'Two Column Report' },
  { id: '7', name: 'TemplateBasedHtmlReport', type: 'Template Based Html Report' },
  { id: '8', name: 'Three Column Report', type: 'Three Column Report' },
  { id: '9', name: 'Two Column Report', type: 'Two Column Report' }
];

export const ReportDesigner = () => {
  const { reportDesign, updateReportDesign, addNotification, setActiveTab } = useLab();

  // Top Tabs: 'report' | 'bill'
  const [activeMainTab, setActiveMainTab] = useState('report');

  // Accordion Sections State
  const [openSections, setOpenSections] = useState({
    grid: false,
    header: true,
    mainReport: true,
    testSetup: true,
    footer: true
  });

  const toggleSection = (sec) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const [configurations, setConfigurations] = useState(INITIAL_CONFIGURATIONS);
  const [selectedConfigId, setSelectedConfigId] = useState('2');

  // Section 1: Header Setup
  const [headerSetup, setHeaderSetup] = useState({
    showHeaderOnReport: reportDesign.showHeaderOnReport,
    showHeaderForMobile: reportDesign.showHeaderForMobile,
    headerType: reportDesign.headerType,
    labName: reportDesign.labName,
    labAddress: reportDesign.labAddress,
    doctorName: reportDesign.doctorName
  });

  // Section 2: Main Report (Patient Details)
  const [mainReportSetup, setMainReportSetup] = useState({
    configName: reportDesign.configName,
    reportType: reportDesign.reportType,
    fontName: reportDesign.fontName,
    fontSize: reportDesign.fontSize,
    reportStartAfter: reportDesign.reportStartAfter
  });

  // Section 3: Test Setup
  const [testSetup, setTestSetup] = useState({
    spaceInTestHeader: reportDesign.spaceInTestHeader,
    printTestOnNewPage: reportDesign.printTestOnNewPage,
    columnHeaderFont: reportDesign.columnHeaderFont,
    columnHeaderFontSize: reportDesign.columnHeaderFontSize,
    header1: reportDesign.header1,
    header2: reportDesign.header2,
    header3: reportDesign.header3,
    header4: reportDesign.header4,
    colHeaderBold: reportDesign.colHeaderBold,
    colHeaderItalic: reportDesign.colHeaderItalic,
    colHeaderUnderline: reportDesign.colHeaderUnderline,
    colHeaderColor: reportDesign.colHeaderColor,
    showHeaderBeforeTest: reportDesign.showHeaderBeforeTest,
    testFont: reportDesign.testFont,
    testFontSize: reportDesign.testFontSize,
    testBold: reportDesign.testBold,
    paramFont: reportDesign.paramFont,
    paramFontSize: reportDesign.paramFontSize
  });

  // Section 4: Footer Setup
  const [footerSetup, setFooterSetup] = useState({
    showFooterOnReport: reportDesign.showFooterOnReport,
    showFooterForMobile: reportDesign.showFooterForMobile,
    signatureFont: reportDesign.signatureFont,
    signatureFontSize: reportDesign.signatureFontSize,
    doctorName: reportDesign.doctorName || 'Dr. Pallavi Gedam',
    doctorDegree: reportDesign.doctorDegree || 'MBBS, MD Pathology',
    doctorSignatureText: reportDesign.doctorSignatureText || 'Dr. Pallavi Gedam\nMBBS, MD Pathology\nConsultant Pathologist',
    signatureImage: reportDesign.signatureImage || null,
    showReportFooterText: reportDesign.showReportFooterText,
    reportFooterText: reportDesign.reportFooterText,
    footerFromBottom: reportDesign.footerFromBottom
  });

  // Bill-Receipt Design State (eLabAssist Matching Layout)
  const [billSetup, setBillSetup] = useState({
    showBillHeader: reportDesign.showBillHeader ?? true,
    billHeaderType: reportDesign.billHeaderType || 'type1',
    billLabName: reportDesign.billLabName || reportDesign.labName || 'Gondiya Care',
    billLabAddress: reportDesign.billLabAddress || reportDesign.labAddress || 'Pathology Lab Address',
    billDoctorName: reportDesign.billDoctorName || reportDesign.doctorName || 'Dr. Pallavi Gedam',
    billLogoImage: reportDesign.billLogoImage || null,
    billHeaderImage: reportDesign.billHeaderImage || null
  });

  const handleBillLogoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBillSetup(prev => ({ ...prev, billLogoImage: reader.result }));
        addNotification('Logo Uploaded', 'Laboratory logo for Bill-Receipt uploaded successfully.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBillHeaderImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBillSetup(prev => ({ ...prev, billHeaderImage: reader.result }));
        addNotification('Header Image Uploaded', 'Bill-Receipt header image uploaded successfully.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBillDesign = () => {
    updateReportDesign(billSetup);
    addNotification('Bill Design Saved', 'Bill-Receipt Header configuration successfully saved.', 'success');
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        addNotification('File Too Large', 'Please select a signature image under 3MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFooterSetup(prev => ({
          ...prev,
          signatureImage: reader.result
        }));
        addNotification('Signature Uploaded', 'Doctor signature image uploaded successfully.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Keep live sync with LabContext reportDesign
  const handleSaveAll = () => {
    const combinedSettings = {
      ...headerSetup,
      ...mainReportSetup,
      ...testSetup,
      ...footerSetup
    };
    updateReportDesign(combinedSettings);
    addNotification('Report Design Applied', `Report design settings successfully applied to all diagnostic reports.`, 'success');
  };

  const handleEditConfig = (item) => {
    setSelectedConfigId(item.id);
    setMainReportSetup(prev => ({ ...prev, configName: item.name, reportType: item.type }));
    addNotification('Configuration Loaded', `Loaded "${item.name}". Click Save to apply to reports.`, 'info');
  };

  const handleRemoveConfig = (id) => {
    setConfigurations(configurations.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-200">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900">Report Designer (ReportDesigner.aspx)</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                Live Dynamic Sync
              </span>
            </div>
            <p className="text-xs text-slate-500">Every design change saved here instantly styles the patient PDF diagnostic reports</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              handleSaveAll();
              setActiveTab('reports');
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all"
          >
            <Eye className="h-4 w-4" />
            <span>Save & View Live Report</span>
          </button>
          <button
            onClick={handleSaveAll}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Top Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveMainTab('report')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 ${
            activeMainTab === 'report'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Report Design</span>
        </button>

        <button
          onClick={() => setActiveMainTab('bill')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 ${
            activeMainTab === 'bill'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Bill-Receipt Design</span>
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      {activeMainTab === 'bill' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
          <fieldset className="border border-slate-300 rounded-xl p-6 space-y-6 bg-slate-50/50">
            <legend className="px-3 font-bold text-xs text-slate-800 bg-white border border-slate-300 rounded-lg py-1 shadow-sm">
              Bill-Receipt Design
            </legend>

            {/* Show Header On Bill-Receipt Checkbox */}
            <label className="flex items-center space-x-2 font-bold text-xs text-slate-900 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <input
                type="checkbox"
                checked={billSetup.showBillHeader}
                onChange={(e) => setBillSetup({ ...billSetup, showBillHeader: e.target.checked })}
                className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
              />
              <span>Show Header On Bill-Receipt</span>
            </label>

            {/* Header Type 1 Option */}
            <div className={`border rounded-xl p-5 bg-white space-y-4 transition-all shadow-sm ${billSetup.billHeaderType === 'type1' ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200'}`}>
              <label className="flex items-center space-x-2 font-bold text-xs text-slate-900 cursor-pointer">
                <input
                  type="radio"
                  name="headerTypeRadio"
                  checked={billSetup.billHeaderType === 'type1'}
                  onChange={() => setBillSetup({ ...billSetup, billHeaderType: 'type1' })}
                  className="text-sky-600 focus:ring-sky-500"
                />
                <span>Header Type 1: Bill Receipt Header With Custom Details</span>
              </label>

              {billSetup.billHeaderType === 'type1' && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-2">
                    Bill Receipt Header With Custom Details
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1">
                    {/* Left Logo Upload Box */}
                    <div className="md:col-span-4 border border-slate-200 rounded-xl p-4 bg-white flex flex-col items-center justify-between space-y-3 shadow-sm">
                      <div className="h-28 w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
                        {billSetup.billLogoImage ? (
                          <img src={billSetup.billLogoImage} alt="Logo" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Pathology Lab Logo</span>
                        )}
                      </div>

                      <div className="w-full space-y-2">
                        <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 cursor-pointer text-center block transition-colors">
                          <span>Choose File</span>
                          <input type="file" accept="image/*" onChange={handleBillLogoUpload} className="hidden" />
                        </label>

                        <button
                          type="button"
                          onClick={() => addNotification('Upload Logo', 'Select your laboratory logo using Choose File.', 'info')}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-sm w-full transition-colors"
                        >
                          Upload Laboratory Logo
                        </button>
                      </div>
                    </div>

                    {/* Right Input Fields */}
                    <div className="md:col-span-8 space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Pathology Lab Name</label>
                        <input
                          type="text"
                          placeholder="Pathology Lab Name"
                          value={billSetup.billLabName}
                          onChange={(e) => setBillSetup({ ...billSetup, billLabName: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Pathology Lab Address</label>
                        <input
                          type="text"
                          placeholder="Pathology Lab Address"
                          value={billSetup.billLabAddress}
                          onChange={(e) => setBillSetup({ ...billSetup, billLabAddress: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-xs text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Doctor Name</label>
                        <input
                          type="text"
                          placeholder="Doctor Name"
                          value={billSetup.billDoctorName}
                          onChange={(e) => setBillSetup({ ...billSetup, billDoctorName: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-xs text-slate-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Header Type 2 Option */}
            <div className={`border rounded-xl p-5 bg-white space-y-4 transition-all shadow-sm ${billSetup.billHeaderType === 'type2' ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200'}`}>
              <label className="flex items-center space-x-2 font-bold text-xs text-slate-900 cursor-pointer">
                <input
                  type="radio"
                  name="headerTypeRadio"
                  checked={billSetup.billHeaderType === 'type2'}
                  onChange={() => setBillSetup({ ...billSetup, billHeaderType: 'type2' })}
                  className="text-sky-600 focus:ring-sky-500"
                />
                <span>Header Type 2: Bill-Receipt Header With Image</span>
              </label>

              {billSetup.billHeaderType === 'type2' && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-2">
                    Bill-Receipt Header With Image
                  </h4>

                  <div className="h-36 w-full bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center p-3 relative overflow-hidden shadow-inner">
                    {billSetup.billHeaderImage ? (
                      <img src={billSetup.billHeaderImage} alt="Header Banner" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Bill-Receipt Header With Image</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer transition-colors">
                      <span>Choose File</span>
                      <input type="file" accept="image/*" onChange={handleBillHeaderImageUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => addNotification('Upload Header Image', 'Select an image file using Choose File.', 'info')}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                    >
                      Upload Header Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={handleSaveBillDesign}
                className="px-10 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Save
              </button>
            </div>
          </fieldset>
        </div>
      ) : (
        /* MAIN ACCORDIONS */
        <div className="space-y-4">
        
        {/* ================= ACCORDION 1: REPORT CONFIGURATION GRID ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('grid')}
            className="w-full p-4 bg-slate-100/80 hover:bg-slate-100 transition-colors flex items-center justify-between font-bold text-xs text-slate-800"
          >
            <div className="flex items-center space-x-2">
              <Layout className="h-4 w-4 text-sky-600" />
              <span>REPORT CONFIGURATION GRID ({configurations.length} Pre-loaded Configurations)</span>
            </div>
            {openSections.grid ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.grid && (
            <div className="p-5 border-t border-slate-200 space-y-3 animate-in fade-in duration-150">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Configuration Name</th>
                      <th className="px-4 py-2.5">Report Type</th>
                      <th className="px-4 py-2.5 text-center w-20">Edit</th>
                      <th className="px-4 py-2.5 text-center w-24">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {configurations.map(item => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          selectedConfigId === item.id ? 'bg-sky-50/70 font-semibold' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 text-slate-900">{item.name}</td>
                        <td className="px-4 py-2.5 text-slate-600">{item.type}</td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => handleEditConfig(item)}
                            className="text-sky-600 hover:text-sky-800 font-bold text-xs"
                          >
                            Edit
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => handleRemoveConfig(item.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold text-xs"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ================= ACCORDION 2: REPORT HEADER SETUP ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('header')}
            className="w-full p-4 bg-slate-100/80 hover:bg-slate-100 transition-colors flex items-center justify-between font-bold text-xs text-slate-800"
          >
            <div className="flex items-center space-x-2">
              <Type className="h-4 w-4 text-indigo-600" />
              <span>REPORT HEADER SETUP</span>
            </div>
            {openSections.header ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.header && (
            <div className="p-5 border-t border-slate-200 space-y-5 animate-in fade-in duration-150 text-xs">
              
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={headerSetup.showHeaderOnReport}
                    onChange={(e) => setHeaderSetup({ ...headerSetup, showHeaderOnReport: e.target.checked })}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>Show Header On Report</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={headerSetup.showHeaderForMobile}
                    onChange={(e) => setHeaderSetup({ ...headerSetup, showHeaderForMobile: e.target.checked })}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>Show Header On Report For Mobile</span>
                </label>
              </div>

              {/* Header Type 1: Custom Details */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-900">
                  <input
                    type="radio"
                    name="headerType"
                    checked={headerSetup.headerType === 'type1'}
                    onChange={() => setHeaderSetup({ ...headerSetup, headerType: 'type1' })}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span>Header Type 1: Report Header With Custom Details</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                  <div className="md:col-span-3 border border-slate-300 rounded-xl p-4 bg-white flex flex-col items-center justify-center text-center space-y-2">
                    <div className="h-16 w-24 bg-slate-100 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-mono">
                      Lab Logo
                    </div>
                    <label className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] cursor-pointer border border-slate-300">
                      Choose File
                      <input type="file" className="hidden" accept="image/*" />
                    </label>
                  </div>

                  <div className="md:col-span-9 space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Pathology Lab Name</label>
                      <input
                        type="text"
                        value={headerSetup.labName}
                        onChange={(e) => setHeaderSetup({ ...headerSetup, labName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Pathology Lab Address</label>
                      <input
                        type="text"
                        value={headerSetup.labAddress}
                        onChange={(e) => setHeaderSetup({ ...headerSetup, labAddress: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Doctor Name / Credentials</label>
                      <input
                        type="text"
                        value={headerSetup.doctorName}
                        onChange={(e) => setHeaderSetup({ ...headerSetup, doctorName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Type 2: Full Image */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-900">
                  <input
                    type="radio"
                    name="headerType"
                    checked={headerSetup.headerType === 'type2'}
                    onChange={() => setHeaderSetup({ ...headerSetup, headerType: 'type2' })}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span>Header Type 2: Report Header With Image (Full Banner)</span>
                </label>
              </div>

            </div>
          )}
        </div>

        {/* ================= ACCORDION 3: MAIN REPORT (Patient Details) ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('mainReport')}
            className="w-full p-4 bg-slate-100/80 hover:bg-slate-100 transition-colors flex items-center justify-between font-bold text-xs text-slate-800"
          >
            <div className="flex items-center space-x-2">
              <Columns className="h-4 w-4 text-emerald-600" />
              <span>MAIN REPORT (Patient Details)</span>
            </div>
            {openSections.mainReport ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.mainReport && (
            <div className="p-5 border-t border-slate-200 space-y-4 animate-in fade-in duration-150 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-12 items-center gap-2">
                    <span className="col-span-4 font-semibold text-slate-700">Configuration Name</span>
                    <input
                      type="text"
                      value={mainReportSetup.configName}
                      onChange={(e) => setMainReportSetup({ ...mainReportSetup, configName: e.target.value })}
                      className="col-span-8 bg-white border border-slate-300 rounded-lg p-2 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-12 items-center gap-2">
                    <span className="col-span-4 font-semibold text-slate-700">Select Font Name</span>
                    <select
                      value={mainReportSetup.fontName}
                      onChange={(e) => setMainReportSetup({ ...mainReportSetup, fontName: e.target.value })}
                      className="col-span-8 bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    >
                      <option>Arial</option>
                      <option>Times New Roman</option>
                      <option>Calibri</option>
                      <option>Segoe UI</option>
                      <option>Inter</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-2">
                    <span className="col-span-4 font-semibold text-slate-700">Report Start After</span>
                    <select
                      value={mainReportSetup.reportStartAfter}
                      onChange={(e) => setMainReportSetup({ ...mainReportSetup, reportStartAfter: e.target.value })}
                      className="col-span-8 bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    >
                      <option>0 Inch</option>
                      <option>0.5 Inch</option>
                      <option>1.0 Inch</option>
                      <option>1.5 Inch</option>
                      <option>2.0 Inch (Pre-Printed Margin)</option>
                      <option>2.5 Inch</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-12 items-center gap-2">
                    <span className="col-span-4 font-semibold text-slate-700">Report Type</span>
                    <select
                      value={mainReportSetup.reportType}
                      onChange={(e) => setMainReportSetup({ ...mainReportSetup, reportType: e.target.value })}
                      className="col-span-8 bg-white border border-slate-300 rounded-lg p-2 font-bold"
                    >
                      <option>Four Column Report</option>
                      <option>Two Column Report</option>
                      <option>Three Column Report</option>
                      <option>Graph</option>
                      <option>Template Based Html Report</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-2">
                    <span className="col-span-4 font-semibold text-slate-700">Font Size</span>
                    <select
                      value={mainReportSetup.fontSize}
                      onChange={(e) => setMainReportSetup({ ...mainReportSetup, fontSize: e.target.value })}
                      className="col-span-8 bg-white border border-slate-300 rounded-lg p-2 font-mono"
                    >
                      {['7', '8', '9', '10', '11', '12', '14'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= ACCORDION 4: TEST SETUP ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('testSetup')}
            className="w-full p-4 bg-slate-100/80 hover:bg-slate-100 transition-colors flex items-center justify-between font-bold text-xs text-slate-800"
          >
            <div className="flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-amber-600" />
              <span>TEST SETUP (Column Headers, Fonts & Pagination)</span>
            </div>
            {openSections.testSetup ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.testSetup && (
            <div className="p-5 border-t border-slate-200 space-y-5 animate-in fade-in duration-150 text-xs">
              
              <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-slate-700">Space in Test and Report header</span>
                  <select
                    value={testSetup.spaceInTestHeader}
                    onChange={(e) => setTestSetup({ ...testSetup, spaceInTestHeader: e.target.value })}
                    className="bg-white border border-slate-300 rounded-lg p-1.5 font-medium"
                  >
                    <option>10px</option>
                    <option>20px</option>
                    <option>30px</option>
                    <option>1 Line</option>
                    <option>2 Lines</option>
                  </select>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-900 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200">
                  <input
                    type="checkbox"
                    checked={testSetup.printTestOnNewPage}
                    onChange={(e) => setTestSetup({ ...testSetup, printTestOnNewPage: e.target.checked })}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>Print test on new page (1 Test Per Page Standard)</span>
                </label>
              </div>

              {/* Column Header Setup */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Column Header Setup
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Header1</span>
                    <input
                      type="text"
                      value={testSetup.header1}
                      onChange={(e) => setTestSetup({ ...testSetup, header1: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Header2</span>
                    <input
                      type="text"
                      value={testSetup.header2}
                      onChange={(e) => setTestSetup({ ...testSetup, header2: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Header3</span>
                    <input
                      type="text"
                      value={testSetup.header3}
                      onChange={(e) => setTestSetup({ ...testSetup, header3: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Header4</span>
                    <input
                      type="text"
                      value={testSetup.header4}
                      onChange={(e) => setTestSetup({ ...testSetup, header4: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input type="checkbox" checked={testSetup.colHeaderBold} onChange={(e) => setTestSetup({ ...testSetup, colHeaderBold: e.target.checked })} />
                    <span>Bold</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input type="checkbox" checked={testSetup.colHeaderItalic} onChange={(e) => setTestSetup({ ...testSetup, colHeaderItalic: e.target.checked })} />
                    <span>Italic</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input type="checkbox" checked={testSetup.colHeaderUnderline} onChange={(e) => setTestSetup({ ...testSetup, colHeaderUnderline: e.target.checked })} />
                    <span>Underline</span>
                  </label>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ================= ACCORDION 5: REPORT FOOTER SETUP ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('footer')}
            className="w-full p-4 bg-slate-100/80 hover:bg-slate-100 transition-colors flex items-center justify-between font-bold text-xs text-slate-800"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
              <span>REPORT FOOTER SETUP (Signatures & Disclaimers)</span>
            </div>
            {openSections.footer ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.footer && (
            <div className="p-5 border-t border-slate-200 space-y-5 animate-in fade-in duration-150 text-xs">
              
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-4">
                
                {/* Doctor Name & Degree Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Doctor Name (Chief Pathologist)</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Pallavi Gedam"
                      value={footerSetup.doctorName}
                      onChange={(e) => setFooterSetup({ ...footerSetup, doctorName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Qualifications & Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. MBBS, MD Pathology"
                      value={footerSetup.doctorDegree}
                      onChange={(e) => setFooterSetup({ ...footerSetup, doctorDegree: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                {/* Upload Doctor Signature Image Section */}
                <div className="p-3.5 bg-white border border-purple-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-purple-900">Upload Doctor Digital Signature Image</h4>
                      <p className="text-[11px] text-slate-500">Upload signature stamp (.PNG, .JPG, transparent background recommended)</p>
                    </div>
                    {footerSetup.signatureImage && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                        ✓ Signature Image Active
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Live Preview Box */}
                    <div className="h-20 w-44 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center p-2 relative overflow-hidden group shadow-inner">
                      {footerSetup.signatureImage ? (
                        <img
                          src={footerSetup.signatureImage}
                          alt="Doctor Signature Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-slate-400">
                          <Upload className="h-5 w-5 mx-auto mb-1 text-slate-400" />
                          <span className="text-[10px] font-semibold">No Signature Uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 flex-1 w-full">
                      <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer inline-flex items-center space-x-2 transition-all">
                        <Upload className="h-4 w-4" />
                        <span>Upload Signature Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="hidden"
                        />
                      </label>

                      {footerSetup.signatureImage && (
                        <button
                          type="button"
                          onClick={() => setFooterSetup({ ...footerSetup, signatureImage: null })}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 ml-2 inline-flex items-center space-x-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove Signature Image</span>
                        </button>
                      )}
                      
                      <p className="text-[10px] text-slate-400 font-mono">Max size: 3MB. Recommended resolution: 300x120px</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Signature Block Text (Multi-Line)</label>
                  <textarea
                    rows={2}
                    value={footerSetup.doctorSignatureText}
                    onChange={(e) => setFooterSetup({ ...footerSetup, doctorSignatureText: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-xs"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={footerSetup.showReportFooterText}
                      onChange={(e) => setFooterSetup({ ...footerSetup, showReportFooterText: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <span>Show Report Footer Text</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Report Footer Text"
                    value={footerSetup.reportFooterText}
                    onChange={(e) => setFooterSetup({ ...footerSetup, reportFooterText: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save & Apply Design
                </button>
                <button
                  type="button"
                  onClick={() => addNotification('Cancelled', 'Changes discarded.', 'info')}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300"
                >
                  Cancel
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
      )}

    </div>
  );
};
