import React, { useState, useEffect } from 'react';
import { Building2, ShieldAlert, Lock, User, Eye, EyeOff, LogIn, ArrowRight, Key, Sparkles, HelpCircle } from 'lucide-react';
import { VendorMasterSetupModal } from './VendorMasterSetupModal';
import { useLab } from '../../context/LabContext';

export const LoginScreen = ({ labProfile, licenseInfo, onLogin, onOpenOnboarding }) => {
  const { updateMasterConfig } = useLab();
  const [username, setUsername] = useState(() => labProfile?.adminUsername || 'admin');
  const [password, setPassword] = useState(() => labProfile?.adminPassword || 'admin123');
  const [securityKey, setSecurityKey] = useState(() => {
    const key = licenseInfo?.licenseKey || '';
    if (!key || key.includes('UTK') || key.includes('LIMSXX')) {
      return 'LIMS-180D-MODERN-6B7DC6DD-7211-0949-CAB6';
    }
    return key;
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Vendor Master Modal state
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
    if (config.username) setUsername(config.username);
    if (config.password) setPassword(config.password);
    if (config.securityKey) setSecurityKey(config.securityKey);
    if (updateMasterConfig) {
      updateMasterConfig(config);
    }
    setShowVendorModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Please enter your Username.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your Password.');
      return;
    }
    if (!securityKey.trim()) {
      setErrorMessage('Please enter the active Security Key.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onLogin({
        username: username.trim(),
        password: password.trim(),
        securityKey: securityKey.trim().toUpperCase(),
        labName: labProfile?.labName || null,
        role: 'admin',
        deviceName: 'Workstation (' + window.innerWidth + 'x' + window.innerHeight + ')',
        ipAddress: '127.0.0.1'
      });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials or Security Key. Access denied.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 flex flex-col justify-center items-center p-4 font-sans select-none relative">
      
      {/* Top Right: Master Vendor Technician Trigger Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowVendorModal(true)}
          className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-amber-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md backdrop-blur-sm transition-all cursor-pointer"
          title="Master Vendor Setup (Ctrl + Shift + V)"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>👑 Vendor Master Setup</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 p-6 text-white text-center relative">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-amber-300 shadow-inner mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            {labProfile?.labName || 'Diagnostic LIMS Login'}
          </h1>
          <p className="text-xs text-sky-200/90 mt-1">
            {labProfile?.city ? `${labProfile.city} • Standalone Enterprise LIMS` : '3-Factor Authentication • Enter Credentials & Security Key'}
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center space-x-2 animate-in fade-in zoom-in-95 duration-150">
              <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            
            {/* 1. Username */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Username</label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setErrorMessage(''); }}
                  placeholder="Enter Username"
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:outline-none ${
                    errorMessage ? 'border-rose-300 focus:ring-rose-400' : 'border-slate-300 focus:ring-sky-500'
                  }`}
                />
              </div>
            </div>

            {/* 2. Password */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                  placeholder="Enter Password"
                  className={`w-full pl-9 pr-10 py-2 bg-slate-50 border rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:outline-none ${
                    errorMessage ? 'border-rose-300 focus:ring-rose-400' : 'border-slate-300 focus:ring-sky-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 3. Security Key */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 flex items-center space-x-1">
                  <Key className="h-3.5 w-3.5 text-amber-600" />
                  <span>Security License Key *</span>
                </label>
                <span className="text-[10px] text-slate-400">Issued by Vendor</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={securityKey}
                  onChange={(e) => { setSecurityKey(e.target.value); setErrorMessage(''); }}
                  placeholder="e.g. LIMS-180D-MODERN-..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px] font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-sky-900 to-indigo-900 hover:from-sky-950 hover:to-indigo-950 text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all transform active:scale-98 disabled:opacity-70 mt-3 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Authenticating 3 Factors...</span>
              ) : (
                <>
                  <span>Sign In to Laboratory</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Help Footer */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500">
              Need installation or key setup? Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Ctrl + Shift + V</kbd> for Technician Master Setup.
            </p>
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
