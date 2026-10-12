import React from 'react';
import { useLab } from '../context/LabContext';
import {
  Search,
  LayoutDashboard,
  UserPlus,
  TestTube,
  FlaskConical,
  FileCheck2,
  FileText,
  Building2,
  LineChart,
  Boxes,
  Settings,
  Cpu,
  Sliders,
  ListTree
} from 'lucide-react';

export const Sidebar = () => {
  const { activeTab, setActiveTab, patients, inventory } = useLab();

  const pendingCollection = patients.filter(p => p.status === 'REGISTERED' || p.samples.some(s => s.status === 'PENDING_COLLECTION')).length;
  const inTesting = patients.filter(p => p.status === 'IN_TESTING' || p.status === 'COLLECTED').length;
  const pendingApproval = patients.filter(p => p.status === 'PENDING_APPROVAL').length;
  const authorized = patients.filter(p => p.status === 'AUTHORIZED').length;
  const lowStock = inventory.filter(i => i.stockTests <= i.minThreshold).length;

  const navItems = [
    { id: 'global_search', label: 'Global Search & Operations', icon: Search, badge: 'Global', badgeColor: 'bg-sky-100 text-sky-800 font-bold' },
    { id: 'registration', label: 'Test Registration (OPD/IPD)', icon: UserPlus, badge: patients.length, badgeColor: 'bg-slate-100 text-slate-700' },
    { id: 'worklist', label: 'Test Result & Worklist', icon: FlaskConical, badge: inTesting > 0 ? inTesting : null, badgeColor: 'bg-amber-100 text-amber-700' },
    { id: 'test_management', label: 'Test Parameter Master (1,148+)', icon: ListTree, badge: 'Master', badgeColor: 'bg-indigo-100 text-indigo-700 font-bold' },
    { id: 'phlebotomy', label: 'Phlebotomy & Accessioning', icon: TestTube, badge: pendingCollection > 0 ? pendingCollection : null, badgeColor: 'bg-purple-100 text-purple-700' },
    { id: 'doctor', label: 'Doctor Review & Sign-Off', icon: FileCheck2, badge: pendingApproval > 0 ? pendingApproval : null, badgeColor: 'bg-rose-100 text-rose-700 font-bold animate-pulse' },
    { id: 'reports', label: 'NABL Reports & Dispatch', icon: FileText, badge: authorized > 0 ? authorized : null, badgeColor: 'bg-emerald-100 text-emerald-700' },
    { id: 'report_designer', label: 'Report & Bill Designer', icon: Sliders, badge: 'Designer', badgeColor: 'bg-sky-100 text-sky-800 font-bold' },
    { id: 'machine_interface', label: 'Machine Interface & Config', icon: Cpu, badge: 'ASTM/HL7', badgeColor: 'bg-indigo-100 text-indigo-700 font-mono font-bold' },
    { id: 'dashboard', label: 'Dashboard & Analytics', icon: LayoutDashboard },
    { id: 'b2b', label: 'B2B Franchise Hub', icon: Building2 },
    { id: 'qc', label: 'Quality Control (L-J Charts)', icon: LineChart },
    { id: 'inventory', label: 'Reagent & Kit Inventory', icon: Boxes, badge: lowStock > 0 ? 'Low' : null, badgeColor: 'bg-amber-100 text-amber-700' },
    { id: 'settings', label: 'Lab & System Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Clinical Workflows
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-200 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 group-hover:scale-110'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lab Status Footer */}
      <div className="p-3 m-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-white shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] font-bold text-slate-200">Gondiya Care Center</span>
          </div>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-emerald-500/30">
            ONLINE
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          NABL ISO 15189:2022 Operations
        </p>
      </div>
    </aside>
  );
};
