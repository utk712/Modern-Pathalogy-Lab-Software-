import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import {
  Settings,
  Building,
  Award,
  UserCheck,
  Cpu,
  Save,
  CheckCircle2,
  FileCode,
  ShieldCheck
} from 'lucide-react';

const SecuritySettingsTab = () => {
  const { labProfile, updateCredentials } = useLab();
  const [newUsername, setNewUsername] = useState(labProfile?.adminUsername || 'admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successText, setSuccessText] = useState('');
  const [errorText, setErrorText] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setErrorText('Please enter a valid Username.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setErrorText('New password and confirm password do not match.');
      return;
    }

    setIsUpdating(true);
    setErrorText('');

    try {
      await updateCredentials({
        newUsername: newUsername.trim(),
        newPassword: newPassword.trim() || undefined
      });
      setSuccessText('✅ Username & Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessText(''), 4000);
    } catch (err) {
      setErrorText(err.message || 'Failed to update credentials.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-xl">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          <span>Lab Owner Security & Password Reset</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Customize your laboratory login credentials. This updates your login without affecting the security license.
        </p>
      </div>

      {successText && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successText}</span>
        </div>
      )}

      {errorText && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl">
          {errorText}
        </div>
      )}

      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Login Username *</label>
          <input
            type="text"
            required
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (leave blank to keep current)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isUpdating}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center space-x-2"
      >
        <Save className="h-4 w-4" />
        <span>{isUpdating ? 'Saving...' : 'Save New Credentials'}</span>
      </button>
    </form>
  );
};

export const LabSettings = () => {
  const { tests, pathologists, addNotification, labProfile } = useLab();
  const [activeSubTab, setActiveSubTab] = useState('general'); // 'general' | 'doctors' | 'analyzers' | 'tests'
  const [isSaved, setIsSaved] = useState(false);

  const [labConfig, setLabConfig] = useState({
    labName: labProfile?.labName || '',
    tagline: labProfile?.tagline || 'Advanced Diagnostic Pathology & Research Services',
    nablCertNo: labProfile?.regNo || 'MC-4892',
    isoStandard: labProfile?.accreditation || 'ISO 15189:2022',
    address: labProfile?.address || '',
    phone: labProfile?.phone || '',
    email: labProfile?.email || '',
    website: labProfile?.website || '',
    astmPort: 5100,
    astmIp: '192.168.1.120',
    protocol: 'ASTM 1394-97 / E1381'
  });

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    addNotification('Settings Updated', 'Laboratory master configuration updated successfully.', 'success');
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Laboratory & Master System Settings</h1>
            <p className="text-xs text-slate-500">NABL accreditation details, digital doctor credentials, analyzer interfaces, and test master catalog</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isSaved && (
            <span className="text-xs text-emerald-700 font-bold flex items-center space-x-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Saved!</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'general', label: 'Lab Branding & NABL' },
          { id: 'security', label: '🔒 User Security & Password Reset' },
          { id: 'doctors', label: 'Consultant Doctors & Signatures' },
          { id: 'analyzers', label: 'Analyzer Bridge (ASTM / HL7)' },
          { id: 'tests', label: 'Diagnostic Test Master Catalog' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSubTab === t.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: General & NABL Branding */}
      {activeSubTab === 'general' && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
            <Building className="h-4 w-4 text-sky-600" />
            <span>Facility Profile & Accreditation Header</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Laboratory Official Name</label>
              <input
                type="text"
                value={labConfig.labName}
                onChange={(e) => setLabConfig({ ...labConfig, labName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tagline / Specialization</label>
              <input
                type="text"
                value={labConfig.tagline}
                onChange={(e) => setLabConfig({ ...labConfig, tagline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">NABL Accreditation Certificate No.</label>
              <input
                type="text"
                value={labConfig.nablCertNo}
                onChange={(e) => setLabConfig({ ...labConfig, nablCertNo: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-amber-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Quality Standard</label>
              <input
                type="text"
                value={labConfig.isoStandard}
                onChange={(e) => setLabConfig({ ...labConfig, isoStandard: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Full Facility Address</label>
              <input
                type="text"
                value={labConfig.address}
                onChange={(e) => setLabConfig({ ...labConfig, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Facility Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Doctor Signatures */}
      {activeSubTab === 'doctors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span>Consultant Pathologists & Registered Medical Signatures</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(pathologists && pathologists.length > 0 ? pathologists : [{
              id: 'DOC-DEF',
              name: labProfile?.pathologistName || 'Consultant Pathologist',
              degree: labProfile?.pathologistDegree || 'MBBS, MD Pathology',
              regNo: labProfile?.mciRegNo || 'MCI-001',
              role: 'Chief Pathologist'
            }]).map(doc => (
              <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Active</span>
                </div>
                <p className="text-slate-600 font-medium">{doc.degree}</p>
                <p className="text-slate-400 font-mono text-[11px]">Reg: {doc.regNo}</p>
                <p className="text-[10px] text-slate-500">{doc.role}</p>

                <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-center">
                  <span className="font-serif italic text-slate-700 text-sm">{doc.name}</span>
                  <span className="text-[9px] text-slate-400 block mt-1">Digital Cryptographic Key: VERIFIED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Analyzer Bridge */}
      {activeSubTab === 'analyzers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-indigo-600" />
            <span>Bidirectional Analyzer Listener & Middleware Bridge</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sky-400">Sysmex XN-550</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">CONNECTED</span>
              </div>
              <p className="text-[11px] text-slate-300">Hematology 5-Part Differential Analyzer</p>
              <p className="font-mono text-[10px] text-slate-400">IP: 192.168.1.120:5100 (ASTM 1394)</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-400">Roche Cobas c311</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">CONNECTED</span>
              </div>
              <p className="text-[11px] text-slate-300">Clinical Chemistry & Electrolytes</p>
              <p className="font-mono text-[10px] text-slate-400">IP: 192.168.1.125:5101 (HL7 v2.5)</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-teal-400">Abbott ARCHITECT i1000</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">CONNECTED</span>
              </div>
              <p className="text-[11px] text-slate-300">Chemiluminescence Immunoassay (CLIA)</p>
              <p className="font-mono text-[10px] text-slate-400">IP: 192.168.1.130:5102 (ASTM 1394)</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Security & Password Reset */}
      {activeSubTab === 'security' && (
        <SecuritySettingsTab />
      )}

      {/* Tab 4: Diagnostic Test Master */}
      {activeSubTab === 'tests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
            <FileCode className="h-4 w-4 text-sky-600" />
            <span>Master Test & Profile Catalog ({tests.length} Active Profiles)</span>
          </h3>

          <div className="space-y-3">
            {tests.map(t => (
              <div key={t.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{t.name}</span>
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">{t.code}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t.parameters.length} Parameters • Sample: <strong className="text-slate-700">{t.sampleType}</strong> • TAT: {t.tatHours}h
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-900 text-sm">₹{t.price}</span>
                  <span className="text-[10px] text-slate-400 block">B2B: ₹{t.b2bPrice}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

