import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import {
  Building2,
  Phone,
  MapPin,
  TrendingDown,
  CreditCard,
  PlusCircle,
  CheckCircle2,
  Search,
  FileSpreadsheet,
  ArrowUpRight
} from 'lucide-react';

export const B2BPortal = () => {
  const { b2bCenters, recordB2BPayment, patients } = useLab();
  const [search, setSearch] = useState('');
  const [paymentModalCenter, setPaymentModalCenter] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const filteredCenters = (b2bCenters || []).filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.code || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.owner || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!paymentModalCenter || !payAmount || Number(payAmount) <= 0) return;
    recordB2BPayment(paymentModalCenter.id, payAmount);
    setPaymentModalCenter(null);
    setPayAmount('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">B2B Franchise & Collection Center Hub</h1>
            <p className="text-xs text-slate-500">External clinic rate cards, sample dispatch manifests, credit ledgers, and automated settlement</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search franchise or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => {
              const name = prompt("Enter B2B Franchise / Collection Center Name:");
              if (!name) return;
              const owner = prompt("Enter Doctor / Contact Person Name:", "Dr. S. K. Sharma");
              const discountPct = prompt("Enter Discount Margin % (e.g. 25):", "25");
              if (name) {
                alert(`Franchise Center '${name}' registered successfully with ${discountPct || 25}% margin tariff!`);
              }
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Franchise</span>
          </button>
        </div>
      </div>

      {/* Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredCenters.map(center => {
          const centerPatients = patients.filter(p => p.b2bCenter === center.name);
          const totalVolume = centerPatients.length;
          const outstandingDue = Math.abs(center.ledgerBalance);

          return (
            <div
              key={center.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {center.code}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {center.discountPct}% Margin Rate Card
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3">{center.name}</h3>

                <div className="space-y-1 mt-2 text-xs text-slate-500">
                  <p className="flex items-center space-x-1.5">
                    <span className="font-medium text-slate-700">Contact:</span>
                    <span>{center.owner} ({center.phone})</span>
                  </p>
                  <p className="flex items-center space-x-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{center.address}</span>
                  </p>
                </div>

                {/* Ledger & Credit Box */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Ledger Balance (Due):</span>
                    <span className="font-black text-rose-600">₹{(outstandingDue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Credit Limit:</span>
                    <span className="font-semibold text-slate-800">₹{(center.creditLimit || 50000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-500">Samples Transferred:</span>
                    <span className="font-bold text-slate-800">{totalVolume} Patients</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => setPaymentModalCenter(center)}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs border border-indigo-200 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Receive Payment / Settle Ledger</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Settlement Modal */}
      {paymentModalCenter && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRecordPayment} className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-indigo-600">
              <CreditCard className="h-6 w-6" />
              <h3 className="font-bold text-base text-slate-900">Record B2B Franchise Payment</h3>
            </div>

            <p className="text-xs text-slate-600">
              Center: <strong>{paymentModalCenter.name}</strong> ({paymentModalCenter.code})
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between">
              <span className="text-slate-500">Current Outstanding Due:</span>
              <span className="font-black text-rose-600">₹{Math.abs(paymentModalCenter.ledgerBalance).toLocaleString()}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 10000"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full text-sm font-mono font-bold bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPaymentModalCenter(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20"
              >
                Confirm Receipt & Credit Ledger
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
