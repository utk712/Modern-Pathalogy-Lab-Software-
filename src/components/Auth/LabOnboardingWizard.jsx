import React, { useState } from 'react';
import { Building2, User, Lock, MapPin, Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export const LabOnboardingWizard = ({ onComplete, initialData = null }) => {
  const [labName, setLabName] = useState(initialData?.labName || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [adminName, setAdminName] = useState(initialData?.adminName || '');
  const [adminUsername, setAdminUsername] = useState(initialData?.adminUsername || '');
  const [adminPassword, setAdminPassword] = useState(initialData?.adminPassword || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!labName.trim()) {
      setError('Please enter your Laboratory Name.');
      return;
    }
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setError('Please create a Username and Password.');
      return;
    }

    const cleanProfile = {
      labName: labName.trim(),
      city: city.trim() || 'Main Branch',
      address: city.trim() ? `${city.trim()} Diagnostic Center` : 'Main Laboratory Facility',
      phone: '+91 98000 00000',
      email: `${adminUsername.trim().toLowerCase()}@laboratory.com`,
      tagline: 'Modern Diagnostic Laboratory & Pathology Services',
      regNo: 'REG-' + Math.floor(10000 + Math.random() * 90000),
      accreditation: 'ISO 15189:2022 Certified',
      
      // Doctor / Pathologist
      directorName: adminName.trim() || 'Chief Pathologist',
      directorDegree: 'MD (Pathology)',
      pathologistName: adminName.trim() || 'Consultant Pathologist',
      pathologistDegree: 'MBBS, MD (Pathology)',
      mciRegNo: 'MCI-' + Math.floor(10000 + Math.random() * 90000),
      designation: 'Chief Pathologist & Lab Director',
      signatureText: `${adminName.trim() || 'Consultant Pathologist'}\nMBBS, MD (Pathology)\nChief Pathologist`,

      // Admin Credentials
      adminName: adminName.trim() || 'Lab Administrator',
      adminUsername: adminUsername.trim(),
      adminPassword: adminPassword.trim(),
      securityPin: '1234'
    };

    onComplete(cleanProfile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-sky-100 max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 p-6 text-white relative">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-amber-300 shadow-inner">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold tracking-wider uppercase font-mono text-amber-300">
                <Sparkles className="h-3 w-3" />
                <span>First Time Setup</span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-white mt-0.5">
                Register Your Laboratory
              </h1>
            </div>
          </div>
          <p className="text-xs text-sky-200/90 mt-2">
            Enter your basic laboratory details and create your master login to launch the system.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold">
              {error}
            </div>
          )}

          {/* 1. Laboratory Name */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center space-x-1">
              <Building2 className="h-3.5 w-3.5 text-sky-600" />
              <span>Laboratory / Clinic Name *</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={labName}
              onChange={(e) => { setLabName(e.target.value); setError(''); }}
              placeholder="e.g. Apex Diagnostics & Research Center"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* 2. City / Location */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center space-x-1">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              <span>City / Branch Location</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai / Pune / Delhi"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* 3. Doctor / Owner Name */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center space-x-1">
              <User className="h-3.5 w-3.5 text-purple-600" />
              <span>Doctor / Lab Director / Owner Name</span>
            </label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="e.g. Dr. Ramesh Sharma, MD"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Divider */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Create Admin Login Credentials
            </span>
          </div>

          {/* 4. Username & Password Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Username *</label>
              <div className="relative">
                <User className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => { setAdminUsername(e.target.value); setError(''); }}
                  placeholder="e.g. admin"
                  className="w-full pl-8 pr-2.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Password *</label>
              <div className="relative">
                <Lock className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => { setAdminPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-2.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-sky-900 to-indigo-900 hover:from-sky-950 hover:to-indigo-950 text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all transform active:scale-98"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Register & Launch Laboratory</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
