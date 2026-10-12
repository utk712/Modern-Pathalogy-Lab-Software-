import React, { useState, useEffect } from 'react';
import { generateLicenseKey, normalizeLabName } from '../../utils/licenseCrypto';
import { Key, Building2, Calendar, ShieldCheck, Copy, Check, Trash2, Plus, Sparkles, X, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';

const STORAGE_KEY = 'pulselab_vendor_client_accounts';

export const VendorLicensePortalModal = ({ isOpen, onClose }) => {
  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passError, setPassError] = useState('');

  const [labs, setLabs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'LAB-001',
        name: 'Modern Diagnostic Pathology Lab',
        doctorName: 'Dr. Rajesh Sharma',
        phone: '9876543210',
        city: 'Mumbai Central',
        currentKey: 'LIMS-180D-MODERN-6B76CD80-0FD1-1785-F5B6',
        validityDays: 180,
        expiryTimestamp: Date.now() + 180 * 24 * 60 * 60 * 1000,
        formattedExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      }
    ];
  });

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabName, setNewLabName] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newDuration, setNewDuration] = useState(180);
  const [copiedId, setCopiedId] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(labs));
  }, [labs]);

  if (!isOpen) return null;

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passcode === 'master@vendor2026') {
      setIsUnlocked(true);
      setPassError('');
    } else {
      setPassError('Invalid Vendor Master Passcode. Access denied.');
    }
  };

  const handleCreateLab = (e) => {
    e.preventDefault();
    if (!newLabName.trim()) return;

    const generated = generateLicenseKey(newLabName.trim(), Number(newDuration));
    const newAccount = {
      id: `LAB-${String(labs.length + 1).padStart(3, '0')}`,
      name: newLabName.trim(),
      doctorName: newDoctor.trim(),
      phone: newPhone.trim(),
      city: newCity.trim(),
      currentKey: generated.licenseKey,
      validityDays: Number(newDuration),
      expiryTimestamp: generated.expiryTimestamp,
      formattedExpiry: generated.formattedExpiry
    };

    setLabs([newAccount, ...labs]);
    setShowAddForm(false);
    setNewLabName('');
    setNewDoctor('');
    setNewPhone('');
    setNewCity('');
    showToast(`✅ Registered ${newAccount.name} with 6-Month Key!`);
  };

  const handleRenew = (labId) => {
    const lab = labs.find(l => l.id === labId);
    if (!lab) return;

    const generated = generateLicenseKey(lab.name, 180);
    setLabs(labs.map(l => l.id === labId ? {
      ...l,
      currentKey: generated.licenseKey,
      expiryTimestamp: generated.expiryTimestamp,
      formattedExpiry: generated.formattedExpiry,
      validityDays: 180
    } : l));

    navigator.clipboard.writeText(generated.licenseKey);
    showToast(`⚡ Renewed 6 Months for ${lab.name}! Key copied to clipboard.`);
  };

  const handleCopyWhatsApp = (lab) => {
    const msg = `*Modern Diagnostic LIMS - Security License Key*\n\n` +
                `🏥 *Laboratory:* ${lab.name}\n` +
                `👨‍⚕️ *Contact:* ${lab.doctorName || 'Doctor'}\n` +
                `🔑 *Security Key:* \`${lab.currentKey}\`\n` +
                `⏱️ *Valid Until:* ${lab.formattedExpiry}\n\n` +
                `*Instructions:*\n` +
                `1. Open Modern Diagnostic LIMS on your PC.\n` +
                `2. Enter your Lab Name and paste the Security Key above.\n` +
                `3. Click "Activate Software".`;

    navigator.clipboard.writeText(msg);
    showToast(`💬 WhatsApp message copied for ${lab.name}!`);
  };

  const handleDelete = (labId) => {
    const lab = labs.find(l => l.id === labId);
    if (window.confirm(`Are you sure you want to permanently remove "${lab?.name}" from your accounts list?`)) {
      setLabs(labs.filter(l => l.id !== labId));
      showToast(`🗑️ Removed lab account.`);
    }
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const filteredLabs = labs.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.doctorName || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.phone || '').includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">Vendor Master License Portal</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800">
                  Private Keygen
                </span>
              </div>
              <p className="text-xs text-slate-400">Generate 6-month security keys and manage client accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {successToast && (
          <div className="p-3 bg-emerald-950/90 border border-emerald-800 rounded-xl text-xs text-emerald-300 font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
            <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Security Lock Screen if not unlocked */}
        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="max-w-sm mx-auto py-8 space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-800 text-sky-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">Vendor Security Verification</h4>
              <p className="text-xs text-slate-400">Enter Master Vendor Passcode to unlock the Key Generator</p>
            </div>

            <div className="space-y-2">
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setPassError(''); }}
                placeholder="Enter Master Passcode"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {passError && <p className="text-xs text-rose-400 font-semibold">{passError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-500/20 cursor-pointer"
            >
              Unlock Master Generator
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            
            {/* Top Bar Actions & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search labs by name, city, phone..."
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:w-72"
              />

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all client key history records from the Vendor Portal?')) {
                      setLabs([]);
                      localStorage.removeItem(STORAGE_KEY);
                      showToast('🗑️ Cleared vendor license key history.');
                    }
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="Clear all license key history records"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear History</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>{showAddForm ? 'Close Form' : 'Register New Client Lab'}</span>
                </button>
              </div>
            </div>

            {/* Form: Add New Lab */}
            {showAddForm && (
              <form onSubmit={handleCreateLab} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                  <Sparkles className="h-4 w-4 text-sky-400" />
                  <span className="font-bold text-white text-xs">New Client Registration & 6-Month Key Auto-Gen</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-semibold">Laboratory Name *</label>
                    <input
                      type="text"
                      required
                      value={newLabName}
                      onChange={(e) => setNewLabName(e.target.value)}
                      placeholder="e.g. Apex Diagnostic Center"
                      className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold">Doctor / Owner Name</label>
                    <input
                      type="text"
                      value={newDoctor}
                      onChange={(e) => setNewDoctor(e.target.value)}
                      placeholder="e.g. Dr. K. Sharma"
                      className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold">License Duration</label>
                    <select
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value={180}>⭐ 6 Months (180 Days)</option>
                      <option value={365}>📅 1 Year (365 Days)</option>
                      <option value={30}>⏱️ 1 Month Trial</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    ⚡ Generate 6-Month Key & Save
                  </button>
                </div>
              </form>
            )}

            {/* Client Accounts Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <th className="py-3 px-3">Lab Name & ID</th>
                    <th className="py-3 px-3">Contact Details</th>
                    <th className="py-3 px-3">Active Security Key</th>
                    <th className="py-3 px-3">Validity Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900">
                  {filteredLabs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No laboratory accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredLabs.map((lab) => {
                      const days = Math.ceil((lab.expiryTimestamp - Date.now()) / (1000 * 60 * 60 * 24));
                      const isExpired = days <= 0;

                      return (
                        <tr key={lab.id} className="hover:bg-slate-950/50 transition-colors">
                          <td className="py-3 px-3">
                            <p className="font-bold text-white">{lab.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">ID: {lab.id}</p>
                          </td>
                          <td className="py-3 px-3">
                            <p className="text-slate-300 font-medium">{lab.doctorName || 'Doctor'}</p>
                            <p className="text-[10px] text-slate-500">{lab.city || 'Location'} • {lab.phone || 'No phone'}</p>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-1.5">
                              <code className="font-mono text-[11px] font-bold text-sky-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 select-all">
                                {lab.currentKey}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(lab.currentKey);
                                  setCopiedId(lab.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="p-1 text-slate-400 hover:text-white"
                                title="Copy Key"
                              >
                                {copiedId === lab.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              isExpired ? 'bg-rose-950 text-rose-400 border-rose-800 animate-pulse' :
                              days <= 15 ? 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse' :
                              'bg-emerald-950 text-emerald-400 border-emerald-800'
                            }`}>
                              {isExpired ? 'Expired' : `${days} Days Left`}
                            </span>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{lab.formattedExpiry}</p>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleRenew(lab.id)}
                                className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-[11px] flex items-center space-x-1 cursor-pointer"
                                title="Renew 6 Months"
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span>Renew 6M</span>
                              </button>
                              <button
                                onClick={() => handleCopyWhatsApp(lab)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs cursor-pointer"
                                title="Copy WhatsApp message"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(lab.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg text-xs cursor-pointer"
                                title="Delete account"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
