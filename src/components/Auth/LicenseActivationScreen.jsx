import React, { useState, useEffect } from 'react';
import { useLab } from '../../context/LabContext';
import {
  KeyRound,
  ShieldAlert,
  Building2,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { VendorMasterSetupModal } from './VendorMasterSetupModal';

import { verifyLicenseOnCloud } from '../../config/firebase';

export const LicenseActivationScreen = () => {
  const { labProfile, activateLicense, licenseInfo } = useLab();

  const [labName, setLabName] = useState(labProfile?.labName || licenseInfo?.labName || '');
  const [licenseKey, setLicenseKey] = useState('');
  const [errorMsg, setErrorMsg] = useState(licenseInfo?.error || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);

  // Keyboard shortcut Ctrl + Shift + V for Technician Master Setup
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault();
        setShowVendorModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleConfigApplied = (config) => {
    if (config.labName) setLabName(config.labName);
    if (config.securityKey) {
      setLicenseKey(config.securityKey);
      const res = activateLicense(config.labName || labName || 'Diagnostic Lab', config.securityKey);
      if (res.success) {
        setSuccessInfo(res);
      }
    }
    setShowVendorModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!licenseKey.trim()) {
      setErrorMsg('Please enter a valid Security License Key.');
      return;
    }

    setIsSubmitting(true);

    // Verify key status on Firebase Cloud
    const cloudCheck = await verifyLicenseOnCloud(licenseKey.trim().toUpperCase());
    if (cloudCheck && !cloudCheck.valid && cloudCheck.isRevoked) {
      setIsSubmitting(false);
      setErrorMsg('🔴 License Revoked by System Vendor Owner on Firebase Cloud. Access Denied.');
      return;
    }

    const effLab = labName.trim() || labProfile?.labName || 'Diagnostic Laboratory';
    const result = activateLicense(effLab, licenseKey.trim().toUpperCase());
    setIsSubmitting(false);

    if (result.success) {
      setSuccessInfo(result);
    } else {
      setErrorMsg(result.error || 'Invalid Security License Key.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 sm:p-6 text-slate-100 font-sans selection:bg-sky-500 selection:text-white relative">
      
      {/* Top Right Vendor Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={() => setShowVendorModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Lock className="h-3.5 w-3.5 text-amber-400" />
          <span>👑 Vendor Master Setup</span>
        </button>
      </div>

      {/* Background Glow Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-lg w-full bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/40 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-red-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-500/25">
            <ShieldAlert className="h-7 w-7 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              🔒 Software License Expired
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
              Your test / maintenance license period has completed. Please enter a valid renewal key to unlock the system.
            </p>
          </div>
        </div>

        {/* Expired Alert Banner */}
        <div className="p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-2xl flex items-start space-x-3 text-rose-200 text-xs">
          <Clock className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Access Locked by Security System:</span>
            <p className="text-[11px] text-rose-300/90">
              Please contact the software owner or vendor to obtain a new Security Key.
            </p>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-900/80 border border-rose-700 rounded-2xl flex items-start space-x-3 text-rose-100 text-xs animate-in fade-in duration-150">
            <AlertCircle className="h-5 w-5 text-rose-300 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">License Notice:</span>
              <p className="text-[11px] text-rose-200">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {successInfo && (
          <div className="p-4 bg-emerald-950/70 border border-emerald-700 rounded-2xl flex items-start space-x-3 text-emerald-200 text-xs animate-in fade-in duration-150">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-emerald-300">Software Successfully Renewed!</span>
              <p className="text-[11px] text-emerald-400/90">
                License updated ({successInfo.humanRemaining || `${successInfo.daysRemaining} days`}). Unlocking software...
              </p>
            </div>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Laboratory Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Registered Laboratory Name</span>
            </label>
            <input
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              placeholder="e.g. Utk Pathology"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
            />
          </div>

          {/* Security License Key Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Lock className="h-3.5 w-3.5 text-indigo-400" />
              <span>Renewal Security License Key *</span>
            </label>
            <input
              type="text"
              required
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="LIMS-180D-XXXXXX-XXXXXXXX-XXXX-XXXX-XXXX"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono font-bold text-sky-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Verifying Key...' : 'Unlock & Renew License'}</span>
            <ChevronRight className="h-4 w-4" />
          </button>

        </form>

        {/* Footer Notes */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <button
            type="button"
            onClick={() => setShowVendorModal(true)}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
          >
            Technician Setup (Ctrl + Shift + V)
          </button>
          <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Cryptographic Engine</span>
          </div>
        </div>

      </div>

      {/* Vendor Master Setup Modal */}
      <VendorMasterSetupModal
        isOpen={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        onConfigApplied={handleConfigApplied}
      />

    </div>
  );
};
