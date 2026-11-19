import React, { useEffect, useState } from 'react';
import { Printer, X, Check, QrCode, TestTube2, Zap, Settings, ShieldCheck } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { VIAL_TYPES } from '../../data/mockData';

export const BarcodePrintModal = ({ patient, onClose }) => {
  if (!patient) return null;

  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [isPrintingSilent, setIsPrintingSilent] = useState(false);
  const [silentPrintSuccess, setSilentPrintSuccess] = useState(false);

  const samplesList = (patient.samples && patient.samples.length > 0) ? patient.samples : [
    {
      barcode: patient.barcode || `SMP-${Date.now().toString().slice(-6)}`,
      type: 'EDTA',
      vialType: patient.vialType || 'EDTA (Purple Top)',
      testNames: (patient.tests || []).map(t => typeof t === 'object' ? (t.name || t.testId) : t).join(', ') || 'Clinical Pathology'
    }
  ];

  // Render real scannable Code128 barcodes via JsBarcode
  useEffect(() => {
    samplesList.forEach(sample => {
      const svgId = `barcode-svg-${sample.barcode}`;
      const el = document.getElementById(svgId);
      if (el) {
        try {
          JsBarcode(el, sample.barcode, {
            format: 'CODE128',
            width: 1.4,
            height: 32,
            displayValue: false,
            margin: 0,
            lineColor: '#000000'
          });
        } catch (e) {
          console.warn('JsBarcode render error:', e);
        }
      }
    });
  }, [samplesList]);

  // Fetch installed system printers if running inside Electron
  useEffect(() => {
    if (window.electron && typeof window.electron.getPrinters === 'function') {
      window.electron.getPrinters().then(list => {
        if (Array.isArray(list)) {
          setPrinters(list);
          const thermal = list.find(p => p.name.toLowerCase().includes('pos') || p.name.toLowerCase().includes('thermal') || p.name.toLowerCase().includes('barcode') || p.name.toLowerCase().includes('label'));
          if (thermal) setSelectedPrinter(thermal.name);
          else if (list.length > 0) setSelectedPrinter(list[0].name);
        }
      }).catch(() => {});
    }
  }, []);

  // 1-Click Silent Thermal Printing (No popup dialog)
  const handleSilentThermalPrint = async () => {
    setIsPrintingSilent(true);
    setSilentPrintSuccess(false);

    const labelsHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page {
            size: 50mm 25mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 1.5mm;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8pt;
            background: #fff;
            color: #000;
          }
          .label-container {
            width: 47mm;
            height: 22mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-after: always;
          }
          .label-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 7.5pt;
          }
          .barcode-box {
            text-align: center;
            margin: 0.5mm 0;
          }
          .barcode-box svg {
            width: 100%;
            height: 22px;
          }
          .code-text {
            font-family: monospace;
            font-size: 7pt;
            letter-spacing: 1px;
            font-weight: bold;
          }
          .label-footer {
            display: flex;
            justify-content: space-between;
            font-size: 6.5pt;
            color: #222;
          }
        </style>
      </head>
      <body>
        ${samplesList.map(s => {
          const svgEl = document.getElementById(`barcode-svg-${s.barcode}`);
          const svgHtml = svgEl ? svgEl.outerHTML : `<div style="height:20px; border:1px solid #000;">*${s.barcode}*</div>`;
          return `
            <div class="label-container">
              <div class="label-header">
                <span>${patient.name.substring(0, 18)}</span>
                <span>${patient.age || ''}${patient.gender?.charAt(0) || ''}</span>
              </div>
              <div class="barcode-box">
                ${svgHtml}
                <div class="code-text">${s.barcode}</div>
              </div>
              <div class="label-footer">
                <span>${s.type}</span>
                <span>${patient.uhid || patient.labCode || ''}</span>
                <span>${new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          `;
        }).join('')}
      </body>
      </html>
    `;

    if (window.electron && typeof window.electron.printSilent === 'function') {
      try {
        const result = await window.electron.printSilent({
          html: labelsHtml,
          printerName: selectedPrinter,
          pageSize: { width: 50000, height: 25000 }
        });
        if (result && result.success) {
          setSilentPrintSuccess(true);
          setTimeout(() => setSilentPrintSuccess(false), 3000);
        } else {
          window.print();
        }
      } catch (err) {
        window.print();
      }
    } else {
      // Browser fallback
      window.print();
    }
    setIsPrintingSilent(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TestTube2 className="h-5 w-5 text-sky-400" />
            <h3 className="font-bold text-sm">Thermal Barcode Tube Labels (50mm × 25mm)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto" id="printable-labels">
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-emerald-800 text-xs">
            <div className="flex items-center space-x-3">
              <Check className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Patient Registered: </span>
                {patient.name} ({patient.uhid || patient.labCode || 'UHID-2026-001'}) • {patient.age}y / {patient.gender}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-200 text-emerald-900 text-[10px]">
              Ready for Phlebotomy
            </span>
          </div>

          {/* Barcode Stickers Grid (Standard 50x25mm Thermal Barcode Labels) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <span>Direct Scannable Code128 Tube Stickers</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 text-sky-800">
                  {samplesList.length} Vials
                </span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">Standard 50mm × 25mm Thermal Size</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {samplesList.map(sample => {
                const vialInfo = VIAL_TYPES[sample.type] || { name: sample.type, badgeClass: 'bg-slate-100 text-slate-800' };
                return (
                  <div
                    key={sample.barcode}
                    className="p-3.5 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col justify-between space-y-2 shadow-sm hover:border-sky-400 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900 truncate">{patient.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${vialInfo.badgeClass}`}>
                        {sample.type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono font-semibold">
                      <span>{patient.uhid || patient.labCode}</span>
                      <span>{patient.age}{patient.gender?.charAt(0)}</span>
                      <span>{patient.registrationDate?.split(' ')[1] || 'STAT'}</span>
                    </div>

                    {/* Genuine Scannable Code128 Barcode Rendered via JsBarcode */}
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col items-center">
                      <svg id={`barcode-svg-${sample.barcode}`} className="h-8 w-full max-w-[180px]"></svg>
                      <span className="font-mono text-[10px] font-bold text-slate-900 tracking-wider mt-0.5">
                        *{sample.barcode}*
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 flex justify-between font-mono">
                      <span className="truncate">{sample.vialName || sample.type}</span>
                      <span className="font-semibold text-slate-700">Modern LIMS</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Thermal Printer Selection (if in Electron) */}
          {printers.length > 0 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-slate-500" />
                <span className="font-bold text-slate-700">Thermal Printer Device:</span>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg p-1.5 font-medium"
                >
                  {printers.map(p => (
                    <option key={p.name} value={p.name}>{p.name} {p.isDefault ? '(Default)' : ''}</option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                Direct Silent Mode Ready
              </span>
            </div>
          )}

          {/* Quick Invoice Receipt Preview */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <p className="font-bold text-slate-900">Modern Diagnostic Pathology & Research Center</p>
                <p className="text-[10px] text-slate-500">Invoice: {patient.billing?.invoiceNo || 'INV-2026-001'} • {new Date().toLocaleDateString('en-GB')}</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                {patient.billing?.dueAmount === 0 ? 'PAID IN FULL' : 'PARTIAL / DUE'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <p><strong className="text-slate-800">Patient:</strong> {patient.name} ({patient.age}y / {patient.gender})</p>
              <p><strong className="text-slate-800">Phone:</strong> {patient.phone || '-'}</p>
              <p><strong className="text-slate-800">Doctor:</strong> {patient.referringDoctor || 'Direct Walk-in'}</p>
              <p><strong className="text-slate-800">Center:</strong> {patient.b2bCenter || 'Main Reception'}</p>
            </div>

            <div className="border-t border-slate-100 pt-2 flex justify-between text-slate-800 font-medium">
              <span>Gross: ₹{patient.billing?.grossTotal || patient.billing?.grossAmount || 500} | Discount: ₹{patient.billing?.discount || 0}</span>
              <span className="font-black text-sm text-slate-900">Total Paid: ₹{patient.billing?.paidAmount || patient.billing?.total || 500}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {silentPrintSuccess && (
              <span className="text-emerald-700 font-bold flex items-center space-x-1">
                <Check className="h-4 w-4" />
                <span>Printed silently to {selectedPrinter}!</span>
              </span>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleSilentThermalPrint}
              disabled={isPrintingSilent}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Zap className="h-4 w-4 text-amber-300" />
              <span>{isPrintingSilent ? 'Printing...' : 'Silent Print (50mm × 25mm)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
