import React, { useState, useRef, useEffect } from 'react';
import { useLab } from '../context/LabContext';
import {
  Activity,
  UserPlus,
  Search,
  Bell,
  ChevronDown,
  LayoutDashboard,
  ClipboardList,
  FlaskConical,
  UserCheck,
  FileText,
  Palette,
  Cpu,
  ShieldCheck,
  Boxes,
  Briefcase,
  Sliders,
  LogOut,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Settings,
  X,
  Stethoscope,
  Key
} from 'lucide-react';
import { VendorLicensePortalModal } from './Auth/VendorLicensePortalModal';

export const Navbar = () => {
  const {
    currentRole,
    setCurrentRole,
    searchQuery,
    setSearchQuery,
    notifications,
    activeTab,
    setActiveTab,
    testMgmtSubTab,
    setTestMgmtSubTab,
    b2bCenters,
    labProfile,
    currentUser,
    logout,
    setShowOnboarding,
    patients,
    daysRemaining,
    licenseInfo
  } = useLab();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCenterMenu, setShowCenterMenu] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState('Main Processing Center');

  const roleMenuRef = useRef(null);
  const notifsRef = useRef(null);
  const userMenuRef = useRef(null);
  const centerMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) setShowRoleMenu(false);
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (centerMenuRef.current && !centerMenuRef.current.contains(e.target)) setShowCenterMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles = [
    { id: 'admin', label: 'Laboratory Director / Admin', icon: '👑' },
    { id: 'pathologist', label: 'Consultant Pathologist (MD)', icon: '🩺' },
    { id: 'technician', label: 'Senior Lab Technician', icon: '🧪' },
    { id: 'receptionist', label: 'Front Desk & Billing', icon: '📋' },
    { id: 'phlebotomist', label: 'Phlebotomist / Collector', icon: '💉' }
  ];

  const currentRoleObj = roles.find(r => r.id === currentRole) || roles[0];

  const pendingDoctorReviewCount = (patients || []).filter(p => p.status === 'SAMPLE_COLLECTED' || p.status === 'IN_ANALYSIS' || p.status === 'READY_FOR_REVIEW').length;
  const criticalCount = (patients || []).reduce((acc, p) => acc + (p.tests || []).reduce((tAcc, t) => tAcc + (t.parameters || []).filter(pm => pm.flag === 'HIGH' || pm.flag === 'CRITICAL').length, 0), 0);

  // Primary Clinical Navigation Tabs
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'core' },
    { id: 'registration', label: 'Patient Registration', icon: UserPlus, category: 'core' },
    { id: 'worklist', label: 'Result Entry', icon: ClipboardList, category: 'core' },
    { id: 'doctor', label: 'Doctor Review', icon: UserCheck, category: 'core', badge: pendingDoctorReviewCount > 0 ? pendingDoctorReviewCount : null },
    { id: 'phlebotomy', label: 'Phlebotomy', icon: FlaskConical, category: 'core' },
    
    // Reports & Lookup
    { id: 'reports', label: 'Patient Reports', icon: FileText, category: 'reports' },
    { id: 'report_designer', label: 'Report Designer', icon: Palette, category: 'reports' },
    { id: 'global_search', label: 'Global Search', icon: Search, category: 'reports' },

    // Infrastructure & Quality
    { id: 'machine_interface', label: 'Analyzer Hub', icon: Cpu, category: 'infrastructure' },
    { id: 'qc', label: 'Quality Control', icon: ShieldCheck, category: 'infrastructure' },
    { id: 'test_management', label: 'Test Master', icon: Layers, category: 'infrastructure' },
    { id: 'inventory', label: 'Reagent Stock', icon: Boxes, category: 'infrastructure' },
    { id: 'b2b', label: 'B2B Centers', icon: Briefcase, category: 'infrastructure' },
    { id: 'settings', label: 'Lab Settings', icon: Settings, category: 'infrastructure' },
  ];

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-xs backdrop-blur-md bg-white/95 transition-all">
      
      {/* ================= TIER 1: BRAND IDENTITY & GLOBAL WORKBAR ================= */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 border-b border-slate-100">
        
        {/* Left: Brand Identity & Center Selector */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold shadow-md shadow-sky-500/20">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-slate-900 text-base tracking-tight leading-none">
                {labProfile?.labName || licenseInfo?.labName || 'Modern Diagnostic LIMS'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                v1.0.0
              </span>
              {licenseInfo && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  (licenseInfo.totalMinutesRemaining && licenseInfo.totalMinutesRemaining <= 60) || daysRemaining <= 15
                    ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  🛡️ {licenseInfo.humanRemaining || `${daysRemaining}d Left`}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center space-x-1.5">
              <span>{labProfile?.city || 'Central Pathology'}</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                ASTM / HL7 Online
              </span>
            </p>
          </div>

          {/* Processing Center Dropdown */}
          <div className="relative hidden md:block" ref={centerMenuRef}>
            <button
              onClick={() => setShowCenterMenu(!showCenterMenu)}
              className="ml-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              <span className="max-w-[150px] truncate">{selectedCenter}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showCenterMenu && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 text-xs space-y-1">
                <div className="px-3 py-1.5 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Select Processing Branch
                </div>
                <button
                  onClick={() => { setSelectedCenter('Main Processing Center'); setShowCenterMenu(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-medium ${
                    selectedCenter === 'Main Processing Center' ? 'bg-sky-50 text-sky-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>Main Processing Center</span>
                  {selectedCenter === 'Main Processing Center' && <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />}
                </button>
                {(b2bCenters || []).map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCenter(c.name); setShowCenterMenu(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-medium ${
                      selectedCenter === c.name ? 'bg-sky-50 text-sky-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {selectedCenter === c.name && <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Quick Global Search Input */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'global_search' && e.target.value.trim()) {
                  setActiveTab('global_search');
                }
              }}
              placeholder="Search by Patient Name, Lab Code, Phone, Barcode..."
              className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="absolute right-3 top-2.5 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">
                Ctrl+K
              </kbd>
            )}
          </div>
        </div>

        {/* Right: Actions, Notifications, Role, and User Profile */}
        <div className="flex items-center space-x-2.5">
          
          {/* Action: Quick Patient Intake Button */}
          <button
            onClick={() => setActiveTab('registration')}
            className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-500/20 flex items-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">+ New Registration</span>
          </button>

          {/* Notifications Tray */}
          <div className="relative" ref={notifsRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl relative transition-all"
              title="System Alerts & Notifications"
            >
              <Bell className="h-4 w-4" />
              {(notifications || []).length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900">Activity & Alerts</span>
                  <span className="text-[10px] text-slate-400 font-medium">Real-Time Event Stream</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {(notifications || []).length === 0 ? (
                    <p className="text-center py-4 text-slate-400">No active alerts</p>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-[11px]">{n.title}</span>
                          <span className="text-[9px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher Pill */}
          <div className="relative hidden sm:block" ref={roleMenuRef}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-all"
            >
              <span>{currentRoleObj.icon}</span>
              <span className="hidden md:inline font-bold">{currentRoleObj.id.toUpperCase()}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 text-xs space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Role View
                </div>
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setCurrentRole(r.id); setShowRoleMenu(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between ${
                      currentRole === r.id ? 'bg-sky-50 text-sky-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{r.icon}</span>
                      <span>{r.label}</span>
                    </div>
                    {currentRole === r.id && <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1 pl-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                {(currentUser?.name || 'A')[0].toUpperCase()}
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 text-xs space-y-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-1">
                  <p className="font-bold text-slate-900 text-sm truncate">{currentUser?.name || 'Administrator'}</p>
                  <p className="text-[11px] text-slate-500 truncate">@{currentUser?.username || 'admin'}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-800 uppercase tracking-wider">
                    {currentRole.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => { setActiveTab('settings'); setShowUserMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center space-x-2 font-medium"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-400" />
                  <span>Laboratory Configuration</span>
                </button>
                <button
                  onClick={() => { setShowOnboarding(true); setShowUserMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center space-x-2 font-medium"
                >
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>Update Facility Profile</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => { setShowVendorModal(true); setShowUserMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sky-700 hover:bg-sky-50 flex items-center space-x-2 font-bold transition-all cursor-pointer"
                >
                  <Key className="h-3.5 w-3.5 text-sky-600" />
                  <span>Master License Generator</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-bold transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ================= TIER 2: SLEEK CATEGORIZED NAVIGATION BAR ================= */}
      <div className="px-4 sm:px-6 py-1.5 flex items-center space-x-1 overflow-x-auto scrollbar-none text-xs bg-slate-50/50">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-sky-500 text-white' : 'bg-rose-100 text-rose-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Built-in Vendor Master Key Generator Modal */}
      <VendorLicensePortalModal
        isOpen={showVendorModal}
        onClose={() => setShowVendorModal(false)}
      />

    </header>
  );
};
