import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import {
  TestTube,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  AlertTriangle,
  QrCode,
  ArrowRight,
  ShieldAlert,
  Flame,
  Pipette
} from 'lucide-react';
import { VIAL_TYPES, SAMPLE_REJECTION_REASONS } from '../../data/mockData';

export const PhlebotomyStation = () => {
  const { patients, collectSample, receiveSample, rejectSample, setActiveTab, setSelectedPatientId } = useLab();

  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [rejectModalData, setRejectModalData] = useState(null); // { patientId, barcode, vialName }
  const [selectedReason, setSelectedReason] = useState(SAMPLE_REJECTION_REASONS[0]);

  // Patients who have samples in progress
  const activePatients = (patients || []).filter(p => p?.status !== 'AUTHORIZED');

  const handleBarcodeScan = (e) => {
    e.preventDefault();
    if (!barcodeQuery.trim()) return;

    // Find sample by barcode
    let found = false;
    (patients || []).forEach(p => {
      (p?.samples || []).forEach(s => {
        if (s?.barcode && s.barcode.toLowerCase() === barcodeQuery.trim().toLowerCase()) {
          found = true;
          if (s.status === 'PENDING_COLLECTION') {
            collectSample(p.id, s.barcode);
          } else if (s.status === 'COLLECTED') {
            receiveSample(p.id, s.barcode);
          } else {
            alert(`Sample ${s.barcode} is already in state: ${s.status}`);
          }
        }
      });
    });

    if (!found) {
      alert(`Barcode "${barcodeQuery}" not found in current database.`);
    }
    setBarcodeQuery('');
  };

  const handleConfirmRejection = () => {
    if (!rejectModalData) return;
    rejectSample(rejectModalData.patientId, rejectModalData.barcode, selectedReason);
    setRejectModalData(null);
  };

  // Helper to maintain vivid clinical vial colors (Purple, Gold/Yellow, Grey, Blue, Red, Yellow)
  const getVialTheme = (sample) => {
    const typeStr = (sample?.type || sample?.vialName || '').toUpperCase();

    if (typeStr.includes('EDTA') || typeStr.includes('PURPLE')) {
      return {
        typeLabel: 'EDTA',
        vialName: sample.vialName || 'K2/K3 EDTA (Purple Top)',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold',
        dotColor: 'bg-purple-600',
        cardBg: 'border-purple-200 bg-purple-50/30'
      };
    }
    if (typeStr.includes('SERUM') || typeStr.includes('GOLD') || typeStr.includes('SST') || typeStr.includes('YELLOW')) {
      return {
        typeLabel: 'SERUM',
        vialName: sample.vialName || 'Clot Activator / SST (Gold Top)',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
        dotColor: 'bg-amber-500',
        cardBg: 'border-amber-200 bg-amber-50/30'
      };
    }
    if (typeStr.includes('FLUORIDE') || typeStr.includes('GREY') || typeStr.includes('GRAY')) {
      return {
        typeLabel: 'FLUORIDE',
        vialName: sample.vialName || 'Sodium Fluoride (Grey Top)',
        badgeClass: 'bg-slate-200 text-slate-900 border-slate-400 font-extrabold',
        dotColor: 'bg-slate-600',
        cardBg: 'border-slate-300 bg-slate-100/50'
      };
    }
    if (typeStr.includes('CITRATE') || typeStr.includes('BLUE')) {
      return {
        typeLabel: 'CITRATE',
        vialName: sample.vialName || 'Sodium Citrate 3.2% (Blue Top)',
        badgeClass: 'bg-sky-100 text-sky-900 border-sky-300 font-extrabold',
        dotColor: 'bg-sky-500',
        cardBg: 'border-sky-200 bg-sky-50/30'
      };
    }
    if (typeStr.includes('PLAIN') || typeStr.includes('RED')) {
      return {
        typeLabel: 'PLAIN',
        vialName: sample.vialName || 'Plain / No Additive (Red Top)',
        badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold',
        dotColor: 'bg-rose-600',
        cardBg: 'border-rose-200 bg-rose-50/30'
      };
    }
    if (typeStr.includes('URINE')) {
      return {
        typeLabel: 'URINE',
        vialName: sample.vialName || 'Spot Urine Container',
        badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300 font-extrabold',
        dotColor: 'bg-yellow-500',
        cardBg: 'border-yellow-200 bg-yellow-50/30'
      };
    }

    return {
      typeLabel: sample.type || 'SPECIMEN',
      vialName: sample.vialName || 'Standard Collection Vial',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold',
      dotColor: 'bg-purple-600',
      cardBg: 'border-purple-200 bg-purple-50/30'
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <TestTube className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Phlebotomy Station & Sample Accessioning</h1>
            <p className="text-xs text-slate-500">Color-coded tube validation, collection timestamps, and NABL sample acceptance</p>
          </div>
        </div>

        {/* Rapid Barcode Scanner Input */}
        <form onSubmit={handleBarcodeScan} className="flex items-center space-x-2">
          <div className="relative">
            <QrCode className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Scan / Type Barcode (e.g. BC-9901-EDTA)..."
              value={barcodeQuery}
              onChange={(e) => setBarcodeQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 w-64 font-mono font-bold"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Accession
          </button>
        </form>
      </div>

      {/* Patient Sample Accessioning Queue */}
      <div className="space-y-4">
        {activePatients.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Phlebotomy Queue Empty</h3>
            <p className="text-xs text-slate-500">All registered patient specimens have been processed or authorized.</p>
          </div>
        ) : (
          activePatients.map(patient => {
            const patientSamples = (Array.isArray(patient.samples) && patient.samples.length > 0) ? patient.samples : [
              {
                barcode: patient.barcode || `SMP-${Date.now().toString().slice(-6)}`,
                type: 'EDTA',
                vialName: patient.vialType || 'EDTA (Purple Top)',
                status: 'PENDING_COLLECTION'
              }
            ];
            const allCollected = patientSamples.every(s => s.status === 'COLLECTED' || s.status === 'RECEIVED');
            const allReceived = patientSamples.every(s => s.status === 'RECEIVED');

            return (
              <div
                key={patient.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-sm space-y-4 ${
                  patient.urgentTat ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                }`}
              >
                
                {/* Patient Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-800 font-bold text-xs">
                      {(patient.name || 'P').charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{patient.name}</span>
                        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          {patient.uhid}
                        </span>
                        {patient.urgentTat && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 flex items-center space-x-1">
                            <Flame className="h-3 w-3 fill-rose-600" />
                            <span>STAT URGENT</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {patient.age} {patient.ageType} • {patient.gender} • Ref: {patient.referringDoctor || 'Self'} • Source: {patient.sampleSource || 'Walk-in'}
                      </p>
                    </div>
                  </div>

                  {/* Bulk Actions per Patient */}
                  <div className="flex items-center space-x-2">
                    {!allCollected && (
                      <button
                        onClick={() => collectSample(patient.id, null)}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <TestTube className="h-3.5 w-3.5" />
                        <span>Draw All Vials ({patientSamples.filter(s => s.status === 'PENDING_COLLECTION').length})</span>
                      </button>
                    )}

                    {allCollected && !allReceived && (
                      <button
                        onClick={() => receiveSample(patient.id, null)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Accept All in Lab Worklist</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setActiveTab('worklist');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1"
                    >
                      <span>Worklist</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Sample Vials Grid for This Patient */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {patientSamples.map(sample => {
                    const theme = getVialTheme(sample);

                    return (
                      <div
                        key={sample.barcode}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 shadow-2xs ${theme.cardBg}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className={`h-3 w-3 rounded-full shrink-0 shadow-xs ${theme.dotColor}`} />
                            <span className={`px-2 py-0.5 rounded text-[10px] border shadow-2xs ${theme.badgeClass}`}>
                              {theme.typeLabel} • {theme.vialName}
                            </span>
                          </div>

                          {sample.status === 'PENDING_COLLECTION' && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Pending Draw</span>
                            </span>
                          )}
                          {sample.status === 'COLLECTED' && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              Collected ({sample.collectedAt || 'Just Now'})
                            </span>
                          )}
                          {sample.status === 'RECEIVED' && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Received in Lab</span>
                            </span>
                          )}
                          {sample.status === 'REJECTED' && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              REJECTED
                            </span>
                          )}
                        </div>

                        <div className="font-mono text-xs font-bold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs">
                          <span>{sample.barcode}</span>
                          <span className="text-[10px] text-slate-400 font-sans font-normal">Code128</span>
                        </div>

                        {/* Vial Level Action Buttons */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          {sample.status === 'PENDING_COLLECTION' && (
                            <button
                              onClick={() => collectSample(patient.id, sample.barcode)}
                              className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center justify-center space-x-1"
                            >
                              <Pipette className="h-3.5 w-3.5" />
                              <span>Mark Collected</span>
                            </button>
                          )}

                          {sample.status === 'COLLECTED' && (
                            <div className="flex items-center space-x-2 w-full">
                              <button
                                onClick={() => receiveSample(patient.id, sample.barcode)}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Accept In Lab</span>
                              </button>
                              <button
                                onClick={() => setRejectModalData({ patientId: patient.id, barcode: sample.barcode, vialName: sample.vialName })}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-colors"
                                title="Reject Sample (Hemolyzed, Clotted, etc.)"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          )}

                          {sample.status === 'RECEIVED' && (
                            <span className="text-[11px] text-emerald-700 font-bold flex items-center space-x-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Ready on analyzer worklist</span>
                            </span>
                          )}

                          {sample.status === 'REJECTED' && (
                            <span className="text-[10px] text-rose-600 font-bold">
                              Reason: {sample.rejectionReason}
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Sample Rejection Modal */}
      {rejectModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="font-bold text-base text-slate-900">Reject Specimen / Recollection</h3>
            </div>
            
            <p className="text-xs text-slate-600">
              You are rejecting sample <strong>{rejectModalData.barcode}</strong> ({rejectModalData.vialName}). Please select the clinical rejection reason for NABL audit compliance:
            </p>

            <div className="space-y-2">
              {SAMPLE_REJECTION_REASONS.map(reason => (
                <label
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`p-2.5 rounded-xl border text-xs flex items-center space-x-2.5 cursor-pointer transition-colors ${
                    selectedReason === reason
                      ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectModalData(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejection}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Confirm Rejection & Notify
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
