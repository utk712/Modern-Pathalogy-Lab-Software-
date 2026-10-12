import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Cpu,
  FileText,
  Database,
  ArrowRight,
  ArrowLeft,
  Lock,
  Sparkles,
  Award,
  CheckCircle2,
  Zap,
  BarChart3,
  HardDrive,
  User,
  Eye,
  EyeOff,
  ShieldAlert,
  LogIn
} from 'lucide-react';
import { VendorMasterSetupModal } from '../Auth/VendorMasterSetupModal';
import { useLab } from '../../context/LabContext';

export const WelcomeScreen = ({ labProfile, licenseInfo, onLogin, onOpenOnboarding, onBack }) => {
  const { updateMasterConfig } = useLab();
  // Form State
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [securityKey, setSecurityKey] = useState(licenseInfo?.licenseKey || 'LIMS-180D-MODERN-6B76CD80-0FD1-1785-F5B6');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleBackClick = () => {
    setUsername('');
    setPassword('');
    setSecurityKey('');
    setErrorMessage('');
    if (onBack) onBack();
  };

  // Vendor Master Setup Modal state
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [testCount, setTestCount] = useState(0);

  // Animated Counter Effect for 1,148 Test Master
  useEffect(() => {
    let start = 0;
    const end = 1148;
    const duration = 1000;
    const increment = Math.ceil(end / (duration / 16));

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setTestCount(end);
        clearInterval(timer);
      } else {
        setTestCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, []);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white relative flex flex-col justify-between overflow-x-hidden select-none">
      
      {/* Background Soft Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* 1. TOP NAVBAR */}
      <header className="relative z-10 bg-white/90 border-b border-slate-200/80 backdrop-blur-md px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/20">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">Modern Diagnostic LIMS</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  v1.0.6 Commercial
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Standalone Pathology & Clinical Intelligence System</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowVendorModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              <span>👑 Vendor Setup (Ctrl+Shift+V)</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN LAYOUT: LEFT SHOWCASE & RIGHT DIRECT LOGIN FORM */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex-1 flex flex-col justify-center w-full">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT 7 COLS: HERO BRANDING & FEATURE SHOWCASE */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-indigo-700 text-xs font-bold shadow-xs">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>ISO 15189:2022 & NABL Certified Pathology System</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Next-Gen Diagnostic <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-800">
                Pathology Information System
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xl">
              High-performance diagnostic suite pre-loaded with <strong className="text-slate-800">1,148+ test profiles</strong>, 
              ASTM/HL7 machine drivers, Levey-Jennings QC, and 1-click digital signed reporting.
            </p>

            {/* METRICS ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { label: 'Test Catalog', value: `${testCount}+`, sub: 'Pre-Configured', icon: Database, color: 'text-indigo-600' },
                { label: 'Machine Hub', value: 'ASTM/HL7', sub: 'Real-Time Drivers', icon: Cpu, color: 'text-sky-600' },
                { label: 'Query Speed', value: '< 0.01s', sub: 'Zero-Lag Engine', icon: Zap, color: 'text-amber-600' },
                { label: 'Backups', value: 'Daily', sub: 'Automated JSON', icon: HardDrive, color: 'text-emerald-600' }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">{stat.label}</span>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div className="text-lg font-black text-slate-900">{stat.value}</div>
                    <p className="text-[10px] text-slate-500 font-medium">{stat.sub}</p>
                  </div>
                );
              })}
            </div>

            {/* FEATURE HIGHLIGHT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start space-x-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Automated Machine Hub</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">ASTM 1394 & HL7 v2.5 drivers for zero manual typing errors.</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start space-x-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">NABL Signed Reports</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">2.0" letterhead offset, 1 test/page rule, and dynamic QR verification.</p>
                </div>
              </div>
            </div>

            {/* LIVE SYSTEM STATUS BAR */}
            <div className="bg-[#1e293b] p-3.5 rounded-xl border border-slate-700 shadow-xs flex items-center justify-between text-xs text-white">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-white text-xs">System Diagnostics:</span>
                <span className="text-slate-300 text-[11px]">All local engines active</span>
              </div>

              <div className="flex items-center space-x-3 text-[11px] font-bold">
                <span className="text-emerald-400">Central DB: ONLINE</span>
                <span className="text-sky-400">ASTM Hub: ACTIVE</span>
              </div>
            </div>

          </div>

          {/* RIGHT 5 COLS: DIRECT 3-FACTOR LOGIN CARD */}
          <div className="lg:col-span-5">
            
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-900 p-6 text-white text-center relative">
                <div className="h-11 w-11 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-amber-300 shadow-inner mb-2">
                  <Lock className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black tracking-tight text-white">
                  {labProfile?.labName || 'Laboratory System Access'}
                </h2>
                <p className="text-xs text-indigo-200/90 mt-1">
                  Enter 3-Factor Credentials to Sign In
                </p>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-4">
                
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center space-x-2">
                    <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                  
                  {/* Username */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Username</label>
                    <div className="relative">
                      <User className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Password</label>
                    <div className="relative">
                      <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 font-medium text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Security Key */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Security License Key</label>
                    <input
                      type="text"
                      required
                      value={securityKey}
                      onChange={(e) => setSecurityKey(e.target.value.toUpperCase())}
                      placeholder="LIMS-180D-XXXXXX-XXXX-XXXX"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs uppercase font-bold text-indigo-900 tracking-wider focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center space-x-2 group mt-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Laboratory System'}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                </form>

                {/* Technician Vendor Setup Button inside Card */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Technician Gateway:</span>
                  <button
                    type="button"
                    onClick={() => setShowVendorModal(true)}
                    className="text-amber-700 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Lock className="h-3.5 w-3.5 text-amber-600" />
                    <span>Vendor Setup (Ctrl+Shift+V)</span>
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>

      </main>

      {/* 3. FOOTER */}
      <footer className="relative z-10 bg-white border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <span>Modern Diagnostic Laboratory Information Management System (LIMS)</span>
        </div>
        <span className="text-[11px]">Official Commercial Release v1.0.6</span>
      </footer>

      {/* Vendor Master Setup Modal (Ctrl + Shift + V) */}
      <VendorMasterSetupModal
        isOpen={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        onApplyConfig={handleConfigApplied}
      />

    </div>
  );
};
