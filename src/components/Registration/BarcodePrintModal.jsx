import React from 'react';
import { Printer, X, Check, QrCode, TestTube2 } from 'lucide-react';
import { VIAL_TYPES } from '../../data/mockData';

export const BarcodePrintModal = ({ patient, onClose }) => {
  if (!patient) return null;

  const samplesList = (patient.samples && patient.samples.length > 0) ? patient.samples : [
    {
      barcode: patient.barcode || `SMP-${Date.now().toString().slice(-6)}`,
      type: 'EDTA',
      vialType: patient.vialType || 'EDTA (Purple Top)',
      testNames: (patient.tests || []).map(t => typeof t === 'object' ? (t.name || t.testId) : t).join(', ') || 'Clinical Pathology'
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TestTube2 className="h-5 w-5 text-sky-400" />
            <h3 className="font-bold text-sm">Sample Barcode Labels & Receipt Preview</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto" id="printable-labels">
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center space-x-3 text-emerald-800 text-xs">
            <Check className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Patient Registered Successfully: </span>
              {patient.name} ({patient.uhid || 'UHID-2026-001'}) • Invoice #{patient.billing?.invoiceNo || 'INV-2026-001'}
            </div>
          </div>

          {/* Barcode Stickers Grid (Simulating Standard 50x25mm Thermal Barcode Labels) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Generated Sample Tube Barcode Stickers ({samplesList.length} Vials)
              </h4>
              <span className="text-[11px] text-slate-400">Standard 50mm × 25mm Label Size</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {samplesList.map(sample => {
                const vialInfo = VIAL_TYPES[sample.type] || { name: sample.type, badgeClass: 'bg-slate-100 text-slate-800' };
                return (
                  <div
                    key={sample.barcode}
                    className="p-3.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col justify-between space-y-2 shadow-inner"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate">{patient.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${vialInfo.badgeClass}`}>
                        {sample.type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{patient.uhid}</span>
                      <span>{patient.age}{patient.gender?.charAt(0)}</span>
                      <span>{patient.registrationDate?.split(' ')[1] || 'STAT'}</span>
                    </div>

                    {/* Simulated Code128 Barcode Graphic */}
                    <div className="bg-white p-2 rounded border border-slate-200 flex flex-col items-center">
                      <div className="h-8 w-full flex items-center justify-center space-x-0.5 overflow-hidden">
                        {[4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 1, 3, 4, 1, 2].map((w, i) => (
                          <div
                            key={i}
                            className="bg-black h-full"
                            style={{ width: `${w * 1.5}px` }}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-800 tracking-wider mt-1">
                        *{sample.barcode}*
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span className="truncate">{sample.vialName}</span>
                      <span className="font-semibold text-slate-700">PulseLab LIS</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Invoice Receipt Preview */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <p className="font-bold text-slate-900">PulseLab Diagnostics & Research Center</p>
                <p className="text-[10px] text-slate-500">Invoice: {patient.billing?.invoiceNo} • {patient.billing?.invoiceDate}</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                {patient.billing?.dueAmount === 0 ? 'PAID IN FULL' : 'PARTIAL / DUE'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <p><strong className="text-slate-800">Patient:</strong> {patient.name} ({patient.age}y / {patient.gender})</p>
              <p><strong className="text-slate-800">Phone:</strong> {patient.phone}</p>
              <p><strong className="text-slate-800">Doctor:</strong> {patient.referringDoctor}</p>
              <p><strong className="text-slate-800">Center:</strong> {patient.b2bCenter}</p>
            </div>

            <div className="border-t border-slate-100 pt-2 flex justify-between text-slate-800 font-medium">
              <span>Gross: ₹{patient.billing?.grossTotal} | Discount: ₹{patient.billing?.discount}</span>
              <span className="font-black text-sm text-slate-900">Total Paid: ₹{patient.billing?.paidAmount}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition-colors"
          >
            Close Window
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print Barcodes & Receipt</span>
          </button>
        </div>

      </div>
    </div>
  );
};
