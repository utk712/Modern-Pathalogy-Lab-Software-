import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  UserCheck,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  Search,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import { useLab } from '../../context/LabContext';

export const DoctorCommissionLedgerTab = () => {
  const { addNotification } = useLab();
  const [commissions, setCommissions] = useState([]);
  const [summary, setSummary] = useState({
    count: 0,
    totalGross: 0,
    totalCommission: 0,
    pendingCommission: 0,
    settledCommission: 0
  });
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedDoctor, setSelectedDoctor] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // New Doctor Modal
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpec, setNewDocSpec] = useState('');
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocPct, setNewDocPct] = useState('15');

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDoctor !== 'ALL') params.set('doctorName', selectedDoctor);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);

      const res = await fetch(`/api/commissions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCommissions(data.rows || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.warn('Failed to fetch doctor commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const data = await res.json();
        setDoctorsList(data.doctors || []);
      }
    } catch (err) {
      console.warn('Failed to fetch doctors list:', err);
    }
  };

  useEffect(() => {
    fetchCommissions();
    fetchDoctors();
  }, [selectedDoctor, selectedStatus, fromDate, toDate]);

  const handleSelectAllPending = () => {
    const pendingIds = commissions.filter(c => c.settlement_status === 'PENDING').map(c => c.id);
    if (selectedIds.length === pendingIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSettleSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/commissions/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionIds: selectedIds })
      });
      if (res.ok) {
        const data = await res.json();
        addNotification('Commissions Settled', `Marked ${data.settledCount} commission payout records as settled.`, 'success');
        setSelectedIds([]);
        fetchCommissions();
      }
    } catch (err) {
      alert('Error settling commissions: ' + err.message);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDocName.trim(),
          specialization: newDocSpec.trim(),
          phone: newDocPhone.trim(),
          email: newDocEmail.trim(),
          defaultCommissionPct: parseFloat(newDocPct) || 15
        })
      });
      if (res.ok) {
        addNotification('Doctor Registered', `${newDocName} added with ${newDocPct}% commission rate.`, 'success');
        setShowAddDocModal(false);
        setNewDocName('');
        setNewDocSpec('');
        setNewDocPhone('');
        setNewDocEmail('');
        fetchDoctors();
      }
    } catch (err) {
      alert('Error creating doctor record: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    if (commissions.length === 0) {
      alert('No commission records to export.');
      return;
    }

    const headers = ['ID', 'Date', 'Referring Doctor', 'Patient Name', 'UHID', 'Gross Bill (INR)', 'Commission %', 'Payout Amount (INR)', 'Status', 'Settled At'];
    const rows = commissions.map(c => [
      c.id,
      c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
      `"${c.doctor_name}"`,
      `"${c.patient_name}"`,
      c.uhid || '',
      c.gross_amount,
      c.commission_pct,
      c.commission_amount,
      c.settlement_status,
      c.settled_at ? new Date(c.settled_at).toLocaleDateString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Doctor_Commission_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-emerald-400" />
            <h2 className="text-xl font-bold">Referring Doctor Commission Ledger</h2>
          </div>
          <p className="text-xs text-emerald-200 mt-1">
            Automated NABL B2B accounting module tracking clinician referrals, percentage incentives, and monthly settlement payouts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddDocModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Referring Doctor</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs border border-white/20 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export Statement (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Total Billed Referrals</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">₹{summary.totalGross.toLocaleString()}</h3>
            <span className="text-[10px] text-slate-400 font-mono">{summary.count} Referred Tests</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Total Calculated Commission</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">₹{summary.totalCommission.toLocaleString()}</h3>
            <span className="text-[10px] text-emerald-600 font-bold">Earned Payouts</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between bg-amber-50/20">
          <div>
            <p className="text-[11px] font-bold text-amber-800 uppercase">Pending Doctor Payouts</p>
            <h3 className="text-xl font-black text-amber-700 mt-0.5">₹{summary.pendingCommission.toLocaleString()}</h3>
            <span className="text-[10px] text-amber-600 font-mono">Awaiting Settlement</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between bg-emerald-50/20">
          <div>
            <p className="text-[11px] font-bold text-emerald-800 uppercase">Settled Commission Paid</p>
            <h3 className="text-xl font-black text-emerald-700 mt-0.5">₹{summary.settledCommission.toLocaleString()}</h3>
            <span className="text-[10px] text-emerald-600 font-mono">Disbursed to Doctors</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar & Batch Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-700">Referring Doctor:</span>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-medium"
            >
              <option value="ALL">All Doctors ({doctorsList.length})</option>
              {doctorsList.map(d => (
                <option key={d.id} value={d.name}>{d.name} ({d.default_commission_pct}%)</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-700">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Only</option>
              <option value="SETTLED">Settled Only</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-700">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-700">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono"
            />
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">
              Selected: <strong className="text-emerald-700">{selectedIds.length}</strong>
            </span>
            <button
              onClick={handleSettleSelected}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Mark Selected as Settled</span>
            </button>
          </div>
        )}
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={handleSelectAllPending} className="text-slate-600 hover:text-slate-900">
                    {selectedIds.length > 0 && selectedIds.length === commissions.filter(c => c.settlement_status === 'PENDING').length ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="p-3">Date</th>
                <th className="p-3">Referring Doctor</th>
                <th className="p-3">Patient & UHID</th>
                <th className="p-3 text-right">Gross Bill</th>
                <th className="p-3 text-center">Commission %</th>
                <th className="p-3 text-right">Payout Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Settled Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    {loading ? 'Loading commission records...' : 'No doctor referral commission records found matching the active filters.'}
                  </td>
                </tr>
              ) : (
                commissions.map(row => {
                  const isPending = row.settlement_status === 'PENDING';
                  const isSelected = selectedIds.includes(row.id);
                  return (
                    <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                      <td className="p-3 text-center">
                        {isPending ? (
                          <button onClick={() => handleToggleSelect(row.id)}>
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400 hover:text-slate-700" />
                            )}
                          </button>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {row.doctor_name}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">{row.patient_name}</span>
                        <span className="font-mono text-[10px] text-slate-400">{row.uhid || row.patient_id}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        ₹{row.gross_amount.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700">
                          {row.commission_pct}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-emerald-700 text-[13px]">
                        ₹{row.commission_amount.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        {isPending ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 font-mono">
                            PENDING
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                            SETTLED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-[11px] text-slate-500">
                        {row.settled_at ? new Date(row.settled_at).toLocaleDateString('en-GB') : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Referring Doctor Modal */}
      {showAddDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span>Register New Referring Doctor</span>
              </h3>
              <button onClick={() => setShowAddDocModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Gupta (MD)"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Specialization / Department</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology, General Medicine, Pediatrics"
                  value={newDocSpec}
                  onChange={(e) => setNewDocSpec(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="98XXXXXXXX"
                    value={newDocPhone}
                    onChange={(e) => setNewDocPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Commission % *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    required
                    value={newDocPct}
                    onChange={(e) => setNewDocPct(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="doctor@clinic.com"
                  value={newDocEmail}
                  onChange={(e) => setNewDocEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
